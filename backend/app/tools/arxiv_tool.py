import requests
import xml.etree.ElementTree as ET
from typing import List, Dict

class ArxivTool:
    def __init__(self):
        self.base_url = "http://export.arxiv.org/api/query"

    def search_papers(self, query: str, max_results: int = 5) -> List[Dict]:
        """
        Search for papers on ArXiv.
        """
        params = {
            "search_query": f"all:{query}",
            "start": 0,
            "max_results": max_results
        }
        
        response = requests.get(self.base_url, params=params)
        if response.status_status != 200:
            return []
            
        return self._parse_arxiv_response(response.text)

    def _parse_arxiv_response(self, xml_data: str) -> List[Dict]:
        root = ET.fromstring(xml_data)
        namespace = {'atom': 'http://www.w3.org/2005/Atom'}
        
        papers = []
        for entry in root.findall('atom:entry', namespace):
            paper = {
                "id": entry.find('atom:id', namespace).text.split('/')[-1],
                "title": entry.find('atom:title', namespace).text.strip(),
                "summary": entry.find('atom:summary', namespace).text.strip(),
                "authors": [author.find('atom:name', namespace).text for author in entry.findall('atom:author', namespace)],
                "published": entry.find('atom:published', namespace).text,
                "pdf_url": ""
            }
            
            for link in entry.findall('atom:link', namespace):
                if link.attrib.get('title') == 'pdf':
                    paper["pdf_url"] = link.attrib.get('href')
                    
            papers.append(paper)
            
        return papers

if __name__ == "__main__":
    tool = ArxivTool()
    results = tool.search_papers("Agentic AI")
    for r in results:
        print(f"Title: {r['title']}\nID: {r['id']}\n")
