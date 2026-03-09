from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from backend.app.rag.vector_store import VectorStoreManager
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.prompts import PromptTemplate
import os

class RAGEngine:
    def __init__(self):
        self.vector_store_manager = VectorStoreManager()
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash", 
            google_api_key=os.getenv("GEMINI_API_KEY")
        )

    def process_and_store_text(self, text: str, source_id: str = "unknown"):
        """
        Takes raw text, splits into chunks using Langchain's RecursiveCharacterTextSplitter,
        and stores in Vector DB.
        """
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
            is_separator_regex=False,
        )
        texts = text_splitter.split_text(text)
        
        # Convert to Document objects
        docs = [Document(page_content=t, metadata={"source": source_id}) for t in texts]
        
        # Add to vector store
        self.vector_store_manager.add_documents(docs)
        
        return len(docs)

    def summarize_text(self, text: str) -> str:
        """
        Summarizes raw text directly using the prompt.
        For large PDFs, this may hit token limits, but for demonstration of "Summarize PDF" it works.
        Alternatively, one could summarize the documents in ChromaDB using a map-reduce.
        """
        # If text is too long, we truncate it for a direct summary
        prompt = PromptTemplate.from_template("Please summarize the following research paper text concisely. Highlight the Problem, Methodology, Results, and Contribution:\n\n{text}")
        
        # Taking up to first 30k characters to prevent limit issues on direct summarizing
        truncated_text = text[:30000]
        chain = prompt | self.llm
        
        response = chain.invoke({"text": truncated_text})
        return response.content

    def ask_question(self, query: str):
        """
        Finds relevant documents and asks the LLM a question.
        """
        docs = self.vector_store_manager.search(query)
        context = "\n\n".join([d.page_content for d in docs])
        
        prompt = PromptTemplate.from_template(
            "You are an AI Research Assistant. Answer the question based on the provided context.\n\nContext:\n{context}\n\nQuestion:\n{query}\n\nAnswer:"
        )
        
        chain = prompt | self.llm
        response = chain.invoke({"context": context, "query": query})
        
        return response.content
