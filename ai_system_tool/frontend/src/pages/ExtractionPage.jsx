import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Document, Page, pdfjs } from 'react-pdf'
import Breadcrumb from '../components/Breadcrumb'
import {
  Save, Edit2, Check, X, Loader2, AlertCircle,
  Fingerprint, User, Calendar, Globe, Hash, MapPin, FileText,
  Mail, Phone, BookOpen, Briefcase, DollarSign, Building,
  ZoomIn, ZoomOut, RotateCcw,
} from 'lucide-react'
import { getDocument, updateDocument } from '../services/api'

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

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
  voter_id_number: { icon: Fingerprint, label: 'Voter ID Number' },
}

const DOC_FIELDS = {
  passport: ['document_type', 'passport_number', 'name', 'dob', 'nationality', 'gender', 'issue_date', 'expiry_date', 'place_of_birth', 'place_of_issue', 'address'],
  pan_card: ['document_type', 'pan_number', 'name', 'father_name', 'dob'],
  aadhaar_card: ['document_type', 'aadhaar_number', 'name', 'dob', 'gender', 'address', 'mobile_number'],
  invoice: ['document_type', 'invoice_number', 'name', 'vendor', 'date', 'total_amount'],
  bill: ['document_type', 'bill_number', 'vendor', 'date', 'total_amount', 'name'],
  resume: ['document_type', 'name', 'email', 'phone', 'skills', 'education', 'experience_summary'],
  voter_id: ['document_type', 'voter_id_number', 'name', 'father_name', 'gender', 'dob', 'address'],
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
  const [scale, setScale] = useState(1)
  const [saveIndicator, setSaveIndicator] = useState('')
  const [progressStep, setProgressStep] = useState('')
  const [progressMessage, setProgressMessage] = useState('')
  const saveTimerRef = useRef(null)
  const wsRef = useRef(null)

  const zoomIn = () => setScale((s) => Math.min(4, +(s + 0.25).toFixed(2)))
  const zoomOut = () => setScale((s) => Math.max(0.25, +(s - 0.25).toFixed(2)))
  const zoomReset = () => setScale(1)

  const autoSave = useCallback((data) => {
    setSaveIndicator('Saving...')
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(async () => {
      try {
        await updateDocument(id, { extracted_data: data })
        setSaveIndicator('Saved')
        setTimeout(() => setSaveIndicator(''), 2000)
      } catch {
        setSaveIndicator('Save failed')
      }
    }, 1500)
  }, [id])

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (!id) return
    let cancelled = false
    let pollTimer = null
    const POLL_TIMEOUT = 600000
    const startTime = Date.now()

    const wsBase = (import.meta.env.VITE_API_URL || '').replace(/^http/, 'ws').replace(/\/api\/?$/, '')
    const wsUrl = wsBase + '/ws/document/' + id

    const connectWs = () => {
      if (cancelled) return
      try {
        const ws = new WebSocket(wsUrl)
        wsRef.current = ws
        ws.onmessage = (e) => {
          if (cancelled) return
          try {
            const ev = JSON.parse(e.data)
            setProgressStep(ev.step || '')
            setProgressMessage(ev.message || '')
            if (ev.status === 'completed' && ev.payload) {
              setDoc((prev) => ({
                ...(prev || {}),
                status: 'completed',
                extracted_data: ev.payload.extracted_data || {},
                confidence_scores: ev.payload.confidence_scores || {},
                overall_confidence: ev.payload.overall_confidence || 0,
                raw_text: ev.payload.raw_text || '',
                ocr_words: ev.payload.ocr_words || [],
                error_message: null,
              }))
              setProcessing(false)
            } else if (ev.status === 'failed') {
              setDoc((prev) => ({
                ...(prev || {}),
                status: 'failed',
                error_message: ev.payload?.error_message || 'Extraction failed',
              }))
              setProcessing(false)
            }
          } catch (err) {
            console.warn('[WS] parse error', err)
          }
        }
        ws.onclose = () => {
          wsRef.current = null
        }
        ws.onerror = () => {
          ws.close()
          wsRef.current = null
        }
      } catch (err) {
        console.warn('[WS] connection failed, falling back to polling', err)
      }
    }

    connectWs()

    const fetchDoc = () => {
      if (cancelled) return
      getDocument(id)
        .then((res) => {
          if (cancelled) return
          setDoc(res.data)
          setEditedFields(res.data.extracted_data || {})
          setLoading(false)
          if (res.data.status === 'processing') {
            if (Date.now() - startTime > POLL_TIMEOUT) {
              setProcessing(false)
              setError('Extraction is taking longer than expected. The server may be waking up from sleep (cold start). Please try uploading again.')
              return
            }
            setProcessing(true)
            setProgressStep(res.data.progress_step || 'processing')
            setProgressMessage(res.data.progress_message || 'Running OCR and AI extraction...')
            pollTimer = setTimeout(fetchDoc, 3000)
          } else {
            setProcessing(false)
            setProgressStep(res.data.progress_step || '')
            setProgressMessage(res.data.progress_message || '')
          }
        })
        .catch((err) => {
          if (!cancelled) {
            setError(err.message)
            setLoading(false)
          }
        })
    }

    fetchDoc()
    return () => {
      cancelled = true
      if (pollTimer) clearTimeout(pollTimer)
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
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
          onClick={() => navigate('/dashboard')}
          className="text-[#6366f1] hover:underline text-sm"
        >
          Back to dashboard
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

  const isPdf = doc.file_type === 'application/pdf'
  const isImage = doc.file_type?.startsWith('image/')

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: 'Documents', href: '/documents' },
        { label: doc?.original_name || 'Extraction' },
      ]} />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={fileUrl}
            download={doc.original_name}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 md:px-4 py-2 bg-[#f1f5f9] text-[#475569] rounded-lg text-sm font-medium hover:text-[#0f172a] hover:bg-[#cbd5e1] transition-colors"
          >
            <svg size={16} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            <span className="hidden sm:inline">Download</span>
          </a>
          {saveIndicator && <span className={'text-xs ' + (saveIndicator === 'Saved' ? 'text-[#22c55e]' : saveIndicator === 'Save failed' ? 'text-[#ef4444]' : 'text-[#f59e0b]')}>{saveIndicator}</span>}
          {editing ? (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-3 md:px-4 py-2 bg-[#22c55e] text-white rounded-lg text-sm font-medium hover:bg-[#16a34a] transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                Save
              </button>
              <button
                onClick={() => {
                  setEditing(false)
                  setEditedFields({ ...doc.extracted_data })
                }}
                className="flex items-center gap-2 px-3 md:px-4 py-2 bg-[#f1f5f9] text-[#475569] rounded-lg text-sm font-medium hover:text-[#0f172a] transition-colors"
              >
                <X size={16} />
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 px-3 md:px-4 py-2 bg-[#6366f1]/10 text-[#6366f1] rounded-lg text-sm font-medium hover:bg-[#6366f1]/20 transition-colors"
            >
              <Edit2 size={16} />
              Edit
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#ffffff] border border-[#f1f5f9] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#f1f5f9]">
            <div className="flex items-center justify-between">
              <h3 className="text-[#0f172a] font-medium text-sm">Document Preview</h3>
              {(isImage || isPdf) && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={zoomOut}
                    disabled={scale <= 0.25}
                    className="p-1.5 rounded-lg text-[#64748b] hover:text-[#0f172a] hover:bg-[#f1f5f9] transition-colors disabled:opacity-30"
                    title="Zoom Out"
                  >
                    <ZoomOut size={16} />
                  </button>
                  <button
                    onClick={zoomReset}
                    className="px-2 py-1 rounded-lg text-xs font-medium text-[#475569] hover:text-[#0f172a] hover:bg-[#f1f5f9] transition-colors min-w-[48px] text-center"
                    title="Reset Zoom"
                  >
                    {Math.round(scale * 100)}%
                  </button>
                  <button
                    onClick={zoomIn}
                    disabled={scale >= 4}
                    className="p-1.5 rounded-lg text-[#64748b] hover:text-[#0f172a] hover:bg-[#f1f5f9] transition-colors disabled:opacity-30"
                    title="Zoom In"
                  >
                    <ZoomIn size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
          <div
            className="p-4 flex flex-col items-center justify-center min-h-[400px] bg-[#f8fafc] overflow-auto"
            onWheel={(e) => {
              if (e.ctrlKey || e.metaKey) {
                e.preventDefault()
                if (e.deltaY < 0) zoomIn()
                else zoomOut()
              }
            }}
          >
            {isImage ? (
              <div className="inline-flex items-start justify-center overflow-hidden">
                <div style={{ transform: `scale(${scale})`, transformOrigin: 'center top' }} className="transition-transform duration-200">
                  <div className="relative">
                    <img
                      src={fileUrl}
                      alt="Document"
                      className="rounded-lg object-contain block"
                    />
                  </div>
                </div>
              </div>
            ) : isPdf ? (
              <div className="w-full flex flex-col items-center">
                <Document
                  file={fileUrl}
                  onLoadSuccess={onDocumentLoadSuccess}
                  loading={<Loader2 size={24} className="animate-spin text-[#6366f1]" />}
                  error={
                    <div className="text-center">
                      <FileText size={64} className="text-[#cbd5e1] mx-auto mb-3" />
                      <p className="text-[#64748b] text-sm">{doc.original_name}</p>
                      <p className="text-[#94a3b8] text-xs mt-1">PDF preview unavailable</p>
                    </div>
                  }
                >
                  <Page
                    pageNumber={pageNum}
                    scale={scale}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    className="max-w-full"
                  />
                </Document>
                {numPages > 1 && (
                  <div className="flex items-center gap-3 mt-3">
                    <button
                      onClick={() => setPageNum((p) => Math.max(1, p - 1))}
                      disabled={pageNum <= 1}
                      className="px-3 py-1 bg-[#f1f5f9] text-[#475569] text-xs rounded-lg hover:text-[#0f172a] transition-colors disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span className="text-xs text-[#64748b]">
                      {pageNum} / {numPages}
                    </span>
                    <button
                      onClick={() => setPageNum((p) => Math.min(numPages, p + 1))}
                      disabled={pageNum >= numPages}
                      className="px-3 py-1 bg-[#f1f5f9] text-[#475569] text-xs rounded-lg hover:text-[#0f172a] transition-colors disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center">
                <FileText size={64} className="text-[#cbd5e1] mx-auto mb-3" />
                <p className="text-[#64748b] text-sm">{doc.original_name}</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-[#ffffff] border border-[#f1f5f9] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#f1f5f9]">
            <h3 className="text-[#0f172a] font-medium text-sm">Extracted Fields</h3>
          </div>
          <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
            {processing ? (
              <div className="text-center py-12 space-y-4">
                <div className="relative mx-auto w-16 h-16">
                  <div className="absolute inset-0 border-4 border-[#f1f5f9] rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-transparent border-t-[#6366f1] rounded-full animate-spin"></div>
                </div>
                <p className="text-[#0f172a] text-sm font-medium">{progressStep ? progressStep.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'Processing'}</p>
                <p className="text-[#64748b] text-xs">{progressMessage || 'Extracting text and identifying fields'}</p>
              </div>
            ) : relevantKeys.map((key) => {
              const meta = fieldMeta[key]
              if (!meta) return null
              const Icon = meta.icon
              const val = editing ? editedFields[key] : fields[key]
              const conf = confidences[key]
              return (
                <div key={key} className="bg-[#f1f5f9] rounded-lg p-3">
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
                      onChange={(e) => {
                        const next = { ...editedFields, [key]: e.target.value }
                        setEditedFields(next)
                        autoSave(next)
                      }}
                      className="w-full bg-[#ffffff] border border-[#cbd5e1] rounded-md px-2 py-1 text-[#0f172a] text-sm focus:outline-none focus:border-[#6366f1] transition-colors"
                    />
                  ) : (
                    <p className="text-[#0f172a] text-sm font-medium break-words">{val || '—'}</p>
                  )}
                </div>
              )
            })}
            {!processing && relevantKeys.every((k) => !fields[k]) && (
              <div className="text-center py-8 space-y-3">
                <AlertCircle size={32} className="text-[#f59e0b] mx-auto" />
                <p className="text-[#475569] text-sm">No fields could be extracted</p>
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
        <div className="bg-[#ffffff] border border-[#f1f5f9] rounded-xl overflow-hidden">
          <button
            onClick={() => setShowRaw(!showRaw)}
            className="w-full p-4 flex items-center justify-between text-[#0f172a] text-sm font-medium hover:bg-[#f1f5f9]/50 transition-colors"
          >
            <span>Raw Extracted Text</span>
            <span className="text-[#64748b] text-xs">{showRaw ? 'Hide' : 'Show'} ({doc.raw_text.length} chars)</span>
          </button>
          {showRaw && (
            <div className="p-4 border-t border-[#f1f5f9]">
              <pre className="text-[#475569] text-xs whitespace-pre-wrap font-mono leading-relaxed max-h-64 overflow-y-auto">{doc.raw_text}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
