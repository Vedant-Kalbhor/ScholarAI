import os
import hashlib
import math
import re
from langchain_chroma import Chroma
from langchain_google_genai import GoogleGenerativeAIEmbeddings


class StableHashEmbeddings:
    """
    Minimal local fallback embedding function for Chroma.

    This keeps PDF RAG usable even when Gemini embeddings are unavailable.
    """

    def __init__(self, dimensions: int = 768):
        self.dimensions = dimensions

    def _vectorize(self, text: str):
        vector = [0.0] * self.dimensions
        tokens = re.findall(r"[A-Za-z0-9_]+", text.lower())
        for token in tokens:
            digest = hashlib.sha256(token.encode("utf-8")).digest()
            index = int.from_bytes(digest[:4], "big") % self.dimensions
            weight = 1.0 + (len(token) / 10.0)
            vector[index] += weight

        norm = math.sqrt(sum(value * value for value in vector))
        if norm == 0:
            return vector
        return [value / norm for value in vector]

    def embed_documents(self, texts):
        return [self._vectorize(text) for text in texts]

    def embed_query(self, text):
        return self._vectorize(text)

class VectorStoreManager:
    def __init__(self, persist_directory: str = "./backend/data/chromadb", collection_name: str = "research_papers"):
        self.persist_directory = persist_directory
        self.collection_name = collection_name
        
        api_key = os.getenv("GEMINI_API_KEY")
        self.embeddings = None

        if api_key:
            try:
                self.embeddings = GoogleGenerativeAIEmbeddings(
                    model="models/embedding-001",
                    google_api_key=api_key,
                )
            except Exception:
                self.embeddings = StableHashEmbeddings()
        else:
            self.embeddings = StableHashEmbeddings()
        
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
