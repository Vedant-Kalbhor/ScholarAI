import os
from typing import Any, Optional, Tuple

import requests
from langchain_google_genai import ChatGoogleGenerativeAI

DEFAULT_GEMINI_MODEL = "gemini-3.5-flash"
DEFAULT_GROQ_MODEL = "llama-3.1-70b-versatile"
DEFAULT_OLLAMA_MODEL = "llama3:latest"


def _normalize_content(content: Any) -> str:
    """
    Convert model responses into a plain string.

    Some providers return content blocks such as:
    - str
    - list[{"type": "text", "text": "..."}]
    - dict-like message payloads

    The research workflow expects plain text, so we flatten these shapes here.
    """
    if content is None:
        return ""
    if isinstance(content, str):
        return content.strip()
    if isinstance(content, list):
        parts = []
        for item in content:
            if isinstance(item, str):
                parts.append(item)
            elif isinstance(item, dict):
                text = item.get("text") or item.get("content") or ""
                if text:
                    parts.append(str(text))
            else:
                text = getattr(item, "text", None) or getattr(item, "content", None)
                if text:
                    parts.append(str(text))
        return "\n".join(part.strip() for part in parts if part and str(part).strip()).strip()
    if isinstance(content, dict):
        return _normalize_content(content.get("text") or content.get("content") or "")
    return str(content).strip()


def _invoke_gemini(prompt: str, model: str = DEFAULT_GEMINI_MODEL) -> str:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not set.")

    llm = ChatGoogleGenerativeAI(model=model, google_api_key=api_key)
    response = llm.invoke(prompt)
    content = _normalize_content(getattr(response, "content", ""))
    if not content:
        raise RuntimeError("Gemini returned an empty response.")
    return content


def _invoke_groq(
    prompt: str,
    model: str = DEFAULT_GROQ_MODEL,
    system: Optional[str] = None,
) -> str:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY is not set.")

    payload = {
        "model": model,
        "messages": [],
        "temperature": 0.2,
    }

    if system:
        payload["messages"].append({"role": "system", "content": system})

    payload["messages"].append({"role": "user", "content": prompt})

    response = requests.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        json=payload,
        timeout=180,
    )
    response.raise_for_status()
    data = response.json()
    choices = data.get("choices") or []
    content = ""
    if choices:
        content = _normalize_content(choices[0].get("message", {}).get("content", ""))
    if not content:
        raise RuntimeError("Groq returned an empty response.")
    return content


def _invoke_ollama(
    prompt: str,
    model: str = DEFAULT_OLLAMA_MODEL,
    system: Optional[str] = None,
) -> str:
    host = os.getenv("OLLAMA_HOST", "http://localhost:11434").rstrip("/")
    payload = {
        "model": model,
        "messages": [],
        "stream": False,
    }

    if system:
        payload["messages"].append({"role": "system", "content": system})

    payload["messages"].append({"role": "user", "content": prompt})

    response = requests.post(f"{host}/api/chat", json=payload, timeout=180)
    response.raise_for_status()
    data = response.json()
    content = _normalize_content(data.get("message", {}).get("content", ""))
    if not content:
        raise RuntimeError("Ollama returned an empty response.")
    return content


def generate_text(
    prompt: str,
    *,
    system: Optional[str] = None,
    preferred_model: str = DEFAULT_GEMINI_MODEL,
    groq_model: str = DEFAULT_GROQ_MODEL,
    fallback_model: str = DEFAULT_OLLAMA_MODEL,
) -> Tuple[str, str]:
    """
    Generate text using Gemini first, then Groq, then a local Ollama model.

    Returns:
        A tuple of (generated_text, provider_label).
    """
    preferred_model = os.getenv("GEMINI_MODEL", preferred_model)
    groq_model = os.getenv("GROQ_MODEL", groq_model)
    fallback_model = os.getenv("OLLAMA_MODEL", fallback_model)

    gemini_error = None
    if os.getenv("GEMINI_API_KEY"):
        try:
            return _invoke_gemini(prompt, model=preferred_model), f"gemini:{preferred_model}"
        except Exception as exc:
            gemini_error = exc

    groq_error = None
    if os.getenv("GROQ_API_KEY"):
        try:
            return _invoke_groq(prompt, model=groq_model, system=system), f"groq:{groq_model}"
        except Exception as exc:
            groq_error = exc

    try:
        return _invoke_ollama(prompt, model=fallback_model, system=system), f"ollama:{fallback_model}"
    except Exception as exc:
        if gemini_error is not None or groq_error is not None:
            errors = []
            if gemini_error is not None:
                errors.append(f"Gemini error: {gemini_error}")
            if groq_error is not None:
                errors.append(f"Groq error: {groq_error}")
            raise RuntimeError(
                f"LLM generation failed. {'; '.join(errors)}; Ollama error: {exc}"
            ) from exc
        raise RuntimeError(f"LLM generation failed via Ollama: {exc}") from exc
