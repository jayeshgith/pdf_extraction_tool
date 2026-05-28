import os
import re
from pathlib import Path
from urllib.parse import quote_plus
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pymongo import MongoClient
from bson import ObjectId

load_dotenv()

from routes.documents import router as documents_router
from routes.auth import router as auth_router
from routes.chat import router as chat_router

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

app.include_router(documents_router, prefix="/api")
app.include_router(auth_router)
app.include_router(chat_router)

_db_client = None
_db = None


def get_db():
    global _db_client, _db
    if _db is not None:
        return _db
    mongodb_url = os.environ.get("MONGODB_URL", "mongodb://localhost:27017")
    db_name = os.environ.get("DATABASE_NAME", "docuverse")
    match = re.match(r"(mongodb\+srv://)([^:]+):([^@]+)@(.+)", mongodb_url)
    if match:
        prefix, username, password, rest = match.groups()
        mongodb_url = f"{prefix}{quote_plus(username)}:{quote_plus(password)}@{rest}"
    _db_client = MongoClient(
        mongodb_url,
        serverSelectionTimeoutMS=30000,
        tls=True,
        tlsAllowInvalidCertificates=True,
    )
    _db = _db_client[db_name]
    return _db


@app.get("/files/{file_id}")
async def serve_file(file_id: str):
    try:
        obj_id = ObjectId(file_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid file ID")
    db = get_db()
    file_doc = db.files.find_one({"_id": obj_id})
    if not file_doc:
        raise HTTPException(status_code=404, detail="File not found")
    content_type = file_doc.get("content_type", "application/octet-stream")
    filename = file_doc.get("filename", "file")
    return StreamingResponse(
        [file_doc["data"]],
        media_type=content_type,
        headers={
            "Content-Disposition": f'inline; filename="{filename}"',
            "Access-Control-Allow-Origin": "*",
        },
    )


@app.get("/uploads/{file_path:path}")
async def serve_upload_legacy(file_path: str):
    full_path = Path(__file__).parent / "uploads" / file_path
    if not full_path.exists() or not full_path.is_file():
        raise HTTPException(status_code=404, detail="File not found")
    from fastapi.responses import FileResponse
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
    }
