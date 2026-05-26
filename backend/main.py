import os
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

load_dotenv()

from routes.documents import router as documents_router
from routes.auth import router as auth_router

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
UPLOAD_DIR = os.environ.get("UPLOAD_DIR", str(BASE_DIR / "uploads"))
Path(UPLOAD_DIR).mkdir(parents=True, exist_ok=True)

app.include_router(documents_router)
app.include_router(auth_router)


@app.get("/uploads/{file_path:path}")
async def serve_upload(file_path: str):
    full_path = Path(UPLOAD_DIR) / file_path
    if not full_path.exists() or not full_path.is_file():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(str(full_path), headers={
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "*",
    })


@app.get("/api/health")
async def health_check():
    from services.ocr import tesseract_available, tesseract_cmd
    return {
        "status": "ok",
        "service": "DocuVerse API",
        "tesseract_installed": tesseract_available,
        "tesseract_path": tesseract_cmd if os.path.exists(tesseract_cmd) else "not found",
        "upload_dir": UPLOAD_DIR,
    }
