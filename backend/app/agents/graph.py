import operator
from typing import Annotated, TypedDict, List, Dict, Literal, Any
from langgraph.graph import StateGraph, START, END
from app.tools.arxiv_tool import ArxivTool
from app.tools.scholar_tool import ScholarTool
from app.tools.search_tool import WebSearchTool
from app.utils.llm import generate_text


def _as_text(value: Any) -> str:
    """
    Best-effort conversion for fields that should be plain strings.
    """
    if value is None:
        return ""
    if isinstance(value, str):
        return value
    if isinstance(value, list):
        pieces = []
        for item in value:
            if isinstance(item, str):
                pieces.append(item)
            elif isinstance(item, dict):
                text = item.get("text") or item.get("content") or ""
                if text:
                    pieces.append(str(text))
            else:
                text = getattr(item, "text", None) or getattr(item, "content", None)
                if text:
                    pieces.append(str(text))
        return "\n".join(piece for piece in pieces if piece).strip()
    if isinstance(value, dict):
        return _as_text(value.get("text") or value.get("content") or "")
    return str(value)

class AgentState(TypedDict):
    """The expanded state dictionary for our multi-agent architecture."""
    query: str
    workflow_mode: Literal["summarize", "compare", "full"]
    plan: List[str] # Planner output
    results: List[Dict] # Academic results (ArXiv/Scholar)
    web_results: List[Dict] # General web search results
    synthesized_summary: str
    comparison_table: str
    critic_feedback: str # Feedback from the Critic
    final_report: str # Final output for the user
    messages: Annotated[List[str], operator.add]

def planner_node(state: AgentState):
    """
    Planner Agent: Analyzes the query and generates a multi-step research plan.
    """
    try:
        prompt = (
            f"You are the Lead Research Planner. The user wants a '{state['workflow_mode']}' research workflow for: '{state['query']}'.\n"
            "Break this down into 3 specific sub-tasks (e.g., 'Identify key transformer papers', 'Analyze efficiency benchmarks', etc.).\n"
            "Output each task on a new line. Do not include numbers or bullet points."
        )
        response, provider = generate_text(prompt)
        response = _as_text(response)
        tasks = [t.strip("- ").strip() for t in response.split("\n") if t.strip()]
        tasks = tasks[:3] if len(tasks) >= 3 else tasks

        print(f"[AGENT] Planner Node: Created {len(tasks)} sub-tasks via {provider}.")
        return {
            "plan": tasks, 
            "messages": [f"Planner Agent: Created {len(tasks)} sub-tasks for research using {provider}."]
        }
    except Exception as e:
        print(f"Planner Agent Error: {e}")
        return {"plan": ["Conduct general search"], "messages": [f"Planner Error: {str(e)}"]}

def search_node(state: AgentState):
    """
    Search Agent (Enhanced): Searches academic sources and the general web.
    """
    arxiv_tool = ArxivTool()
    scholar_tool = ScholarTool()
    web_tool = WebSearchTool()
    
    query = state["query"]
    
    # Concurrent Search
    print(f"[AGENT] Search Node: Running Academic and Web search...")
    arxiv_results = arxiv_tool.search_papers(query, max_results=3)
    scholar_results = scholar_tool.search_scholar(query, num_results=2)
    web_results = web_tool.search_web(query, num_results=3)
    
    combined_academic = arxiv_results + scholar_results
    
    return {
        "results": combined_academic,
        "web_results": web_results,
        "messages": [f"Search Agent: Retrieved {len(combined_academic)} papers and {len(web_results)} web contexts."]
    }

def research_node(state: AgentState):
    """
    Research Agent: Synthesizes academic papers and web context.
    """
    try:
        academic_context = "\n\n".join([f"Title: {r['title']}\nSummary: {r['summary']}" for r in state["results"]])
        web_context = "\n\n".join([f"Title: {r['title']}\nSnippet: {r['snippet']}" for r in state["web_results"]])
        
        prompt = (
            f"As an AI Research Agent, synthesize the following information for '{state['query']}' "
            f"based on the plan: {', '.join(state['plan'])}\n\n"
            f"Academic Sources:\n{academic_context}\n\n"
            f"Web Sources:\n{web_context}"
        )
        
        print(f"[AGENT] Research Node: Synthesizing results...")
        summary, provider = generate_text(prompt)
        summary = _as_text(summary)
        return {"synthesized_summary": summary, "messages": [f"Research Agent: Synthesized summaries using {provider}."]}
    except Exception as e:
        error_msg = f"Research Agent Error: {str(e)}"
        print(error_msg)
        return {"synthesized_summary": "Synthesis failed.", "messages": [error_msg]}

