from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from dotenv import load_dotenv

# App modules
from backend.app.pdf.parser import PDFParser
from backend.app.rag.engine import RAGEngine
from backend.app.agents.graph import research_graph

load_dotenv()

app = FastAPI(title="AI Research Assistant API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this in production
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
    Orchestrates the research using LangGraph's new Multi-Agent Workflow
    """
    config = {"configurable": {"thread_id": "api_call"}}
    input_state = {
        "query": req.query, 
        "workflow_mode": req.mode,
        "results": [], 
        "synthesized_summary": "", 
        "comparison_table": "",
        "messages": []
    }
    
    # Run graph synchronously for API simplicity
    output_state = research_graph.invoke(input_state, config)
    
    return {
        "results": output_state.get("results", []),
        "summary": output_state.get("synthesized_summary", ""),
        "comparison": output_state.get("comparison_table", ""),
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
