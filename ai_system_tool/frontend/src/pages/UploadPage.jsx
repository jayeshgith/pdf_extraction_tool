import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { Upload, X, CheckCircle, AlertCircle, Loader2, Image, FileText } from 'lucide-react'
import { uploadDocument } from '../services/api'

const ALLOWED_TYPES = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'application/pdf': '.pdf',
}

const MAX_SIZE = 10 * 1024 * 1024

export default function UploadPage() {
  const navigate = useNavigate()
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const onDrop = useCallback((accepted) => {
    setFiles(accepted)
    setError('')
    setResult(null)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ALLOWED_TYPES,
    maxSize: MAX_SIZE,
    multiple: false,
  })

  const removeFile = () => {
    setFiles([])
    setError('')
    setResult(null)
  }

  const getFileIcon = (file) => {
    if (file.type === 'application/pdf') return <FileText size={40} />
    return <Image size={40} />
  }

  const handleUpload = async () => {
    if (!files.length) return
    setUploading(true)
    setProgress(0)
    setError('')
    try {
      const res = await uploadDocument(files[0], (e) => {
        const pct = Math.round((e.loaded * 100) / e.total)
        setProgress(pct)
      })
      setResult(res.data)
      setTimeout(() => navigate(`/extraction/${res.data._id}`), 1500)
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-xl md:text-2xl font-bold text-[#0f172a]">Upload Document</h2>
        <p className="text-[#64748b] mt-1 text-sm md:text-base">
          Upload a passport, PAN card, Aadhaar card, bill, resume, or any PDF/image for AI extraction
        </p>
      </div>

      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-xl p-8 md:p-12 text-center cursor-pointer transition-all ${
          isDragActive
            ? 'border-[#6366f1] bg-[#6366f1]/5'
            : 'border-[#cbd5e1] bg-[#ffffff] hover:border-[#6366f1]/50 hover:bg-[#f8fafc]'
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-4">
          <div className={`p-4 rounded-full ${isDragActive ? 'bg-[#6366f1]/20' : 'bg-[#f1f5f9]'}`}>
            <Upload size={32} className={isDragActive ? 'text-[#6366f1]' : 'text-[#64748b]'} />
          </div>
          {isDragActive ? (
            <p className="text-[#6366f1] font-medium">Drop your file here</p>
          ) : (
            <>
              <p className="text-[#334155] font-medium">
                Drag & drop your document here
              </p>
              <p className="text-[#64748b] text-sm">or click to browse</p>
              <p className="text-[#94a3b8] text-xs mt-2">
                Supports: JPG, PNG, WebP, PDF (max 10MB)
              </p>
            </>
          )}
        </div>
      </div>

      {files.length > 0 && (
        <div className="bg-[#ffffff] border border-[#e2e8f0] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#f1f5f9] rounded-lg text-[#6366f1]">
                {getFileIcon(files[0])}
              </div>
              <div>
                <p className="text-[#0f172a] font-medium text-sm truncate max-w-[300px]">
                  {files[0].name}
                </p>
                <p className="text-[#64748b] text-xs">
                  {(files[0].size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              onClick={removeFile}
              className="p-1.5 hover:bg-[#f1f5f9] rounded-lg text-[#64748b] hover:text-[#ef4444] transition-colors"
            >
              <X size={18} />
            </button>
          </div>
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
            <span className="text-[#475569]">Uploading...</span>
            <span className="text-[#6366f1] font-medium">{progress}%</span>
          </div>
          <div className="h-2 bg-[#f1f5f9] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#6366f1] to-[#0ea5e9] rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {result && (
        <div className="flex items-center gap-2 p-4 bg-[#22c55e]/10 border border-[#22c55e]/20 rounded-xl text-[#22c55e] text-sm">
          <CheckCircle size={18} />
          Document uploaded successfully! Redirecting to extraction...
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!files.length || uploading}
        className={`w-full py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
          !files.length || uploading
            ? 'bg-[#f1f5f9] text-[#94a3b8] cursor-not-allowed'
            : 'bg-gradient-to-r from-[#6366f1] to-[#0ea5e9] text-white hover:shadow-lg hover:shadow-[#6366f1]/25 active:scale-[0.98]'
        }`}
      >
        {uploading ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Upload size={20} />
            Upload & Extract
          </>
        )}
      </button>
    </div>
  )
}
