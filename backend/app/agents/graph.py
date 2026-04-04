import os
import operator
from typing import Annotated, TypedDict, List, Dict, Literal
from langgraph.graph import StateGraph, START, END
from langchain_google_genai import ChatGoogleGenerativeAI
from app.tools.arxiv_tool import ArxivTool
from app.tools.scholar_tool import ScholarTool
from app.tools.search_tool import WebSearchTool

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
        llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", google_api_key=os.getenv("GEMINI_API_KEY"))
        
        prompt = (
            f"You are the Lead Research Planner. The user wants a '{state['workflow_mode']}' research workflow for: '{state['query']}'.\n"
            "Break this down into 3 specific sub-tasks (e.g., 'Identify key transformer papers', 'Analyze efficiency benchmarks', etc.).\n"
            "Output each task on a new line. Do not include numbers or bullet points."
        )
        
        response = llm.invoke(prompt).content
        tasks = [t.strip("- ") for t in response.split("\n") if t.strip()]
        
        print(f"[AGENT] Planner Node: Created {len(tasks)} sub-tasks.")
        return {
            "plan": tasks, 
            "messages": [f"Planner Agent: Created {len(tasks)} sub-tasks for research."]
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
        llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", google_api_key=os.getenv("GEMINI_API_KEY"))
        
        academic_context = "\n\n".join([f"Title: {r['title']}\nSummary: {r['summary']}" for r in state["results"]])
        web_context = "\n\n".join([f"Title: {r['title']}\nSnippet: {r['snippet']}" for r in state["web_results"]])
        
        prompt = (
            f"As an AI Research Agent, synthesize the following information for '{state['query']}' "
            f"based on the plan: {', '.join(state['plan'])}\n\n"
            f"Academic Sources:\n{academic_context}\n\n"
            f"Web Sources:\n{web_context}"
        )
        
        print(f"[AGENT] Research Node: Synthesizing results...")
        summary = llm.invoke(prompt).content
        return {"synthesized_summary": summary, "messages": ["Research Agent: Synthesized summaries."]}
    except Exception as e:
        error_msg = f"Research Agent Error: {str(e)}"
        print(error_msg)
        return {"synthesized_summary": "Synthesis failed.", "messages": [error_msg]}

def comparison_node(state: AgentState):
    """
    Comparison Agent: Generates structured comparison tables.
    """
    try:
        llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", google_api_key=os.getenv("GEMINI_API_KEY"))
        
        papers_context = "\n\n".join([f"Title: {r['title']}\nSummary: {r['summary']}" for r in state["results"]])
        prompt = f"Generate a Markdown table comparing these papers on '{state['query']}':\n\n{papers_context}"
        
        print(f"[AGENT] Comparison Node: Generating table...")
        table = llm.invoke(prompt).content
        return {"comparison_table": table, "messages": ["Comparison Agent: Generated comparison table."]}
    except Exception as e:
        return {"comparison_table": "Comparison failed.", "messages": [str(e)]}

def critic_node(state: AgentState):
    """
    Critic Agent: Fact-checking and quality assurance.
    """
    try:
        llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", google_api_key=os.getenv("GEMINI_API_KEY"))
        
        prompt = (
            "You are the QA Research Critic. Review the current synthesis and check for:\n"
            "1. Hallucinations (Is the summary supported by the results?)\n"
            "2. Completeness (Does it follow the plan?)\n"
            f"Synthesis: {state['synthesized_summary']}\n\n"
            "If satisfactory, output 'PASS'. Otherwise, provide critical feedback."
        )
        
        feedback = llm.invoke(prompt).content
        print(f"[AGENT] Critic Node: {feedback[:50]}...")
        
        return {
            "critic_feedback": feedback,
            "messages": [f"Critic Agent: Evaluated synthesized content."]
        }
    except Exception as e:
        print(f"Critic Agent Error: {e}")
        return {"critic_feedback": "PASS", "messages": [f"Critic Error: {str(e)}"]} # Auto-pass on error

def writer_node(state: AgentState):
    """
    Writer Agent: Produces the final structured research report.
    """
    try:
        llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", google_api_key=os.getenv("GEMINI_API_KEY"))
        
        prompt = (
            f"You are the Lead Scientific Writer. Construct a final, high-quality, structured research report for '{state['query']}'.\n"
            "Include an Introduction, Key Findings (from synthesis), and a Conclusion.\n"
            f"Synthesis: {state['synthesized_summary']}\n"
            f"Comparison Table: {state['comparison_table']}\n"
            "Output the result in beautiful Markdown."
        )
        
        report = llm.invoke(prompt).content
        print(f"[AGENT] Writer Node: Report generated. Length: {len(report)}")
        
        return {
            "final_report": report,
            "messages": ["Writer Agent: Finalized research report."]
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
    feedback = state.get("critic_feedback", "").upper()
    # Simple pass condition for the demo. In production, we'd use LLM logic for specific rework.
    if "PASS" in feedback:
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
