import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText, Eye, Trash2, Search, Loader2, AlertCircle,
  ChevronLeft, ChevronRight, Clock,
} from 'lucide-react'
import { listDocuments, deleteDocument } from '../services/api'

const statusColors = {
  completed: 'bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/20',
  processing: 'bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20',
  failed: 'bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/20',
}

export default function DocumentListPage() {
  const navigate = useNavigate()
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [deleting, setDeleting] = useState(null)

  const fetchDocs = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await listDocuments(page, 10)
      setDocs(res.data.documents || res.data || [])
      setTotalPages(res.data.totalPages || 1)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDocs() }, [page])

  const handleDelete = async (id) => {
    setDeleting(id)
    try {
      await deleteDocument(id)
      setDocs((prev) => prev.filter((d) => d._id !== id))
    } catch (err) {
      setError(err.message)
    } finally {
      setDeleting(null)
    }
  }

  const filtered = search
    ? docs.filter((d) =>
        d.original_name?.toLowerCase().includes(search.toLowerCase()) ||
        d.extracted_data?.name?.toLowerCase().includes(search.toLowerCase()) ||
        d.extracted_data?.document_number?.toLowerCase().includes(search.toLowerCase())
      )
    : docs

  const getDocType = (doc) => {
    const type = doc.extracted_data?.document_type
    if (type) return type
    const name = doc.original_name?.toLowerCase() || ''
    if (name.includes('passport')) return 'Passport'
    if (name.includes('pan')) return 'PAN Card'
    if (name.includes('aadhaar')) return 'Aadhaar Card'
    return 'Document'
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
      timeZone: 'Asia/Kolkata',
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#f1f5f9]">Document List</h2>
          <p className="text-[#64748b] text-sm mt-1">
            View and manage all extracted documents
          </p>
        </div>
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]" />
          <input
            type="text"
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 pl-10 pr-4 py-2 bg-[#0f172a] border border-[#1e293b] rounded-lg text-[#f1f5f9] text-sm placeholder-[#64748b] focus:outline-none focus:border-[#6366f1] transition-colors"
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-xl text-[#ef4444] text-sm">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1e293b]">
                <th className="text-left px-4 py-3 text-xs font-medium text-[#64748b] uppercase tracking-wider">Document</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#64748b] uppercase tracking-wider">Type</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#64748b] uppercase tracking-wider">Extracted Name</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#64748b] uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#64748b] uppercase tracking-wider">Confidence</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#64748b] uppercase tracking-wider">Date</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-[#64748b] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <Loader2 size={24} className="animate-spin text-[#6366f1] mx-auto" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <FileText size={48} className="text-[#334155] mx-auto mb-3" />
                    <p className="text-[#64748b]">No documents found</p>
                  </td>
                </tr>
              ) : (
                filtered.map((doc) => {
                  const conf = doc.overall_confidence
                  return (
                    <tr key={doc._id} className="border-b border-[#1e293b] hover:bg-[#1e293b]/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-[#1e293b] rounded-lg text-[#6366f1]">
                            <FileText size={18} />
                          </div>
                          <span className="text-[#f1f5f9] text-sm font-medium truncate max-w-[200px]">
                            {doc.original_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[#94a3b8] text-sm">{getDocType(doc)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[#cbd5e1] text-sm">
                          {doc.extracted_data?.name || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${statusColors[doc.status] || statusColors.processing}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${doc.status === 'processing' ? 'animate-pulse' : ''}`} />
                          {doc.status || 'processing'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-[#1e293b] rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                conf >= 0.85 ? 'bg-[#22c55e]' : conf >= 0.6 ? 'bg-[#f59e0b]' : 'bg-[#ef4444]'
                              }`}
                              style={{ width: `${(conf || 0) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-[#64748b]">
                            {conf ? `${Math.round(conf * 100)}%` : '—'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-[#64748b] text-xs">
                          <Clock size={12} />
                          {formatDate(doc.created_at || doc.upload_date)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => navigate(`/extraction/${doc._id}`)}
                            className="p-2 hover:bg-[#1e293b] rounded-lg text-[#64748b] hover:text-[#6366f1] transition-colors"
                            title="View"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(doc._id)}
                            disabled={deleting === doc._id}
                            className="p-2 hover:bg-[#1e293b] rounded-lg text-[#64748b] hover:text-[#ef4444] transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            {deleting === doc._id ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#1e293b]">
            <span className="text-xs text-[#64748b]">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 hover:bg-[#1e293b] rounded-lg text-[#64748b] hover:text-[#f1f5f9] transition-colors disabled:opacity-50"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 hover:bg-[#1e293b] rounded-lg text-[#64748b] hover:text-[#f1f5f9] transition-colors disabled:opacity-50"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
