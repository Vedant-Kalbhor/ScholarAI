import os
from typing import Optional, Tuple

import requests
from langchain_google_genai import ChatGoogleGenerativeAI

DEFAULT_GEMINI_MODEL = "gemini-2.5-pro"
DEFAULT_OLLAMA_MODEL = "llama3:latest"


def _invoke_gemini(prompt: str, model: str = DEFAULT_GEMINI_MODEL) -> str:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not set.")

    llm = ChatGoogleGenerativeAI(model=model, google_api_key=api_key)
    response = llm.invoke(prompt)
    content = getattr(response, "content", "")
    if not content:
        raise RuntimeError("Gemini returned an empty response.")
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
    content = data.get("message", {}).get("content", "").strip()
    if not content:
        raise RuntimeError("Ollama returned an empty response.")
    return content


def generate_text(
    prompt: str,
    *,
    system: Optional[str] = None,
    preferred_model: str = DEFAULT_GEMINI_MODEL,
    fallback_model: str = DEFAULT_OLLAMA_MODEL,
) -> Tuple[str, str]:
    """
    Generate text using Gemini first, then fall back to a local Ollama model.

    Returns:
        A tuple of (generated_text, provider_label).
    """
    gemini_error = None
    if os.getenv("GEMINI_API_KEY"):
        try:
            return _invoke_gemini(prompt, model=preferred_model), f"gemini:{preferred_model}"
        except Exception as exc:
            gemini_error = exc

    try:
        return _invoke_ollama(prompt, model=fallback_model, system=system), f"ollama:{fallback_model}"
    except Exception as exc:
        if gemini_error is not None:
            raise RuntimeError(
                f"LLM generation failed. Gemini error: {gemini_error}; Ollama error: {exc}"
            ) from exc
        raise RuntimeError(f"LLM generation failed via Ollama: {exc}") from exc
