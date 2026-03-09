import os
from typing import Annotated, TypedDict, List, Dict, Literal
from langgraph.graph import StateGraph, START, END
from langchain_google_genai import ChatGoogleGenerativeAI
from backend.app.tools.arxiv_tool import ArxivTool
from backend.app.tools.scholar_tool import ScholarTool

class AgentState(TypedDict):
    """The state dictionary for our agents."""
    query: str
    workflow_mode: Literal["summarize", "compare", "full"] # Determine which branch to take
    results: List[Dict] # Accumulated paper results
    synthesized_summary: str
    comparison_table: str
    messages: Annotated[List[str], "Append only list of state messages"]

def search_node(state: AgentState):
    """
    Search Node: Handled by 'Search Agent'. Gets data from ArXiv and Scholar concurrently.
    """
    arxiv_tool = ArxivTool()
    scholar_tool = ScholarTool()
    
    query = state["query"]
    
    # Query Both
    arxiv_results = arxiv_tool.search_papers(query, max_results=3)
    scholar_results = scholar_tool.search_scholar(query, num_results=2)
    
    combined = arxiv_results + scholar_results
    
    return {
        "results": combined, 
        "messages": [f"Search Agent: Found {len(arxiv_results)} on ArXiv and {len(scholar_results)} on Scholar."]
    }

def research_node(state: AgentState):
    """
    Research Agent: Synthesizes the information retrieved from Search Agent.
    """
    llm = ChatGoogleGenerativeAI(model="gemini-2.0-flash", google_api_key=os.getenv("GEMINI_API_KEY"))
    
    papers_context = "\n\n".join([f"Title: {r['title']}\nSummary: {r['summary']}" for r in state["results"]])
    prompt = f"As an AI Research Agent, summarize the key findings from these papers related to '{state['query']}':\n\n{papers_context}"
    
    summary = llm.invoke(prompt).content
    
    return {"synthesized_summary": summary, "messages": ["Research Agent: Synthesized summaries."]}

def comparison_node(state: AgentState):
    """
    Comparison Agent: Generates structured comparison tables.
    """
    llm = ChatGoogleGenerativeAI(model="gemini-2.0-flash", google_api_key=os.getenv("GEMINI_API_KEY"))
    
    papers_context = "\n\n".join([f"Title: {r['title']}\nSummary: {r['summary']}" for r in state["results"]])
    prompt = (
        f"As an AI Comparison Agent, analyze the following papers on '{state['query']}' "
        f"and output a Markdown table comparing their Core Focus, Methodology, and Contributions.\n\n"
        f"Papers:\n{papers_context}"
    )
    
    table = llm.invoke(prompt).content
    
    return {"comparison_table": table, "messages": ["Comparison Agent: Generated comparison table."]}

def router_node(state: AgentState) -> Literal["research_node", "comparison_node", "both"]:
    """
    Conditional router to dictate flow after Search.
    """
    mode = state.get("workflow_mode", "summarize")
    if mode == "compare":
        return "comparison_node"
    elif mode == "full":
        return "both"
    else:
        return "research_node"

# ----------------------------
# Build the Graph Structure
# ----------------------------
workflow = StateGraph(AgentState)

# Add Nodes
workflow.add_node("search", search_node)
workflow.add_node("research", research_node)
workflow.add_node("compare", comparison_node)

# Add Edges
workflow.add_edge(START, "search")

# Conditional Edge from search to respective workflows
workflow.add_conditional_edges(
    "search",
    router_node,
    {
        "research_node": "research",
        "comparison_node": "compare",
        "both": ["research", "compare"] # Parallelize synthesis & compare (LangGraph 0.1+ supports parallel fan-out)
    }
)

workflow.add_edge("research", END)
workflow.add_edge("compare", END)

# Compile the Graph
research_graph = workflow.compile()

if __name__ == "__main__":
    app = research_graph
    config = {"configurable": {"thread_id": "demo_1"}}
    
    # Test Full Workflow
    input_state = {
        "query": "Agentic AI workflows", 
        "workflow_mode": "full", 
        "results": [], 
        "synthesized_summary": "",
        "comparison_table": "",
        "messages": []
    }
    
    for event in app.stream(input_state, config):
        print(f"Node Executed: {list(event.keys())[0]}")
