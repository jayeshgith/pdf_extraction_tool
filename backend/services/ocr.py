import os
import tempfile
from pathlib import Path
import pytesseract
from pdfplumber import open as open_pdf
from PIL import Image

tesseract_available = False
tesseract_cmd = os.environ.get("TESSERACT_CMD", r"C:\Program Files\Tesseract-OCR\tesseract.exe")
if os.path.exists(tesseract_cmd):
    pytesseract.pytesseract.tesseract_cmd = tesseract_cmd
    tesseract_available = True


def extract_text_from_image(image_path: str) -> str:
    if not tesseract_available:
        return ""
    image = Image.open(image_path)
    text = pytesseract.image_to_string(image)
    return text.strip()


def extract_text_from_pdf(pdf_path: str) -> str:
    text_parts = []
    with open_pdf(pdf_path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)

    combined = "\n".join(text_parts).strip()

    if combined:
        return combined

    if tesseract_available and pdf.pages:
        for i, page in enumerate(pdf.pages):
            try:
                img = page.to_image(resolution=300)
                page_text = pytesseract.image_to_string(img.original)
                if page_text.strip():
                    text_parts.append(page_text.strip())
            except Exception:
                pass

    return "\n".join(text_parts).strip()


def extract_text(file_path: str) -> str:
    ext = Path(file_path).suffix.lower()
    if ext == ".pdf":
        return extract_text_from_pdf(file_path)
    elif ext in (".jpg", ".jpeg", ".png", ".webp"):
        return extract_text_from_image(file_path)
    else:
        return ""
