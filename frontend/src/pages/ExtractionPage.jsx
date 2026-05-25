import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Document, Page, pdfjs } from 'react-pdf'
import {
  ArrowLeft, Save, Edit2, Check, X, Loader2, AlertCircle,
  Fingerprint, User, Calendar, Globe, Hash, MapPin, FileText,
  Mail, Phone, BookOpen, Briefcase, DollarSign, Building,
} from 'lucide-react'
import { getDocument, updateDocument } from '../services/api'

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

const fieldMeta = {
  document_type: { icon: FileText, label: 'Document Type' },
  passport_number: { icon: Fingerprint, label: 'Passport Number' },
  name: { icon: User, label: 'Full Name' },
  dob: { icon: Calendar, label: 'Date of Birth' },
  nationality: { icon: Globe, label: 'Nationality' },
  gender: { icon: User, label: 'Gender' },
  pan_number: { icon: Hash, label: 'PAN Number' },
  aadhaar_number: { icon: Fingerprint, label: 'Aadhaar Number' },
  address: { icon: MapPin, label: 'Address' },
  document_number: { icon: Hash, label: 'Document Number' },
  father_name: { icon: User, label: "Father's Name" },
  issue_date: { icon: Calendar, label: 'Issue Date' },
  expiry_date: { icon: Calendar, label: 'Expiry Date' },
  email: { icon: Mail, label: 'Email' },
  phone: { icon: Phone, label: 'Phone' },
  skills: { icon: BookOpen, label: 'Skills' },
  education: { icon: BookOpen, label: 'Education' },
  experience_summary: { icon: Briefcase, label: 'Experience' },
  invoice_number: { icon: Hash, label: 'Invoice Number' },
  bill_number: { icon: Hash, label: 'Bill Number' },
  vendor: { icon: Building, label: 'Vendor' },
  total_amount: { icon: DollarSign, label: 'Total Amount' },
  date: { icon: Calendar, label: 'Date' },
  holder_name: { icon: User, label: 'Holder Name' },
  card_number: { icon: Hash, label: 'Card Number' },
  place_of_birth: { icon: Globe, label: 'Place of Birth' },
  place_of_issue: { icon: MapPin, label: 'Place of Issue' },
  mobile_number: { icon: Phone, label: 'Mobile Number' },
}

const DOC_FIELDS = {
  passport: ['document_type', 'passport_number', 'name', 'dob', 'nationality', 'gender', 'issue_date', 'expiry_date', 'place_of_birth', 'place_of_issue', 'address'],
  pan_card: ['document_type', 'pan_number', 'name', 'father_name', 'dob'],
  aadhaar_card: ['document_type', 'aadhaar_number', 'name', 'dob', 'gender', 'address', 'mobile_number'],
  invoice: ['document_type', 'invoice_number', 'name', 'vendor', 'date', 'total_amount'],
  bill: ['document_type', 'bill_number', 'vendor', 'date', 'total_amount', 'name'],
  resume: ['document_type', 'name', 'email', 'phone', 'skills', 'education', 'experience_summary'],
  other: ['document_type', 'name', 'document_number', 'date', 'email', 'phone', 'father_name', 'holder_name', 'card_number', 'address', 'dob'],
}

function getConfidenceColor(score) {
  if (score >= 0.85) return 'text-[#22c55e]'
  if (score >= 0.6) return 'text-[#f59e0b]'
  return 'text-[#ef4444]'
}

function getConfidenceBg(score) {
  if (score >= 0.85) return 'bg-[#22c55e]'
  if (score >= 0.6) return 'bg-[#f59e0b]'
  return 'bg-[#ef4444]'
}

