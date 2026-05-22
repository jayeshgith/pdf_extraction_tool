import os
import json
import re
from openai import OpenAI

client = None
openai_api_key = os.environ.get("OPENAI_API_KEY")
if openai_api_key:
    client = OpenAI(api_key=openai_api_key)


DOC_TYPES = {
    "passport": ["document_type", "passport_number", "name", "dob", "nationality", "gender", "issue_date", "expiry_date"],
    "pan_card": ["document_type", "pan_number", "name", "father_name", "dob"],
    "aadhaar_card": ["document_type", "aadhaar_number", "name", "dob", "gender", "address"],
    "invoice": ["document_type", "invoice_number", "name", "vendor", "date", "total_amount"],
    "bill": ["document_type", "bill_number", "vendor", "date", "total_amount", "name"],
    "resume": ["document_type", "name", "email", "phone", "skills", "education", "experience_summary"],
    "other": ["document_type", "name", "document_number", "date", "email"],
}


def detect_document_type(raw_text: str) -> str:
    text_lower = raw_text.lower()
    lines = text_lower.split("\n")

    resume_keywords = ["resume", "curriculum vitae", "cv", "experience", "skills", "education", "objective"]
    score = sum(1 for w in resume_keywords if w in text_lower)
    if score >= 3:
        return "resume"

    if any(w in text_lower for w in ["passport", "passport no", "passport number"]):
        return "passport"
    if any(w in text_lower for w in ["pan card", "permanent account number", "income tax"]):
        return "pan_card"
    if any(w in text_lower for w in ["aadhaar", "uidai", "aadhar"]):
        return "aadhaar_card"
    if any(w in text_lower for w in ["invoice", "tax invoice", "inv no"]):
        return "invoice"
    if any(w in text_lower for w in ["bill", "receipt", "payment", "total due", "amount due"]):
        return "bill"

    return "other"


def extract_fields_rule_based(raw_text: str, doc_type: str) -> dict:
    fields = {"document_type": doc_type.replace("_", " ").title()}
    text = raw_text.lower()

    patterns = {
        "passport_number": [
            r"(?:passport\s*(?:no|number|#)?[:\s]*)([A-Z0-9]{6,9})",
            r"([A-Z][0-9]{7})",
        ],
        "name": [
            r"(?:name|full name|given name|surname|student name|candidate name)[:\s]+([A-Za-z\s\.'\-]+?)(?:\n|$|date|nationality|\d|\||email)",
            r"(?:mr\.|mrs\.|ms\.|dr\.)\s+([A-Za-z\s\.'\-]+?)(?:\n|$)",
            r"^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)",
        ],
        "dob": [
            r"(?:dob|date of birth|birth date|d\.o\.b|date of birth)[:\s]+(\d{1,2}[/\-\.]\d{1,2}[/\-\.]\d{2,4})",
            r"(\d{2}[/\-\.]\d{2}[/\-\.]\d{4})",
        ],
        "nationality": [
            r"(?:nationality|citizenship)[:\s]+([A-Za-z\s]+?)(?:\n|$|\d)",
        ],
        "gender": [
            r"(?:gender|sex|m/f)[:\s]*([MF])",
            r"\b(Male|Female)\b",
        ],
        "pan_number": [
            r"(?:pan|pan no|pan number|permanent account number)[:\s]*([A-Z]{5}\d{4}[A-Z])",
            r"([A-Z]{5}\d{4}[A-Z])",
        ],
        "aadhaar_number": [
            r"(?:aadhaar|uid|aadhar)[:\s]*(\d{4}\s?\d{4}\s?\d{4})",
            r"(\d{4}[\s-]?\d{4}[\s-]?\d{4})",
        ],
        "father_name": [
            r"(?:father|father's name|father name)[:\s]+([A-Za-z\s\.'\-]+?)(?:\n|$)",
        ],
        "issue_date": [
            r"(?:issue date|date of issue|issued on|date of issuance)[:\s]+(\d{1,2}[/\-\.]\d{1,2}[/\-\.]\d{2,4})",
        ],
        "expiry_date": [
            r"(?:expiry date|date of expiry|valid until|expiration date)[:\s]+(\d{1,2}[/\-\.]\d{1,2}[/\-\.]\d{2,4})",
        ],
        "address": [
            r"(?:address|residence|permanent address)[:\s]+([\w\s,\.\-/#]+?)(?:\n{2,}|$)",
        ],
        "document_number": [
            r"(?:document\s*(?:no|number|#)?[:\s]*)([A-Z0-9\-]+)",
        ],
        "invoice_number": [
            r"(?:invoice\s*(?:no|number|#)?[:\s]*)([A-Z0-9\-/]+)",
            r"(?:inv\s*(?:no|#)?[:\s]*)([A-Z0-9\-/]+)",
        ],
        "bill_number": [
            r"(?:bill\s*(?:no|number|#)?[:\s]*)([A-Z0-9\-/]+)",
            r"(?:receipt\s*(?:no|number|#)?[:\s]*)([A-Z0-9\-/]+)",
        ],
        "vendor": [
            r"(?:vendor|seller|supplier|store|shop|company|merchant|billed to)[:\s]+([A-Za-z\s\.'\-&]+?)(?:\n|$)",
        ],
        "total_amount": [
            r"(?:total|amount|grand total|total amount|sum|balance due|amount due|net)[:\s]*[$]?([\d,]+\.\d{2})",
            r"(?:total|amount|grand total)[:\s]*([\d,]+\.\d{2})",
            r"[$]([\d,]+\.\d{2})",
        ],
        "date": [
            r"(?:date|invoice date|bill date|transaction date|date issued)[:\s]+(\d{1,2}[/\-\.]\d{1,2}[/\-\.]\d{2,4})",
            r"(\d{1,2}[/\-\.]\d{1,2}[/\-\.]\d{4})",
        ],
        "email": [
            r"([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})",
        ],
        "phone": [
            r"(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}",
            r"\b\d{10}\b",
        ],
        "skills": [
            r"(?:skills|technical skills|core competencies)[:\s]*\n?([\w\s,\.#+\n]+?)(?:\n{2,}|education|experience|$)",
        ],
        "education": [
            r"(?:education|academic|qualification)[:\s]*\n?([\w\s,\.\-\(\)\n]+?)(?:\n{2,}|experience|skills|$)",
        ],
        "experience_summary": [
            r"(?:experience|work experience|professional experience)[:\s]*\n?([\w\s,\.\-\(\)\n]+?)(?:\n{2,}|education|skills|$)",
        ],
    }

    for field, regexes in patterns.items():
        for regex in regexes:
            match = re.search(regex, raw_text, re.IGNORECASE | re.MULTILINE)
            if match:
                value = match.group(1).strip()
                if value and not all(c in " \n\r\t-" for c in value):
                    if field == "skills" and len(value) > 200:
                        value = value[:200]
                    elif field in ("education", "experience_summary") and len(value) > 300:
                        value = value[:300]
                    fields[field] = value
                    break

    return fields


