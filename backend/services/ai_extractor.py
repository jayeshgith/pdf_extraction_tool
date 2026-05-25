import os
import json
import re
from openai import OpenAI

client = None
openai_api_key = os.environ.get("OPENAI_API_KEY")
if openai_api_key:
    client = OpenAI(api_key=openai_api_key)

DOC_TYPES = {
    "passport": ["document_type", "passport_number", "name", "dob", "nationality", "gender", "issue_date", "expiry_date", "place_of_birth", "place_of_issue", "address"],
    "pan_card": ["document_type", "pan_number", "name", "father_name", "dob"],
    "aadhaar_card": ["document_type", "aadhaar_number", "name", "dob", "gender", "address", "mobile_number"],
    "invoice": ["document_type", "invoice_number", "name", "vendor", "date", "total_amount"],
    "bill": ["document_type", "bill_number", "vendor", "date", "total_amount", "name"],
    "resume": ["document_type", "name", "email", "phone", "skills", "education", "experience_summary"],
    "other": ["document_type", "name", "document_number", "date", "email", "phone", "father_name", "holder_name", "card_number", "address", "dob"],
}

PASSPORT_NUM_RE = r"(?:passport\s*(?:no|number|#|\.)?\s*[:\-]\s*)([A-Z]\s*[0-9]\s*[0-9]\s*[0-9]\s*[0-9]\s*[0-9]\s*[0-9]\s*[0-9])"
PAN_RE = r"(?:pan\s*(?:no|number|#|\.|:)?\s*[:\-]\s*)?([A-Z]\s*[A-Z]\s*[A-Z]\s*[A-Z]\s*[A-Z]\s*\d\s*\d\s*\d\s*\d\s*[A-Z])"
AADHAAR_RE = r"(\d{4}\s?\d{4}\s?\d{4})"
NAME_RE = r"(?:name|full name|given name|surname|applicant name|candidate name|student name|holder name)\s*[:\-]\s*([A-Za-z\s\.'\-]+?)(?:\n|$|\||email|\d{2}|[0-9])"
DOB_RE = r"(?:dob|date\s*of\s*birth|birth\s*date|d\.o\.b|date\s*of\s*birth|birth)\s*[:\-]\s*(\d{1,2}[/\-\.]\d{1,2}[/\-\.]\d{2,4})"
DATE_RE = r"(\d{2}[/\-\.]\d{2}[/\-\.]\d{4})"
EMAIL_RE = r"([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})"
PHONE_RE = r"((?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})"
VENDOR_RE = r"(?:vendor|seller|supplier|store|shop|company|merchant|billed to|bill from)\s*[:\-]\s*([A-Za-z0-9\s\.'\-&]+?)(?:\n|$)"
TOTAL_RE = r"(?:total|grand total|total amount|amount due|net amount|balance due|sum)\s*[:\-]?\s*[₹$]?\s*([\d,]+\.\d{2})"
NATIONALITY_RE = r"(?:nationality|citizenship)\s*[:\-]\s*([A-Za-z\s]+?)(?:\n|$|\d)"
GENDER_RE = r"(?:gender|sex)\s*[:\-]\s*(M|F|Male|Female|MALE|FEMALE)"
FATHER_RE = r"(?:father|father's name|father name|fathers name)\s*[:\-]\s*([A-Za-z\s\.'\-]+?)(?:\n|$)"
ISSUE_RE = r"(?:issue date|date of issue|issued on|date of issuance)\s*[:\-]\s*(\d{1,2}[/\-\.]\d{1,2}[/\-\.]\d{2,4})"
EXPIRY_RE = r"(?:expiry date|date of expiry|valid until|expiration date|valid till)\s*[:\-]\s*(\d{1,2}[/\-\.]\d{1,2}[/\-\.]\d{2,4})"
ADDRESS_RE = r"(?:address|residence|permanent address)\s*[:\-]\s*([\w\s,\.\-/#]+?)(?:\n{2,}|$)"
INVOICE_RE = r"(?:invoice\s*(?:no|number|#|\.)?\s*[:\-]\s*)([A-Z0-9\-/]+)"
BILL_RE = r"(?:bill\s*(?:no|number|#|\.)?\s*[:\-]\s*)([A-Z0-9\-/]+)"
DOC_NUM_RE = r"(?:document\s*(?:no|number|#|\.)?\s*[:\-]\s*)([A-Z0-9\-]+)"

