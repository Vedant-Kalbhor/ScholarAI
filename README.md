# 🎓 AI Research Assistant with MCP

A modern, intelligent AI system designed to help researchers discover, analyze, and synthesize research papers automatically. This project leverages **Multi-Agent Orchestration** via LangGraph and **Retrieval-Augmented Generation (RAG)** to transform the literature review process.

---

## 🚀 Overview

Researchers and students often face the daunting task of reading hundreds of papers, many of which may not be directly relevant, and then manually comparing their contributions. **AI Research Assistant** automates this by:
- **Planning**: Breaking complex queries into actionable sub-tasks.
- **Gathering**: Concurrent searching across ArXiv, Google Scholar, and the general Web.
- **Synthesizing**: Deep analysis using state-of-the-art LLMs.
- **Validating**: A "Critic Agent" check to avoid hallucinations.
- **Reporting**: Generating structured, publication-ready Markdown reports.
- **Model Fallbacks**: Gemini first, then Groq, then local Ollama `llama3:latest`.

---

## ✨ Features

- **🔍 Multi-Source Search (Enhanced)**: Concurrent querying of ArXiv, Google Scholar, and general search (SerpAPI).
- **🤖 Advanced Multi-Agent Orchestration**:
  - **Planner Agent**: Breaks down queries into 3-4 research goals.
  - **Search Agent**: Intelligent retrieval of academic and web context.
  - **Research Agent**: Deep synthesis of retrieved sources.
  - **Critic Agent**: Quality control loop for fact-checking and hallucination detection.
  - **Writer Agent**: Final formatting into premium, structured reports.
- **📄 PDF RAG Pipeline**: Upload local PDFs for instant chunking, vector storage (ChromaDB), and interactive Q&A.
- **📊 Premium Dashboard**: 
  - Glassmorphic UI with Dark Mode.
  - "Research Timeline" visualization of LLM evolution.
  - Management of "Saved Papers" and collections.

---

## 🛠️ Technology Stack

### **Backend**
- **Framework**: FastAPI (High-performance Python)
- **Orchestration**: LangGraph (Stateful agentic workflows)
- **AI/LLM**: Google Gemini, Groq, and local Ollama fallback
- **Vector DB**: ChromaDB (for local RAG)
- **Tools**: ArXiv API, SerpAPI (Google Scholar & Google Search)

### **Frontend**
- **Framework**: React.js with Vite
- **Styling**: Tailwind CSS (Premium Glassmorphism Design)
- **Icons**: Lucide-React
- **Markdown**: React Markdown (with GFM tables support)

---

## ⚙️ Setup & Installation

### **Prerequisites**
- Python 3.10+
- Node.js 18+
- API Keys: 
  - [Google AI Studio (Gemini)](https://aistudio.google.com/)
  - [SerpAPI](https://serpapi.com/) (Required for Scholar/Web results)

### **1. Clone the Repository**
```bash
git clone https://github.com/Vedant-Kalbhor/ScholarAI.git
cd ScholarAI
```

### **2. Backend Setup**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in the root directory:
```env
GEMINI_API_KEY=your_gemini_key_here
GROQ_API_KEY=your_groq_key_here
SERPAPI_API_KEY=your_serpapi_key_here
GROQ_MODEL=llama-3.1-70b-versatile
OLLAMA_MODEL=llama3:latest
```

Run the server:
```bash
cd backend
uvicorn app.main:app --reload
```

### **3. Frontend Setup**
```bash
cd frontend
npm install
npm run dev
```

The application will be available at `http://localhost:5173`.

---

## 📁 Project Structure

```text
ScholarAI/
├── backend/            # FastAPI Source Code
│   ├── app/
│   │   ├── agents/    # LangGraph Multi-Agent Workflows
│   │   ├── pdf/       # PDF Extraction Logic
│   │   ├── rag/       # Vector Store & Search Logic
│   │   └── tools/     # Search & Extraction Tools
│   └── requirements.txt
├── frontend/           # React + Vite Application
│   ├── src/
│   │   ├── components/# Modular UI Components
│   │   └── App.jsx    # Main Layout
│   └── tailwind.config.js
├── data/               # Vector storage
└── README.md
```

--- 

## Deployment

Yes, this setup works well with:
- **Frontend:** Vercel
- **Backend:** Render FastAPI service
- **Vector DB:** ChromaDB persisted on a Render disk attached to the backend service

### 1. Deploy the backend on Render

Use the `render.yaml` blueprint in the repo root or create the service manually.

If you use the blueprint:
1. Push the repo to GitHub.
2. In Render, create a new Blueprint from the repository.
3. Set your secret values for `GEMINI_API_KEY`, `GROQ_API_KEY`, `SERPAPI_API_KEY`, and any Zotero values.
4. Keep the persistent disk mounted at `/app/data`.
5. The backend will store ChromaDB at `/app/data/chromadb`.

Important Render settings:
- Service type: `Web Service`
- Environment: `Docker`
- Root directory: `backend`
- Disk mount path: `/app/data`
- Start command: handled by the backend `Dockerfile`

What the disk is doing:
- ChromaDB writes its SQLite metadata and vector segments into that mounted path.
- Without a disk, Render’s filesystem is ephemeral and your indexed PDFs would disappear after redeploys.

### 2. Deploy the frontend on Vercel

Deploy the `frontend` directory as a Vercel project.

Use these settings:
- Framework preset: `Vite`
- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`

Set this environment variable in Vercel:
- `VITE_API_URL` = your Render backend URL, for example `https://researchassist-backend.onrender.com`

### 3. Configure backend CORS

Add your Vercel domain to `BACKEND_CORS_ORIGINS` on Render, for example:
```env
BACKEND_CORS_ORIGINS=http://localhost:5173,http://localhost:5174,https://your-app.vercel.app
```

### 4. Local development

For local testing:
- Backend: `uvicorn app.main:app --reload`
- Frontend: `npm run dev`
- ChromaDB: stored under `./data/chromadb` unless `VECTOR_DB_PATH` is set

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

---

*Designed with ❤️ by [Vedant Kalbhor](https://github.com/Vedant-Kalbhor)*
