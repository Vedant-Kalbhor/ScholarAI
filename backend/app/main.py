from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from dotenv import load_dotenv

# App modules
from app.pdf.parser import PDFParser
from app.rag.engine import RAGEngine
from app.agents.graph import research_graph

# Load environment variables
load_dotenv()
# If key is not found, try looking up one directory (common when running from /backend)
if not os.getenv("GEMINI_API_KEY"):
    env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.env"))
    load_dotenv(dotenv_path=env_path)

app = FastAPI(title="AI Research Assistant API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QueryRequest(BaseModel):
    query: str
    mode: str = "full" # can be summarize, compare, or full

@app.get("/")
async def root():
    return {"message": "AI Research Assistant API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/api/research")
async def process_research_query(req: QueryRequest):
    """
    Orchestrates the research using the new Planner-Search-Critic-Writer workflow.
    """
    config = {"configurable": {"thread_id": f"api_call_{os.urandom(4).hex()}"}}
    input_state = {
        "query": req.query, 
        "workflow_mode": req.mode,
        "plan": [],
        "results": [], 
        "web_results": [],
        "synthesized_summary": "", 
        "comparison_table": "",
        "critic_feedback": "",
        "final_report": "",
        "messages": []
    }
    
    print(f"\n[BACKEND] Starting Agentic Research Workflow for: '{req.query}'")
    output_state = research_graph.invoke(input_state, config)
    print(f"[BACKEND] Workflow Complete. Paper results: {len(output_state.get('results', []))}")
    
    return {
        "plan": output_state.get("plan", []),
        "results": output_state.get("results", []),
        "web_results": output_state.get("web_results", []),
        "summary": output_state.get("synthesized_summary", ""),
        "comparison": output_state.get("comparison_table", ""),
        "final_report": output_state.get("final_report", ""),
        "messages": output_state.get("messages", [])
    }

@app.post("/api/pdf/upload")
async def upload_pdf(file: UploadFile = File(...)):
    """
    Extracts text from uploaded PDF, stores in Vector DB, and generates a summary.
    """
    try:
        # Extract text using PyPDF2
        raw_text = await PDFParser.extract_text_from_upload(file)
        
        # Ensure RAG Engine is initialized
        engine = RAGEngine()
        
        # Chunk text and store in VectorDB
        num_chunks = engine.process_and_store_text(raw_text, source_id=file.filename)
        
        # Generate summary
        summary = engine.summarize_text(raw_text)
        
        return {
            "message": "PDF uploaded, parsed, and indexed successfully.",
            "filename": file.filename,
            "chunks_stored": num_chunks,
            "summary": summary
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": str(e)}

@app.post("/api/pdf/query")
async def query_pdf(req: QueryRequest):
    """
    Queries content previously ingested from PDFs.
    """
    engine = RAGEngine()
    answer = engine.ask_question(req.query)
    
    return {
        "answer": answer
    }
