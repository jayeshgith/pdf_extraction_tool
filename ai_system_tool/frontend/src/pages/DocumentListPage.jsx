import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText, Eye, Trash2, Search, Loader2, AlertCircle,
  ChevronLeft, ChevronRight, Clock,
} from 'lucide-react'
import { listDocuments, deleteDocument } from '../services/api'
import Breadcrumb from '../components/Breadcrumb'

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

const currentYear = new Date().getFullYear()
const YEARS = Array.from({ length: currentYear - 2019 }, (_, i) => 2020 + i)
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1)

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
  const [year, setYear] = useState('')
  const [month, setMonth] = useState('')
  const [day, setDay] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [deleting, setDeleting] = useState(null)

  const fetchDocs = async () => {
    setLoading(true)
    setError('')
    try {
      const filters = {}
      if (search.trim()) filters.search = search.trim()
      if (year) filters.year = year
      if (month) filters.month = month
      if (day) filters.day = day
      const res = await listDocuments(page, 10, filters)
      setDocs(res.data.documents || res.data || [])
      setTotalPages(res.data.totalPages || 1)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDocs() }, [page])

  useEffect(() => {
    setPage(1)
    fetchDocs()
  }, [search, year, month, day])

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this document?')) return
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

  const selectedMonthName = month ? MONTHS[parseInt(month) - 1] : ''

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Documents' }]} />
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-[#0f172a]">All Documents</h2>
      </div>

      <div className="bg-[#ffffff] border border-[#f1f5f9] rounded-xl p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]" />
            <input
              type="text"
              placeholder="Search by document name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#f8fafc] border border-[#f1f5f9] rounded-lg text-[#0f172a] text-sm placeholder-[#64748b] focus:outline-none focus:border-[#6366f1] transition-colors"
            />
          </div>

          <select
            value={day}
            onChange={(e) => setDay(e.target.value)}
            className="px-3 py-2 bg-[#f8fafc] border border-[#f1f5f9] rounded-lg text-[#0f172a] text-sm focus:outline-none focus:border-[#6366f1] transition-colors cursor-pointer min-w-[70px]"
          >
            <option value="">Day</option>
            {DAYS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="px-3 py-2 bg-[#f8fafc] border border-[#f1f5f9] rounded-lg text-[#0f172a] text-sm focus:outline-none focus:border-[#6366f1] transition-colors cursor-pointer min-w-[90px]"
          >
            <option value="">Month</option>
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>

          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="px-3 py-2 bg-[#f8fafc] border border-[#f1f5f9] rounded-lg text-[#0f172a] text-sm focus:outline-none focus:border-[#6366f1] transition-colors cursor-pointer min-w-[90px]"
          >
            <option value="">Year</option>
            {YEARS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {(year || month || day) && (
          <div className="flex items-center gap-2 text-xs text-[#64748b]">
            <span>Filtering by:</span>
            {year && <span className="px-2 py-0.5 bg-[#f1f5f9] rounded text-[#334155]">{year}</span>}
            {month && <span className="px-2 py-0.5 bg-[#f1f5f9] rounded text-[#334155]">{selectedMonthName}</span>}
            {day && <span className="px-2 py-0.5 bg-[#f1f5f9] rounded text-[#334155]">Day {day}</span>}
            <button
              onClick={() => { setYear(''); setMonth(''); setDay('') }}
              className="text-[#6366f1] hover:underline ml-1"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-xl text-[#ef4444] text-sm">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <div className="bg-[#ffffff] border border-[#f1f5f9] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#f1f5f9]">
                <th className="text-left px-4 py-3 text-xs font-medium text-[#64748b] uppercase tracking-wider">Document</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#64748b] uppercase tracking-wider hidden md:table-cell">Type</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#64748b] uppercase tracking-wider hidden sm:table-cell">Extracted Name</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#64748b] uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#64748b] uppercase tracking-wider hidden md:table-cell">Date</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-[#64748b] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <Loader2 size={24} className="animate-spin text-[#6366f1] mx-auto" />
                  </td>
                </tr>
              ) : docs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <FileText size={48} className="text-[#cbd5e1] mx-auto mb-3" />
                    <p className="text-[#64748b]">No documents found</p>
                  </td>
                </tr>
              ) : (
                docs.map((doc) => (
                  <tr key={doc._id} className="border-b border-[#f1f5f9] hover:bg-[#f1f5f9]/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#f1f5f9] rounded-lg text-[#6366f1]">
                          <FileText size={18} />
                        </div>
                        <span className="text-[#0f172a] text-sm font-medium truncate max-w-[200px]">
                          {doc.original_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-[#475569] text-sm">{getDocType(doc)}</span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-[#334155] text-sm">
                        {doc.extracted_data?.name || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${statusColors[doc.status] || statusColors.processing}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${doc.status === 'processing' ? 'animate-pulse' : ''}`} />
                        {doc.status || 'processing'}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex items-center gap-1.5 text-[#64748b] text-xs">
                        <Clock size={12} />
                        {formatDate(doc.created_at || doc.upload_date)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate(`/extraction/${doc._id}`)}
                          className="p-2 hover:bg-[#f1f5f9] rounded-lg text-[#64748b] hover:text-[#6366f1] transition-colors"
                          title="View"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(doc._id)}
                          disabled={deleting === doc._id}
                          className="p-2 hover:bg-[#f1f5f9] rounded-lg text-[#64748b] hover:text-[#ef4444] transition-colors disabled:opacity-50"
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
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#f1f5f9]">
            <span className="text-xs text-[#64748b]">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 hover:bg-[#f1f5f9] rounded-lg text-[#64748b] hover:text-[#0f172a] transition-colors disabled:opacity-50"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 hover:bg-[#f1f5f9] rounded-lg text-[#64748b] hover:text-[#0f172a] transition-colors disabled:opacity-50"
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
