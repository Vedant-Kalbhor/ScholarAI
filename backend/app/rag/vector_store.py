import os
from langchain_chroma import Chroma
from langchain_google_genai import GoogleGenerativeAIEmbeddings

class VectorStoreManager:
    def __init__(self, persist_directory: str = "./backend/data/chromadb", collection_name: str = "research_papers"):
        self.persist_directory = persist_directory
        self.collection_name = collection_name
        
        # Initialize Google Embeddings
        # Uses GEMINI_API_KEY from environment via dotenv
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable not set.")
            
        self.embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001", google_api_key=api_key)
        
        # Initialize ChromaDB
        self.vector_store = Chroma(
            collection_name=self.collection_name,
            embedding_function=self.embeddings,
            persist_directory=self.persist_directory
        )

    def add_documents(self, documents):
        """
        Add chunked documents to Chroma vector store.
        """
        self.vector_store.add_documents(documents)

    def search(self, query: str, k: int = 4):
        """
        Similarity search.
        """
        return self.vector_store.similarity_search(query, k=k)

    def as_retriever(self, search_kwargs={"k": 4}):
        return self.vector_store.as_retriever(search_kwargs=search_kwargs)