HOLDER_NAME_RE = r"(?:holder\s*(?:name)?|card\s*holder|cardholder|account\s*holder)\s*[:\-]\s*([A-Za-z\s\.'\-]+?)(?:\n|$)"
CARD_NUM_RE = r"(?:card\s*(?:no|number|#|\.)?|account\s*(?:no|number|#|\.)?|member\s*(?:no|number)?)\s*[:\-]\s*([A-Z0-9\-/\s]{8,20})"
ADDRESS_FALLBACK_RE = r"((?:door|street|road|colony|sector|phase|block|house|building|apt|flat|village|city|town|district|state|pincode|pin\s*code)[,\s]*[\w\s,\.\-/#]+(?:\n|$))"

PLACE_OF_BIRTH_RE = r"(?:place\s*of\s*birth|pob|birth\s*place)\s*[:\-]\s*([A-Za-z\s\.'\-]+?)(?:\n|$)"
PLACE_OF_ISSUE_RE = r"(?:place\s*of\s*issue|poi|issue\s*place)\s*[:\-]\s*([A-Za-z\s\.'\-]+?)(?:\n|$)"
MOBILE_RE = r"(?:mobile|phone|contact|mobile\s*number|phone\s*number|telephone)\s*[:\-]\s*(\+?\d[\d\s\-()]{7,15})"

PAN_CLEAN_RE = re.compile(r"[^A-Z0-9]")
LABEL_EXCLUDE = r"(pan|permanent|account|number|income|tax|govt|india|date|birth|father|mother|signature|name|gender|address|dob|issue|expiry|nationality|phone|email|holder|card|aadhaar|uidai|resident)"
SEP_NL = r"\s*[:\-]?\s*\n\s*"


def detect_document_type(raw_text):
    t = raw_text.lower()
    score = sum(1 for w in ["resume", "curriculum vitae", "cv", "experience", "skills", "education", "objective"] if w in t)
    if score >= 3:
        return "resume"
    if any(w in t for w in ["passport", "passport no", "passport number"]):
        return "passport"
    if any(w in t for w in ["pan card", "permanent account number", "income tax", "income tax department", "govt of india", "pancard"]):
        return "pan_card"
    if any(w in t for w in ["aadhaar", "uidai", "aadhar"]):
        return "aadhaar_card"
    if any(w in t for w in ["invoice", "tax invoice", "inv no"]):
        return "invoice"
    if any(w in t for w in ["bill", "receipt", "payment", "total due", "amount due"]):
        return "bill"

    cleaned = PAN_CLEAN_RE.sub("", raw_text)
    pan_match = re.search(r"[A-Z]{5}\d{4}[A-Z]", cleaned)
    if pan_match:
        return "pan_card"

    if re.search(PASSPORT_NUM_RE, raw_text):
        return "passport"
    if re.search(AADHAAR_RE, raw_text):
        return "aadhaar_card"
    return "other"


