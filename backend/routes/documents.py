import os
import re
import uuid
from pathlib import Path
from datetime import datetime, timezone
from urllib.parse import quote_plus
from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from pymongo import MongoClient
from bson import ObjectId

from services.ocr import extract_text
from services.ai_extractor import extract_fields

router = APIRouter()

ALLOWED_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "application/pdf": ".pdf",
}
MAX_SIZE = 10 * 1024 * 1024

BASE_DIR = Path(__file__).parent.parent


def get_db():
    mongodb_url = os.environ.get("MONGODB_URL", "mongodb://localhost:27017")
    db_name = os.environ.get("DATABASE_NAME", "docuverse")
    if not mongodb_url or mongodb_url == "mongodb://localhost:27017":
        raise HTTPException(status_code=500, detail="MongoDB URL not configured. Set MONGODB_URL in .env file.")

    match = re.match(r"(mongodb\+srv://)([^:]+):([^@]+)@(.+)", mongodb_url)
    if match:
        prefix, username, password, rest = match.groups()
        mongodb_url = f"{prefix}{quote_plus(username)}:{quote_plus(password)}@{rest}"

    client = MongoClient(
        mongodb_url,
        serverSelectionTimeoutMS=15000,
        tls=True,
        tlsAllowInvalidCertificates=True,
    )
    return client[db_name]


def get_upload_dir():
    upload_dir = os.environ.get("UPLOAD_DIR", str(BASE_DIR / "uploads"))
    Path(upload_dir).mkdir(parents=True, exist_ok=True)
    return upload_dir


@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file.content_type}. Allowed: {', '.join(ALLOWED_TYPES.keys())}"
        )

    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 10MB.")

    ext = ALLOWED_TYPES[file.content_type]
    unique_name = f"{uuid.uuid4().hex}{ext}"
    upload_dir = get_upload_dir()
    file_path = os.path.join(upload_dir, unique_name)

    with open(file_path, "wb") as f:
        f.write(content)

    file_url = f"/uploads/{unique_name}"

    raw_text = ""
    extracted_data = {}
    confidence_scores = {}
    overall_confidence = 0.0
    error_message = None

    try:
        raw_text = extract_text(file_path)
        extracted_data, confidence_scores, overall_confidence = extract_fields(raw_text)
    except FileNotFoundError:
        error_message = "Tesseract OCR not found. Install Tesseract or set TESSERACT_CMD env var."
    except Exception as e:
        error_message = f"Extraction error: {str(e)}"

    try:
        db = get_db()
        doc = {
            "original_name": file.filename,
            "file_path": file_url,
            "file_type": file.content_type,
            "file_size": len(content),
            "status": "completed" if extracted_data else "failed",
            "extracted_data": extracted_data,
            "confidence_scores": confidence_scores,
            "overall_confidence": overall_confidence,
            "raw_text": raw_text,
            "error_message": error_message,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        }

        result = db.documents.insert_one(doc)
        doc["_id"] = str(result.inserted_id)
        return doc
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.get("/documents")
async def list_documents(page: int = Query(1, ge=1), limit: int = Query(10, ge=1, le=50)):
    db = get_db()
    total = db.documents.count_documents({})
    total_pages = max(1, (total + limit - 1) // limit)

    cursor = (
        db.documents.find()
        .sort("created_at", -1)
        .skip((page - 1) * limit)
        .limit(limit)
    )

    docs = []
    for doc in cursor:
        doc["_id"] = str(doc["_id"])
        docs.append(doc)

    return {
        "documents": docs,
        "total": total,
        "page": page,
        "totalPages": total_pages,
    }


@router.get("/documents/{doc_id}")
async def get_document(doc_id: str):
    db = get_db()
    try:
        doc = db.documents.find_one({"_id": ObjectId(doc_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid document ID")

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    doc["_id"] = str(doc["_id"])
    return doc


@router.put("/documents/{doc_id}")
async def update_document(doc_id: str, data: dict):
    db = get_db()
    try:
        obj_id = ObjectId(doc_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid document ID")

    existing = db.documents.find_one({"_id": obj_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Document not found")

    update_fields = {}
    if "extracted_data" in data:
        update_fields["extracted_data"] = data["extracted_data"]
    if "status" in data:
        update_fields["status"] = data["status"]

    update_fields["updated_at"] = datetime.now(timezone.utc)

    db.documents.update_one({"_id": obj_id}, {"$set": update_fields})

    updated = db.documents.find_one({"_id": obj_id})
    updated["_id"] = str(updated["_id"])
    return updated


@router.delete("/documents/{doc_id}")
async def delete_document(doc_id: str):
    db = get_db()
    try:
        obj_id = ObjectId(doc_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid document ID")

    doc = db.documents.find_one({"_id": obj_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if os.path.exists(doc.get("file_path", "")):
        os.remove(doc["file_path"])

    db.documents.delete_one({"_id": obj_id})

    return {"message": "Document deleted successfully"}
