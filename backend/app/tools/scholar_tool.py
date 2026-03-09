import os
import requests
from typing import List, Dict

class ScholarTool:
    def __init__(self):
        self.api_key = os.getenv("SERPAPI_API_KEY")
        self.base_url = "https://serpapi.com/search"

    def search_scholar(self, query: str, num_results: int = 3) -> List[Dict]:
        """
        Search for papers on Google Scholar using SerpApi.
        If no API key provided, returns dummy data to prevent failure.
        """
        if not self.api_key:
            return [{
                "id": "dummy_scholar_1",
                "title": f"[Google Scholar Mock] Paper on {query}",
                "summary": "This is a dummy summary because the SERPAPI_API_KEY is missing.",
                "authors": ["John Doe", "Jane Smith"],
                "published": "2024",
                "pdf_url": ""
            }]

        params = {
            "engine": "google_scholar",
            "q": query,
            "api_key": self.api_key,
            "num": num_results
        }
        
        try:
            response = requests.get(self.base_url, params=params)
            response.raise_for_status()
            data = response.json()
            
            papers = []
            for item in data.get("organic_results", [])[:num_results]:
                papers.append({
                    "id": item.get("result_id", ""),
                    "title": item.get("title", ""),
                    "summary": item.get("snippet", ""),
                    "authors": [a.get("name") for a in item.get("publication_info", {}).get("authors", [])],
                    "published": "", # Complex to parse purely from snippet usually
                    "pdf_url": item.get("resources", [{}])[0].get("link", "") if item.get("resources") else ""
                })
            return papers
        except Exception as e:
            print(f"Scholar API Error: {e}")
            return []

if __name__ == "__main__":
    tool = ScholarTool()
    results = tool.search_scholar("Agentic AI")
    print(results)
