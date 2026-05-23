import os
from pathlib import Path
import pytesseract
from pdfplumber import open as open_pdf
from PIL import Image, ImageEnhance, ImageFilter

tesseract_available = False
tesseract_cmd = os.environ.get("TESSERACT_CMD", "")
if not tesseract_cmd or not os.path.exists(tesseract_cmd):
    for candidate in [
        r"C:\Program Files\Tesseract-OCR\tesseract.exe",
        "/usr/bin/tesseract",
        "/usr/local/bin/tesseract",
    ]:
        if os.path.exists(candidate):
            tesseract_cmd = candidate
            break
if os.path.exists(tesseract_cmd):
    pytesseract.pytesseract.tesseract_cmd = tesseract_cmd
    tesseract_available = True


def preprocess_image_light(image):
    image = image.convert("L")
    enhancer = ImageEnhance.Contrast(image)
    return enhancer.enhance(1.5)


def preprocess_image_aggressive(image):
    image = image.convert("L")
    enhancer = ImageEnhance.Contrast(image)
    image = enhancer.enhance(2.0)
    image = image.filter(ImageFilter.SHARPEN)
    image = image.point(lambda x: 0 if x < 160 else 255, "1")
    return image


def extract_text_from_image(image_path: str) -> str:
    if not tesseract_available:
        return ""
    image = Image.open(image_path)

    scale = max(1, 2000 // max(image.size))
    if scale > 1:
        image = image.resize((image.width * scale, image.height * scale), Image.LANCZOS)

    configs = [
        ("--psm 3 --oem 3", preprocess_image_light),
        ("--psm 4 --oem 3", preprocess_image_light),
        ("--psm 6 --oem 3", preprocess_image_light),
        ("--psm 6 --oem 3", preprocess_image_aggressive),
    ]

    seen = set()
    for config, preprocess in configs:
        processed = preprocess(image)
        text = pytesseract.image_to_string(processed, config=config).strip()
        if text and text not in seen:
            seen.add(text)
            return text

    return ""


def extract_text_from_pdf(pdf_path: str) -> str:
    text_parts = []
    with open_pdf(pdf_path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text and page_text.strip():
                text_parts.append(page_text.strip())

    combined = "\n".join(text_parts).strip()

    if combined:
        return combined

    if tesseract_available and pdf.pages:
        for page in pdf.pages:
            try:
                img = page.to_image(resolution=300)
                processed = preprocess_image_aggressive(img.original)
                config = "--psm 6 --oem 3"
                page_text = pytesseract.image_to_string(processed, config=config)
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