def extract_with_openai(raw_text: str, doc_type: str) -> dict:
    schema = DOC_TYPES.get(doc_type, DOC_TYPES["other"])

    type_hints = {
        "passport": "Extract passport details including passport number, full name, date of birth, nationality, gender, issue date, and expiry date.",
        "pan_card": "Extract PAN card details including PAN number (format: 5 letters + 4 digits + 1 letter), full name, father's name, and date of birth.",
        "aadhaar_card": "Extract Aadhaar card details including 12-digit Aadhaar number, full name, date of birth, gender, and address.",
        "invoice": "Extract invoice details including invoice number, customer name, vendor/company name, date, and total amount.",
        "bill": "Extract bill/receipt details including bill number, vendor/store name, date, and total amount.",
        "resume": "Extract resume/candidate details including full name, email, phone number, skills (comma separated), education, and work experience summary.",
        "other": "Extract any personal or document details including name, document number, date, email if present.",
    }

    hint = type_hints.get(doc_type, type_hints["other"])
    prompt = f"""You are a precise document extraction engine.
{hint}

Return ONLY a JSON object with exactly these keys: {json.dumps(schema)}
If a field is not found, set it to null. Do NOT add extra fields.
For 'skills' field, return a comma-separated list.
For 'education' and 'experience_summary', return a brief summary.

Document text:
{raw_text[:4000]}"""

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a precise document extraction engine. Extract structured data and return ONLY valid JSON with the exact keys specified."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.05,
            max_tokens=600,
        )
        content = response.choices[0].message.content.strip()
        content = re.sub(r"^```(?:json)?\s*", "", content)
        content = re.sub(r"\s*```$", "", content)
        extracted = json.loads(content)
        return {k: v for k, v in extracted.items() if v is not None}
    except Exception:
        return None


def extract_fields(raw_text: str) -> dict:
    if not raw_text:
        return {}, {}, 0.0

    doc_type = detect_document_type(raw_text)
    rule_fields = extract_fields_rule_based(raw_text, doc_type)

    ai_fields = None
    if client:
        try:
            ai_fields = extract_with_openai(raw_text, doc_type)
        except Exception:
            ai_fields = None

    merged = {}
    confidence_scores = {}

    all_keys = list(set(list(rule_fields.keys()) + (list(ai_fields.keys()) if ai_fields else [])))

    for field in all_keys:
        rule_val = rule_fields.get(field)
        ai_val = ai_fields.get(field) if ai_fields else None

        if rule_val and ai_val:
            r_clean = str(rule_val).strip().lower()
            a_clean = str(ai_val).strip().lower()
            if r_clean == a_clean:
                merged[field] = rule_val
                confidence_scores[field] = 0.92
            elif len(a_clean) >= len(r_clean) and len(r_clean) > 3:
                merged[field] = ai_val
                confidence_scores[field] = 0.82
            else:
                merged[field] = rule_val
                confidence_scores[field] = 0.72
        elif ai_val:
            merged[field] = ai_val
            val_len = len(str(ai_val).strip())
            confidence_scores[field] = min(0.80, 0.50 + val_len * 0.02)
        elif rule_val:
            merged[field] = rule_val
            val = str(rule_val).strip()
            if len(val) > 5 and re.match(r'^[A-Z]', rule_val):
                confidence_scores[field] = 0.65
            else:
                confidence_scores[field] = 0.55

    overall = round(sum(confidence_scores.values()) / len(confidence_scores), 2) if confidence_scores else 0.0

    return merged, confidence_scores, overall
