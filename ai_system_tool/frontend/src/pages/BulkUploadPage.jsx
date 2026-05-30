import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import {
  Upload, File, X, CheckCircle, AlertCircle, Loader2,
  FileText, Image, Layers, ExternalLink,
} from 'lucide-react'
import { uploadBulkDocuments } from '../services/api'

const ALLOWED_TYPES = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'application/pdf': '.pdf',
}
const MAX_SIZE = 10 * 1024 * 1024

export default function BulkUploadPage() {
  const navigate = useNavigate()
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [results, setResults] = useState(null)

  const onDrop = useCallback((accepted) => {
    setFiles((prev) => [...prev, ...accepted.map((f) => Object.assign(f, { preview: URL.createObjectURL(f) }))])
    setError('')
    setResults(null)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ALLOWED_TYPES,
    maxSize: MAX_SIZE,
    multiple: true,
  })

  const removeFile = (idx) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx))
  }

  const clearAll = () => {
    setFiles([])
    setResults(null)
    setError('')
  }

  const handleUpload = async () => {
    if (!files.length) return
    setUploading(true)
    setProgress(0)
    setError('')
    try {
      const res = await uploadBulkDocuments(files, (e) => {
        const pct = Math.round((e.loaded * 100) / e.total)
        setProgress(pct)
      })
      setResults(res.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const getFileIcon = (file) => {
    if (file.type === 'application/pdf') return <FileText size={20} />
    return <Image size={20} />
  }

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  const acceptedCount = results?.results?.filter((r) => r.status === 'queued').length || 0
  const rejectedCount = results?.results?.filter((r) => r.status === 'rejected').length || 0

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-[#f1f5f9]">Bulk Upload</h2>
        <p className="text-[#64748b] text-sm mt-1">
          Upload multiple documents at once for batch extraction
        </p>
      </div>

      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          isDragActive
            ? 'border-[#6366f1] bg-[#6366f1]/5'
            : 'border-[#334155] bg-[#0f172a] hover:border-[#6366f1]/50'
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          <div className={`p-3 rounded-full ${isDragActive ? 'bg-[#6366f1]/20' : 'bg-[#1e293b]'}`}>
            <Layers size={28} className={isDragActive ? 'text-[#6366f1]' : 'text-[#64748b]'} />
          </div>
          {isDragActive ? (
            <p className="text-[#6366f1] font-medium">Drop files here</p>
          ) : (
            <>
              <p className="text-[#cbd5e1] font-medium">Drag & drop multiple files here</p>
              <p className="text-[#64748b] text-sm">or click to browse</p>
              <p className="text-[#475569] text-xs mt-1">
                Supports: JPG, PNG, WebP, PDF (each max 10MB)
              </p>
            </>
          )}
        </div>
      </div>

      {files.length > 0 && !results && (
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[#f1f5f9]">{files.length} file(s) selected</span>
            <button
              onClick={clearAll}
              className="text-xs text-[#64748b] hover:text-[#ef4444] transition-colors"
            >
              Clear all
            </button>
          </div>
          {files.map((file, idx) => (
            <div key={idx} className="flex items-center justify-between p-2 bg-[#1e293b] rounded-lg">
              <div className="flex items-center gap-3">
                <div className="text-[#6366f1]">{getFileIcon(file)}</div>
                <div>
                  <p className="text-[#f1f5f9] text-sm truncate max-w-[300px]">{file.name}</p>
                  <p className="text-[#64748b] text-xs">{formatSize(file.size)}</p>
                </div>
              </div>
              <button
                onClick={() => removeFile(idx)}
                className="p-1 text-[#64748b] hover:text-[#ef4444] transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-4 bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-xl text-[#ef4444] text-sm">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {uploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[#94a3b8]">Uploading {files.length} files...</span>
            <span className="text-[#6366f1] font-medium">{progress}%</span>
          </div>
          <div className="h-2 bg-[#1e293b] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#6366f1] to-[#0ea5e9] rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {results && (
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#f1f5f9]">Upload Results</h3>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-[#22c55e]">{acceptedCount} queued</span>
              {rejectedCount > 0 && <span className="text-[#ef4444]">{rejectedCount} rejected</span>}
            </div>
          </div>

          {results.results?.map((r, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between p-2 rounded-lg ${
                r.status === 'queued' ? 'bg-[#1e293b]' : 'bg-[#ef4444]/5'
              }`}
            >
              <div className="flex items-center gap-3">
                {r.status === 'queued' ? (
                  <CheckCircle size={16} className="text-[#22c55e]" />
                ) : (
                  <AlertCircle size={16} className="text-[#ef4444]" />
                )}
                <span className="text-[#f1f5f9] text-sm">{r.filename}</span>
              </div>
              <div className="flex items-center gap-2">
                {r.status === 'queued' ? (
                  <button
                    onClick={() => navigate(`/extraction/${r.doc_id}`)}
                    className="flex items-center gap-1 text-xs text-[#6366f1] hover:text-[#818cf8] transition-colors"
                  >
                    View <ExternalLink size={12} />
                  </button>
                ) : (
                  <span className="text-xs text-[#ef4444]">{r.error}</span>
                )}
              </div>
            </div>
          ))}

          <button
            onClick={clearAll}
            className="w-full py-2 rounded-lg text-sm text-[#6366f1] hover:text-[#818cf8] border border-[#1e293b] hover:border-[#6366f1]/30 transition-all"
          >
            Upload More
          </button>
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!files.length || uploading || !!results}
        className={`w-full py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
          !files.length || uploading || results
            ? 'bg-[#1e293b] text-[#475569] cursor-not-allowed'
            : 'bg-gradient-to-r from-[#6366f1] to-[#0ea5e9] text-white hover:shadow-lg hover:shadow-[#6366f1]/25 active:scale-[0.98]'
        }`}
      >
        {uploading ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            Uploading {files.length} files...
          </>
        ) : (
          <>
            <Upload size={20} />
            Upload & Extract All ({files.length} files)
          </>
        )}
      </button>
    </div>
  )
}
