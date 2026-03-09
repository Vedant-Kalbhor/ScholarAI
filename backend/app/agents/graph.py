from typing import Annotated, TypedDict, List
from langgraph.graph import StateGraph, START, END
from langchain_google_genai import ChatGoogleGenerativeAI
from backend.app.tools.arxiv_tool import ArxivTool
import os

class AgentState(TypedDict):
    query: str
    results: List[Dict]
    summaries: str
    messages: Annotated[List[str], "Append only list of state messages"]

def search_node(state: AgentState):
    """
    Search for papers on ArXiv.
    """
    tool = ArxivTool()
    results = tool.search_papers(state["query"])
    return {"results": results, "messages": [f"Found {len(results)} papers."]}

def summarize_node(state: AgentState):
    """
    Summarize the found papers using Gemini.
    """
    llm = ChatGoogleGenerativeAI(model="gemini-2.0-flash", google_api_key=os.getenv("GEMINI_API_KEY"))
    
    papers_text = "\n\n".join([f"Title: {r['title']}\nSummary: {r['summary']}" for r in state["results"]])
    prompt = f"Summarize the following papers related to '{state['query']}':\n\n{papers_text}"
    
    summary = llm.invoke(prompt).content
    return {"summaries": summary, "messages": ["Generated summaries using Gemini."]}

# Create the Graph
workflow = StateGraph(AgentState)

# Add Nodes
workflow.add_node("search", search_node)
workflow.add_node("summarize", summarize_node)

# Add Edges
workflow.add_edge(START, "search")
workflow.add_edge("search", "summarize")
workflow.add_edge("summarize", END)

# Compile the Graph
research_graph = workflow.compile()

if __name__ == "__main__":
    # Test the graph
    app = research_graph
    config = {"configurable": {"thread_id": "1"}}
    input_state = {"query": "Large Language Models in Finance", "results": [], "summaries": "", "messages": []}
    
    for event in app.stream(input_state, config):
        print(f"Node: {list(event.keys())[0]}")
        for k, v in event.items():
             if 'messages' in v:
                print(v['messages'][-1])
