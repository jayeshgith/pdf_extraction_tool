# DocuVerse — AI-Powered Document Extraction System

Upload passports, PAN cards, Aadhaar cards, invoices, bills, or resumes — extract structured data automatically using OCR + AI.

## What It Does

- Upload any document (PDF, JPG, PNG)
- OCR extracts raw text from images and PDFs
- AI identifies document type and pulls out fields like name, DOB, document number, amount, skills
- View extracted data with confidence scores
- Edit fields if needed and save
- Browse all past extractions in a table

## Tech Stack

**Frontend** — React, Vite, Tailwind CSS v4, React Router, Axios, react-pdf  
**Backend** — FastAPI, pytesseract, pdfplumber, OpenAI API, MongoDB  
**OCR** — Tesseract (images) + pdfplumber (PDF text layer)  

## Project Structure

```
ai_system_tool/
├── frontend/
│   ├── src/
│   │   ├── pages/          # UploadPage, ExtractionPage, DocumentListPage
│   │   ├── components/     # (add your own shared components here)
│   │   ├── layouts/        # Sidebar + Navbar layout
│   │   └── services/       # Axios API client
│   ├── index.html
│   └── vite.config.js
├── backend/
│   ├── routes/             # FastAPI route handlers
│   ├── services/           # OCR engine + AI field extractor
│   ├── models/             # MongoDB document model
│   ├── uploads/            # Uploaded files (gitignored)
│   └── main.py
├── .gitignore
└── README.md
```

## Quick Start

### 1. Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate      # Windows
pip install -r requirements.txt
```

Create `backend/.env`:

```env
MONGODB_URL=mongodb+srv://<user>:<pass>@cluster.xxxxx.mongodb.net/
DATABASE_NAME=docuverse
OPENAI_API_KEY=sk-...           # optional — improves accuracy
TESSERACT_CMD=C:\Program Files\Tesseract-OCR\tesseract.exe   # Windows default
```

Run:

```bash
uvicorn main:app --reload
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/upload` | Upload a document |
| GET | `/api/documents` | List all documents (with pagination) |
| GET | `/api/documents/:id` | Get single document + extracted fields |
| PUT | `/api/documents/:id` | Update extracted fields |
| DELETE | `/api/documents/:id` | Delete a document |
| GET | `/api/health` | System health + Tesseract status |

## Deployment

- **Frontend** — `npm run build` → deploy `dist/` to Vercel
- **Backend** — push to GitHub → deploy on Render with start command:
  ```
  uvicorn main:app --host 0.0.0.0 --port 10000
  ```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URL` | Yes | MongoDB connection string |
| `DATABASE_NAME` | No | Default: `docuverse` |
| `OPENAI_API_KEY` | No | OpenAI key for AI extraction |
| `TESSERACT_CMD` | No | Path to Tesseract executable |
| `UPLOAD_DIR` | No | File upload directory (default: `./uploads`) |

## Notes

- Tesseract OCR must be installed for image text extraction. Download from [UB-Mannheim/tesseract](https://github.com/UB-Mannheim/tesseract/releases).
- Without OpenAI key, extraction uses regex patterns only — works for common formats but less accurate.
- Scanned PDFs (image-based) require Tesseract for OCR fallback.
