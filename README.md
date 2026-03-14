# 🎓 AI Research Assistant with MCP

A modern, intelligent AI system designed to help researchers discover, analyze, and synthesize research papers automatically. This project leverages **Multi-Agent Orchestration** via LangGraph and **Retrieval-Augmented Generation (RAG)** to transform the literature review process.

---

## 🚀 Overview

Researchers and students often face the daunting task of reading hundreds of papers, many of which may not be directly relevant, and then manually comparing their contributions. **AI Research Assistant** automates this by:
- **Searching** across multiple sources (ArXiv, Google Scholar) using specialized agents.
- **Synthesizing** key findings and contributions automatically.
- **Comparing** papers in structured Markdown tables.
- **Analyzing** local PDFs through a high-performance RAG pipeline.

---

## ✨ Features

- **🔍 Multi-Source Search**: Concurrent querying of ArXiv and Google Scholar.
- **🤖 Multi-Agent Orchestration**:
  - **Search Agent**: Intelligent retrieval of relevant metadata.
  - **Research Agent**: Deep synthesis of paper clusters.
  - **Comparison Agent**: Structured matrix generation for methodology and results.
- **📄 PDF RAG Pipeline**: Upload PDFs for instant chunking, vector storage (ChromaDB), and Q&A.
- **📊 Premium Dashboard**: 
  - Glassmorphic UI with Dark Mode.
  - "Research Timeline" visualization of LLM evolution.
  - Management of "Saved Papers" and collections.
- **⚡ Real-time Feedback**: Intelligent loading states and error handling for API quotas.

---

## 🛠️ Technology Stack

### **Backend**
- **Framework**: FastAPI (High-performance Python)
- **Orchestration**: LangGraph (Stateful agentic workflows)
- **AI/LLM**: Google Gemini 2.0 Flash / Pro
- **Vector DB**: ChromaDB (for local RAG)
- **PDF Extraction**: PyPDF2
- **Integrations**: ArXiv API, SerpAPI (Google Scholar)

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
  - [SerpAPI](https://serpapi.com/) (Optional, for Scholar results)

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

Create a `.env` file in the root directory with the following:
```env
GEMINI_API_KEY=your_gemini_key_here
SERPAPI_API_KEY=your_serpapi_key_here
```

Run the server:
```bash
uvicorn backend.app.main:app --reload
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
│   │   ├── agents/    # LangGraph State Machine
│   │   ├── pdf/       # PDF Extraction Logic
│   │   ├── rag/       # Vector Store & Search Logic
│   │   └── tools/     # ArXiv & Scholar Tool Scripts
│   └── requirements.txt
├── frontend/           # React + Vite Application
│   ├── src/
│   │   ├── components/# Modular UI Components
│   │   └── App.jsx    # Main Layout & Routing
│   └── tailwind.config.js
├── data/               # Local data/vector storage
└── README.md
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## 📄 License

This project is licensed under the MIT License.

---

*Designed with ❤️ by [Vedant Kalbhor](https://github.com/Vedant-Kalbhor)*
