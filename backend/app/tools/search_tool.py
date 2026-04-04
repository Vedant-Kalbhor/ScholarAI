import os
import requests
from typing import List, Dict

class WebSearchTool:
    def __init__(self):
        self.api_key = os.getenv("SERPAPI_API_KEY")
        self.base_url = "https://serpapi.com/search"

    def search_web(self, query: str, num_results: int = 3) -> List[Dict]:
        """
        Search the general web using SerpApi's Google engine.
        Returns snippets and links for factual context.
        """
        if not self.api_key:
             return [{"title": "Web Search Mock", "snippet": f"Web results for {query} (No SerpApi Key).", "link": ""}]

        params = {
            "engine": "google",
            "q": query,
            "api_key": self.api_key,
            "num": num_results
        }
        
        try:
            response = requests.get(self.base_url, params=params)
            response.raise_for_status()
            data = response.json()
            
            results = []
            for item in data.get("organic_results", [])[:num_results]:
                results.append({
                    "title": item.get("title", ""),
                    "snippet": item.get("snippet", ""),
                    "link": item.get("link", "")
                })
            return results
        except Exception as e:
            print(f"Web Search API Error: {e}")
            return []

if __name__ == "__main__":
    tool = WebSearchTool()
    print(tool.search_web("Quantum Computing Trends 2024"))