export default function ExtractionPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [doc, setDoc] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [editedFields, setEditedFields] = useState({})
  const [saving, setSaving] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [numPages, setNumPages] = useState(null)
  const [pageNum, setPageNum] = useState(1)
  const [showRaw, setShowRaw] = useState(false)

  useEffect(() => {
    if (!id) return
    let cancelled = false

    const fetchDoc = () =>
      getDocument(id)
        .then((res) => {
          if (cancelled) return
          setDoc(res.data)
          setEditedFields(res.data.extracted_data || {})
          if (res.data.status === 'processing') {
            setProcessing(true)
            setTimeout(fetchDoc, 2000)
          } else {
            setProcessing(false)
          }
        })
        .catch((err) => {
          if (!cancelled) setError(err.message)
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })

    fetchDoc()
    return () => { cancelled = true }
  }, [id])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await updateDocument(id, { extracted_data: editedFields })
      setDoc(res.data)
      setEditing(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-[#6366f1]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle size={48} className="text-[#ef4444]" />
        <p className="text-[#ef4444]">{error}</p>
        <button
          onClick={() => navigate('/documents')}
          className="text-[#6366f1] hover:underline text-sm"
        >
          Back to documents
        </button>
      </div>
    )
  }

  if (!doc) return null

  const fields = doc.extracted_data || {}
  const confidences = doc.confidence_scores || {}
  const docType = (fields.document_type || '').toLowerCase().replace(/\s+/g, '_')
  const relevantKeys = DOC_FIELDS[docType] || DOC_FIELDS.other

  const fileUrl = doc.file_path?.startsWith('/')
    ? `${(import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '')}${doc.file_path}`
    : doc.file_path

  const isPdf = fileUrl?.endsWith('.pdf')
  const isImage = fileUrl?.match(/\.(jpg|jpeg|png|webp)$/i)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/documents')}
          className="flex items-center gap-2 text-[#94a3b8] hover:text-[#f1f5f9] transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="text-sm font-medium">Back to Documents</span>
        </button>
        <div className="flex items-center gap-2">
          <a
            href={fileUrl}
            download={doc.original_name}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-[#1e293b] text-[#94a3b8] rounded-lg text-sm font-medium hover:text-[#f1f5f9] hover:bg-[#334155] transition-colors"
          >
            <svg size={16} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Download
          </a>
          {editing ? (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-[#22c55e] text-white rounded-lg text-sm font-medium hover:bg-[#16a34a] transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                Save
              </button>
              <button
                onClick={() => {
                  setEditing(false)
                  setEditedFields({ ...doc.extracted_data })
                }}
                className="flex items-center gap-2 px-4 py-2 bg-[#1e293b] text-[#94a3b8] rounded-lg text-sm font-medium hover:text-[#f1f5f9] transition-colors"
              >
                <X size={16} />
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#6366f1]/10 text-[#6366f1] rounded-lg text-sm font-medium hover:bg-[#6366f1]/20 transition-colors"
            >
              <Edit2 size={16} />
              Edit Fields
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#1e293b]">
            <h3 className="text-[#f1f5f9] font-medium text-sm">Document Preview</h3>
          </div>
          <div className="p-4 flex flex-col items-center justify-center min-h-[400px] bg-[#020617]">
            {isImage ? (
              <img
                src={fileUrl}
                alt="Document"
                className="max-w-full max-h-[500px] rounded-lg object-contain"
              />
            ) : isPdf ? (
              <div className="w-full flex flex-col items-center">
                <Document
                  file={fileUrl}
                  onLoadSuccess={onDocumentLoadSuccess}
                  loading={<Loader2 size={24} className="animate-spin text-[#6366f1]" />}
                  error={
                    <div className="text-center">
                      <FileText size={64} className="text-[#334155] mx-auto mb-3" />
                      <p className="text-[#64748b] text-sm">{doc.original_name}</p>
                      <p className="text-[#475569] text-xs mt-1">PDF preview unavailable</p>
                    </div>
                  }
                >
                  <Page
                    pageNumber={pageNum}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    className="max-w-full"
                    width={Math.min(500, window.innerWidth - 100)}
                  />
                </Document>
                {numPages > 1 && (
                  <div className="flex items-center gap-3 mt-3">
                    <button
                      onClick={() => setPageNum((p) => Math.max(1, p - 1))}
                      disabled={pageNum <= 1}
                      className="px-3 py-1 bg-[#1e293b] text-[#94a3b8] text-xs rounded-lg hover:text-[#f1f5f9] transition-colors disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span className="text-xs text-[#64748b]">
                      {pageNum} / {numPages}
                    </span>
                    <button
                      onClick={() => setPageNum((p) => Math.min(numPages, p + 1))}
                      disabled={pageNum >= numPages}
                      className="px-3 py-1 bg-[#1e293b] text-[#94a3b8] text-xs rounded-lg hover:text-[#f1f5f9] transition-colors disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center">
                <FileText size={64} className="text-[#334155] mx-auto mb-3" />
                <p className="text-[#64748b] text-sm">{doc.original_name}</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#1e293b] flex items-center justify-between">
            <h3 className="text-[#f1f5f9] font-medium text-sm">Extracted Fields</h3>
            {doc.overall_confidence >= 0.7 && (
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${getConfidenceColor(doc.overall_confidence || 0)} bg-current/10`}>
                {Math.round((doc.overall_confidence || 0) * 100)}% confident
              </span>
            )}
            {doc.overall_confidence > 0 && doc.overall_confidence < 0.7 && (
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20">
                Needs Review
              </span>
            )}
          </div>
          <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
            {relevantKeys.map((key) => {
              const meta = fieldMeta[key]
              if (!meta) return null
              const Icon = meta.icon
              const val = editing ? editedFields[key] : fields[key]
              const conf = confidences[key]
              return (
                <div key={key} className="bg-[#1e293b] rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2 text-[#64748b] text-xs">
                      <Icon size={14} />
                      {meta.label}
                    </div>
                    {conf !== undefined && (
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${getConfidenceBg(conf)}`} />
                        <span className={`text-xs ${getConfidenceColor(conf)}`}>
                          {Math.round(conf * 100)}%
                        </span>
                      </div>
                    )}
                  </div>
                  {editing ? (
                    <input
                      type="text"
                      value={val || ''}
                      onChange={(e) => setEditedFields({ ...editedFields, [key]: e.target.value })}
                      className="w-full bg-[#0f172a] border border-[#334155] rounded-md px-2 py-1 text-[#f1f5f9] text-sm focus:outline-none focus:border-[#6366f1] transition-colors"
                    />
                  ) : (
                    <p className="text-[#f1f5f9] text-sm font-medium break-words">{val || '—'}</p>
                  )}
                </div>
              )
            })}
            {processing && (
              <div className="text-center py-8 space-y-3">
                <Loader2 size={32} className="animate-spin text-[#6366f1] mx-auto" />
                <p className="text-[#94a3b8] text-sm">Extracting fields from document...</p>
              </div>
            )}
            {!processing && relevantKeys.every((k) => !fields[k]) && (
              <div className="text-center py-8 space-y-3">
                <AlertCircle size={32} className="text-[#f59e0b] mx-auto" />
                <p className="text-[#94a3b8] text-sm">No fields could be extracted</p>
                {doc.error_message && (
                  <p className="text-[#ef4444] text-xs">{doc.error_message}</p>
                )}
                <p className="text-[#64748b] text-xs">The document may be a scanned image without text layer. Install Tesseract OCR for image text extraction.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {doc.raw_text && (
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl overflow-hidden">
          <button
            onClick={() => setShowRaw(!showRaw)}
            className="w-full p-4 flex items-center justify-between text-[#f1f5f9] text-sm font-medium hover:bg-[#1e293b]/50 transition-colors"
          >
            <span>Raw Extracted Text</span>
            <span className="text-[#64748b] text-xs">{showRaw ? 'Hide' : 'Show'} ({doc.raw_text.length} chars)</span>
          </button>
          {showRaw && (
            <div className="p-4 border-t border-[#1e293b]">
              <pre className="text-[#94a3b8] text-xs whitespace-pre-wrap font-mono leading-relaxed max-h-64 overflow-y-auto">{doc.raw_text}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
