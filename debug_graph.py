import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.agents.graph import research_graph

input_state = {
    "query": "Graph Neural Networks",
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

try:
    print("Inoking research_graph...")
    res = research_graph.invoke(input_state)
    print("Success!")
    print(res.get("final_report")[:100])
except Exception as e:
    print(f"Error caught: {e}")
    import traceback
    traceback.print_exc()