def extract_fields_rule_based(raw_text, doc_type):
    fields = {"document_type": doc_type.replace("_", " ").title()}

    def get(regex):
        m = re.search(regex, raw_text, re.IGNORECASE | re.MULTILINE)
        if m:
            return m.group(1).strip()
        if r"\s*[:\-]\s*" in regex:
            alt = regex.replace(r"\s*[:\-]\s*", SEP_NL)
            m = re.search(alt, raw_text, re.IGNORECASE | re.MULTILINE)
            if m:
                return m.group(1).strip()
        return None

    if doc_type == "passport":
        fields["passport_number"] = get(PASSPORT_NUM_RE) or get(r"([A-Z][0-9]{7})")
        fields["name"] = get(NAME_RE)
        fields["dob"] = get(DOB_RE) or get(DATE_RE)
        fields["nationality"] = get(NATIONALITY_RE)
        fields["gender"] = get(GENDER_RE)
        fields["issue_date"] = get(ISSUE_RE)
        fields["expiry_date"] = get(EXPIRY_RE)
        fields["place_of_birth"] = get(PLACE_OF_BIRTH_RE)
        fields["place_of_issue"] = get(PLACE_OF_ISSUE_RE)
        fields["address"] = get(ADDRESS_RE)
        if not fields.get("name"):
            m = re.search(r"(?:mr\.|mrs\.|ms\.|shri|smt)\s+([A-Z][A-Za-z\s]+?)(?:\n|$)", raw_text, re.IGNORECASE)
            if m:
                fields["name"] = m.group(1).strip()

    elif doc_type == "pan_card":
        pan_raw = get(PAN_RE)
        if pan_raw:
            fields["pan_number"] = PAN_CLEAN_RE.sub("", pan_raw)

        fields["name"] = get(NAME_RE)
        if not fields.get("name"):
            lines = [l.strip() for l in raw_text.split("\n") if l.strip()]
            for i, line in enumerate(lines):
                if re.search(r"(pan|permanent account|income tax|govt)", line, re.I):
                    for j in range(i + 1, min(i + 6, len(lines))):
                        candidate = lines[j].strip()
                        if (not re.search(LABEL_EXCLUDE, candidate, re.I)
                                and re.match(r"^[A-Z][A-Za-z\s.'-]{4,40}$", candidate)
                                and " " in candidate):
                            fields["name"] = candidate
                            break
                    break

        fields["father_name"] = get(FATHER_RE)
        if not fields.get("father_name"):
            lines = [l.strip() for l in raw_text.split("\n") if l.strip()]
            for i, line in enumerate(lines):
                if re.search(r"(father|fathers)", line, re.I):
                    for j in range(i + 1, min(i + 3, len(lines))):
                        candidate = lines[j].strip()
                        if (not re.search(LABEL_EXCLUDE, candidate, re.I)
                                and re.match(r"^[A-Z][A-Za-z\s.'-]{4,40}$", candidate)
                                and " " in candidate):
                            fields["father_name"] = candidate
                            break
                    break

        fields["dob"] = get(DOB_RE) or get(DATE_RE)
        if not fields.get("dob"):
            m = re.search(r"(\d{2}[/\-\.]\d{2}[/\-\.]\d{4})", raw_text)
            if m:
                fields["dob"] = m.group(1).strip()

    elif doc_type == "aadhaar_card":
        fields["aadhaar_number"] = get(AADHAAR_RE)
        fields["name"] = get(NAME_RE)
        if not fields.get("name"):
            lines = [l.strip() for l in raw_text.split("\n") if l.strip()]
            for i, line in enumerate(lines):
                if re.search(r"(aadhaar|uidai)", line, re.I):
                    for j in range(i + 1, min(i + 5, len(lines))):
                        candidate = lines[j].strip()
                        if (not re.search(LABEL_EXCLUDE, candidate, re.I)
                                and re.match(r"^[A-Z][A-Za-z\s.'-]{4,40}$", candidate)
                                and " " in candidate):
                            fields["name"] = candidate
                            break
                    break

        fields["dob"] = get(DOB_RE) or get(DATE_RE)
        fields["gender"] = get(GENDER_RE)
        if not fields.get("gender"):
            m = re.search(r"(?:male|female|M|F)\b", raw_text, re.I)
            if m:
                fields["gender"] = m.group(0).title()

        fields["address"] = get(ADDRESS_RE)
        if not fields.get("address"):
            m = re.search(r"([A-Za-z0-9\s,.\-/#]{10,})", raw_text)
            if m and len(m.group(1).strip()) > 15:
                fields["address"] = m.group(1).strip()[:200]
        fields["mobile_number"] = get(MOBILE_RE) or get(PHONE_RE)

    elif doc_type in ("invoice", "bill"):
        fields["invoice_number"] = get(INVOICE_RE)
        fields["bill_number"] = get(BILL_RE)
        fields["vendor"] = get(VENDOR_RE)
        fields["date"] = get(DATE_RE)
        fields["total_amount"] = get(TOTAL_RE)
        fields["name"] = get(NAME_RE)

    elif doc_type == "resume":
        fields["name"] = get(NAME_RE)
        fields["email"] = get(EMAIL_RE)
        fields["phone"] = get(PHONE_RE)
        m = re.search(r"(?:skills|technical skills|core competencies)[:\s]*\n?([\w\s,\.#+\n]+?)(?:\n{2,}|education|experience|$)", raw_text, re.IGNORECASE | re.DOTALL)
        if m:
            fields["skills"] = m.group(1).strip()[:200]
        m = re.search(r"(?:education|academic|qualification)[:\s]*\n?([\w\s,\.\-\(\)\n]+?)(?:\n{2,}|experience|skills|$)", raw_text, re.IGNORECASE | re.DOTALL)
        if m:
            fields["education"] = m.group(1).strip()[:300]
        m = re.search(r"(?:experience|work experience|professional experience)[:\s]*\n?([\w\s,\.\-\(\)\n]+?)(?:\n{2,}|education|skills|$)", raw_text, re.IGNORECASE | re.DOTALL)
        if m:
            fields["experience_summary"] = m.group(1).strip()[:300]

    else:
        fields["name"] = get(NAME_RE)
        if not fields.get("name"):
            fields["name"] = get(HOLDER_NAME_RE)
        fields["holder_name"] = get(HOLDER_NAME_RE)
        fields["document_number"] = get(DOC_NUM_RE) or get(CARD_NUM_RE) or get(PAN_RE) or get(PASSPORT_NUM_RE)
        fields["card_number"] = get(CARD_NUM_RE)
        fields["date"] = get(DATE_RE)
        fields["email"] = get(EMAIL_RE)
        fields["phone"] = get(PHONE_RE)
        fields["father_name"] = get(FATHER_RE)
        fields["address"] = get(ADDRESS_RE) or get(ADDRESS_FALLBACK_RE)
        fields["dob"] = get(DOB_RE) or get(DATE_RE)

    return {k: v for k, v in fields.items() if v}


