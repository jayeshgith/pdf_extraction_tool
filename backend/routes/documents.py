import os
import re
import uuid
from pathlib import Path
from datetime import datetime, timezone
from urllib.parse import quote_plus
from fastapi import APIRouter, UploadFile, File, HTTPException, Query, BackgroundTasks, Depends
from pymongo import MongoClient
from bson import ObjectId

from services.ocr import extract_text
from services.ai_extractor import extract_fields
from routes.auth import get_current_user

router = APIRouter(dependencies=[Depends(get_current_user)])

ALLOWED_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "application/pdf": ".pdf",
}
MAX_SIZE = 10 * 1024 * 1024

BASE_DIR = Path(__file__).parent.parent

_db_client = None
_db = None


def get_db():
    global _db_client, _db
    if _db is not None:
        return _db

    mongodb_url = os.environ.get("MONGODB_URL", "mongodb://localhost:27017")
    db_name = os.environ.get("DATABASE_NAME", "docuverse")
    if not mongodb_url or mongodb_url == "mongodb://localhost:27017":
        raise HTTPException(status_code=500, detail="MongoDB URL not configured. Set MONGODB_URL in .env file.")

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


def get_upload_dir():
    upload_dir = os.environ.get("UPLOAD_DIR", str(BASE_DIR / "uploads"))
    Path(upload_dir).mkdir(parents=True, exist_ok=True)
    return upload_dir


@router.post("/upload")
async def upload_document(file: UploadFile = File(...), background_tasks: BackgroundTasks = None, user_email: str = Depends(get_current_user)):
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

    db = get_db()
    doc = {
        "user_id": user_email,
        "original_name": file.filename,
        "file_path": file_url,
        "file_type": file.content_type,
        "file_size": len(content),
        "status": "processing",
        "extracted_data": {},
        "confidence_scores": {},
        "overall_confidence": 0.0,
        "raw_text": "",
        "error_message": None,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }

    result = db.documents.insert_one(doc)
    doc["_id"] = str(result.inserted_id)

    if background_tasks:
        background_tasks.add_task(process_document, doc["_id"], file_path)

    return doc


def process_document(doc_id: str, file_path: str):
    try:
        raw_text = extract_text(file_path)
        extracted_data, confidence_scores, overall_confidence = extract_fields(raw_text)
        status = "completed" if extracted_data else "failed"
        error_message = None
    except FileNotFoundError:
        raw_text = ""
        extracted_data = {}
        confidence_scores = {}
        overall_confidence = 0.0
        status = "failed"
        error_message = "Tesseract OCR not found. Install Tesseract or set TESSERACT_CMD env var."
    except Exception as e:
        raw_text = ""
        extracted_data = {}
        confidence_scores = {}
        overall_confidence = 0.0
        status = "failed"
        error_message = f"Extraction error: {str(e)}"

    try:
        db = get_db()
        db.documents.update_one(
            {"_id": ObjectId(doc_id)},
            {"$set": {
                "status": status,
                "extracted_data": extracted_data,
                "confidence_scores": confidence_scores,
                "overall_confidence": overall_confidence,
                "raw_text": raw_text,
                "error_message": error_message,
                "updated_at": datetime.now(timezone.utc),
            }}
        )
    except Exception:
        pass


@router.get("/documents")
async def list_documents(page: int = Query(1, ge=1), limit: int = Query(10, ge=1, le=50), user_email: str = Depends(get_current_user)):
    db = get_db()
    query = {"user_id": user_email}
    total = db.documents.count_documents(query)
    total_pages = max(1, (total + limit - 1) // limit)

    cursor = (
        db.documents.find(query)
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
async def get_document(doc_id: str, user_email: str = Depends(get_current_user)):
    db = get_db()
    try:
        doc = db.documents.find_one({"_id": ObjectId(doc_id), "user_id": user_email})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid document ID")

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    doc["_id"] = str(doc["_id"])
    return doc


@router.put("/documents/{doc_id}")
async def update_document(doc_id: str, data: dict, user_email: str = Depends(get_current_user)):
    db = get_db()
    try:
        obj_id = ObjectId(doc_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid document ID")

    existing = db.documents.find_one({"_id": obj_id, "user_id": user_email})
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
async def delete_document(doc_id: str, user_email: str = Depends(get_current_user)):
    db = get_db()
    try:
        obj_id = ObjectId(doc_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid document ID")

    doc = db.documents.find_one({"_id": obj_id, "user_id": user_email})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if os.path.exists(doc.get("file_path", "")):
        os.remove(doc["file_path"])

    db.documents.delete_one({"_id": obj_id})

    return {"message": "Document deleted successfully"}