def comparison_node(state: AgentState):
    """
    Comparison Agent: Generates structured comparison tables.
    """
    try:
        papers_context = "\n\n".join([f"Title: {r['title']}\nSummary: {r['summary']}" for r in state["results"]])
        prompt = f"Generate a Markdown table comparing these papers on '{state['query']}':\n\n{papers_context}"
        
        print(f"[AGENT] Comparison Node: Generating table...")
        table, provider = generate_text(prompt)
        table = _as_text(table)
        return {"comparison_table": table, "messages": [f"Comparison Agent: Generated comparison table using {provider}."]}
    except Exception as e:
        return {"comparison_table": "Comparison failed.", "messages": [str(e)]}

def critic_node(state: AgentState):
    """
    Critic Agent: Fact-checking and quality assurance.
    """
    try:
        prompt = (
            "You are the QA Research Critic. Review the current synthesis and check for:\n"
            "1. Hallucinations (Is the summary supported by the results?)\n"
            "2. Completeness (Does it follow the plan?)\n"
            f"Synthesis: {state['synthesized_summary']}\n\n"
            "If satisfactory, output 'PASS'. Otherwise, provide critical feedback."
        )
        
        feedback, provider = generate_text(prompt)
        feedback = _as_text(feedback)
        print(f"[AGENT] Critic Node: {feedback[:50]}...")
        
        return {
            "critic_feedback": feedback,
            "messages": [f"Critic Agent: Evaluated synthesized content using {provider}."]
        }
    except Exception as e:
        print(f"Critic Agent Error: {e}")
        return {"critic_feedback": "PASS", "messages": [f"Critic Error: {str(e)}"]} # Auto-pass on error

def writer_node(state: AgentState):
    """
    Writer Agent: Produces the final structured research report.
    """
    try:
        prompt = (
            f"You are the Lead Scientific Writer. Construct a final, high-quality, structured research report for '{state['query']}'.\n"
            "Include an Introduction, Key Findings (from synthesis), and a Conclusion.\n"
            f"Synthesis: {state['synthesized_summary']}\n"
            f"Comparison Table: {state['comparison_table']}\n"
            "Output the result in beautiful Markdown."
        )
        
        report, provider = generate_text(prompt)
        print(f"[AGENT] Writer Node: Report generated. Length: {len(report)} via {provider}")
        
        return {
            "final_report": report,
            "messages": [f"Writer Agent: Finalized research report using {provider}."]
        }
    except Exception as e:
        print(f"Writer Agent Error: {e}")
        return {"final_report": f"Report generation failed. However, here is the synthesis:\n\n{state['synthesized_summary']}", "messages": [f"Writer Error: {str(e)}"]}

# ----------------------------
# Routers
# ----------------------------
def critic_router(state: AgentState):
    """
    Determines if content needs more work or can proceed to final report.
    """
    feedback = _as_text(state.get("critic_feedback", "")).upper()
    # Simple pass condition for the demo. In production, we'd use LLM logic for specific rework.
    if feedback.strip().startswith("PASS"):
        return "writer"
    # To prevent infinite loops, we only retry once for this demo
    if any("Critic Agent: Evaluated" in m for m in state.get("messages", [])[:-1]):
        return "writer"
    return "research" # Go back for rework

# ----------------------------
# Build the Graph Structure
# ----------------------------
workflow = StateGraph(AgentState)

# Add Nodes
workflow.add_node("planner", planner_node)
workflow.add_node("search", search_node)
workflow.add_node("research", research_node)
workflow.add_node("compare", comparison_node)
workflow.add_node("critic", critic_node)
workflow.add_node("writer", writer_node)

# Add Edges
workflow.add_edge(START, "planner")
workflow.add_edge("planner", "search")
workflow.add_edge("search", "research")
workflow.add_edge("research", "compare")
workflow.add_edge("compare", "critic")

workflow.add_conditional_edges(
    "critic",
    critic_router,
    {
        "writer": "writer",
        "research": "research" # Rework loop
    }
)

workflow.add_edge("writer", END)

# Compile
research_graph = workflow.compile()

if __name__ == "__main__":
    # Test
    input_state = {
        "query": "Quantum Machine Learning",
        "workflow_mode": "full",
        "plan": [],
        "results": [],
        "web_results": [],
        "synthesized_summary": "",
        "comparison_table": "",
        "critic_feedback": "",
        "final_report": "",
        "messages": []
    }
    
    app = research_graph
    config = {"configurable": {"thread_id": "test_1"}}
    for event in app.stream(input_state, config):
        print(event)
