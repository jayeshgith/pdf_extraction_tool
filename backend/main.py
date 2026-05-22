import os
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

load_dotenv()

from routes.documents import router as documents_router

app = FastAPI(
    title="DocuVerse — AI Document Extraction API",
    version="1.0.0",
    description="AI-powered document extraction system supporting passports, PAN cards, Aadhaar cards, invoices, and more.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).parent
upload_dir = os.environ.get("UPLOAD_DIR", str(BASE_DIR / "uploads"))
Path(upload_dir).mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=upload_dir), name="uploads")

app.include_router(documents_router, prefix="/api")


@app.get("/api/health")
async def health_check():
    from services.ocr import tesseract_available, tesseract_cmd
    return {
        "status": "ok",
        "service": "DocuVerse API",
        "tesseract_installed": tesseract_available,
        "tesseract_path": tesseract_cmd if os.path.exists(tesseract_cmd) else "not found",
        "upload_dir": upload_dir,
    }
