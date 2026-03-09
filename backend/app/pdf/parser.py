import os
from pypdf import PdfReader
from tempfile import NamedTemporaryFile
from fastapi import UploadFile

class PDFParser:
    @staticmethod
    async def extract_text_from_upload(upload_file: UploadFile) -> str:
        """
        Takes a FastAPI UploadFile, reads it, extracts text using PyPDF2.
        """
        # Save uploaded file to a temporary location
        with NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            contents = await upload_file.read()
            tmp.write(contents)
            tmp_path = tmp.name

        try:
            reader = PdfReader(tmp_path)
            extracted_text = ""
            for i, page in enumerate(reader.pages):
                page_text = page.extract_text()
                if page_text:
                    extracted_text += page_text + "\n"
        finally:
            # Clean up temp file
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
                
        return extracted_text

    @staticmethod
    def extract_text_from_path(file_path: str) -> str:
        """
        Extracts text from a local PDF file path.
        """
        reader = PdfReader(file_path)
        extracted_text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                extracted_text += page_text + "\n"
        return extracted_text