def extract_with_openai(raw_text, doc_type):
    schema = DOC_TYPES.get(doc_type, DOC_TYPES["other"])
    hints = {
        "passport": "Extract passport details. Passport number format is one letter followed by 7 digits (e.g. W23454542).",
        "pan_card": "Extract Indian PAN card details. PAN number format is 5 uppercase letters + 4 digits + 1 uppercase letter (e.g. ABCDE1234F). The cardholder name is in all caps. Father's name is also present. DOB is in DD/MM/YYYY format. Common labels: 'Permanent Account Number', 'Name', 'Father's Name', 'Date of Birth'.",
        "aadhaar_card": "Extract Aadhaar card details. Aadhaar is 12 digits in groups of 4 (e.g. 1234 5678 9012).",
        "invoice": "Extract invoice details including invoice number, customer name, vendor, date, and total amount.",
        "bill": "Extract bill/receipt details including bill number, vendor, date, and total amount.",
        "resume": "Extract resume details including full name, email, phone, skills, education, and experience.",
        "other": "Extract any document details found: name, document number, date, email, phone, father's name, holder name, card number, address, and date of birth. Look for labels like 'Name', 'Card Number', 'Account Number', 'Father's Name', 'Address', 'DOB', 'Phone', 'Email'.",
    }
    prompt = f"""{hints.get(doc_type, hints["other"])}

Return ONLY a JSON object with these exact keys: {json.dumps(schema)}
Set missing fields to null. No extra keys.

OCR text from document:
{raw_text[:4000]}"""

    try:
        r = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You extract structured data from OCR text. Return ONLY valid JSON."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.05, max_tokens=600,
        )
        c = r.choices[0].message.content.strip()
        c = re.sub(r"^```(?:json)?\s*|\s*```$", "", c)
        return {k: v for k, v in json.loads(c).items() if v is not None}
    except Exception:
        return None


def extract_fields(raw_text):
    if not raw_text or len(raw_text.strip()) < 5:
        return {}, {}, 0.0

    doc_type = detect_document_type(raw_text)
    rule_fields = extract_fields_rule_based(raw_text, doc_type)

    ai_fields = None
    if client:
        try:
            ai_fields = extract_with_openai(raw_text, doc_type)
        except Exception:
            ai_fields = None

    merged, scores = {}, {}
    keys = set(list(rule_fields.keys()) + (list(ai_fields.keys()) if ai_fields else []))

    for k in keys:
        rv = rule_fields.get(k)
        av = ai_fields.get(k) if ai_fields else None
        if rv and av:
            if rv.strip().lower() == av.strip().lower():
                merged[k], scores[k] = rv, 0.92
            elif len(av) >= len(rv):
                merged[k], scores[k] = av, 0.82
            else:
                merged[k], scores[k] = rv, 0.72
        elif av:
            merged[k], scores[k] = av, round(min(0.80, 0.50 + len(av.strip()) * 0.02), 2)
        elif rv:
            merged[k], scores[k] = rv, 0.65 if len(rv) > 4 else 0.50

    overall = round(sum(scores.values()) / len(scores), 2) if scores else 0.0
    return merged, scores, overall
