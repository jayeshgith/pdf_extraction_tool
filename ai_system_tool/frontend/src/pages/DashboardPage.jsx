import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CheckCircle2, RefreshCw, BarChart3,
  Search, Eye, Trash2, ChevronLeft, ChevronRight,
  TrendingUp, Award, Layers, Sparkles,
  Filter, X, CalendarDays, ListOrdered
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'
import { listDocuments, deleteDocument, getDashboardStats } from '../services/api'

const COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
const statusColors = {
  completed: 'bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/20',
  processing: 'bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20',
  failed: 'bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/20',
  queued: 'bg-[#6366f1]/10 text-[#6366f1] border-[#6366f1]/20',
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [allDocs, setAllDocs] = useState([])
  const [docsLoading, setDocsLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(null)
  const [viewAll, setViewAll] = useState(false)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [docTypeFilter, setDocTypeFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const [page, setPage] = useState(1)
  const pageSize = viewAll ? 10 : 5

  const loadDashboardData = async () => {
    setStatsLoading(true)
    try {
      const statsRes = await getDashboardStats()
      setStats(statsRes.data)
    } catch (err) {
      console.error("Failed to load dashboard metrics", err)
    } finally {
      setStatsLoading(false)
    }
  }

  const fetchAllDocs = async () => {
    setDocsLoading(true)
    setError('')
    try {
      const res = await listDocuments(1, 500)
      setAllDocs(res.data.documents || res.data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setDocsLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
    fetchAllDocs()
  }, [])

  useEffect(() => {
    setPage(1)
  }, [viewAll, search, statusFilter, docTypeFilter, dateFrom, dateTo])

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return
    setDeleting(id)
    try {
      await deleteDocument(id)
      setAllDocs((prev) => prev.filter((d) => d._id !== id))
      loadDashboardData()
    } catch (err) {
      setError(err.message)
    } finally {
      setDeleting(null)
    }
  }

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('')
    setDocTypeFilter('')
    setDateFrom('')
    setDateTo('')
  }

  const hasActiveFilters = search || statusFilter || docTypeFilter || dateFrom || dateTo

  const getDocType = (doc) => {
    return doc.extracted_data?.document_type || 'Unclassified'
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric',
      timeZone: 'Asia/Kolkata',
    })
  }

  const filteredDocs = useMemo(() => {
    let result = [...allDocs]

    if (search) {
      const q = search.toLowerCase()
      result = result.filter((d) =>
        d.original_name?.toLowerCase().includes(q) ||
        d.extracted_data?.name?.toLowerCase().includes(q)
      )
    }

    if (statusFilter) {
      result = result.filter((d) => d.status === statusFilter)
    }

    if (docTypeFilter) {
      result = result.filter((d) => getDocType(d).toLowerCase() === docTypeFilter.toLowerCase())
    }

    if (dateFrom) {
      const from = new Date(dateFrom)
      result = result.filter((d) => d.created_at && new Date(d.created_at) >= from)
    }

    if (dateTo) {
      const to = new Date(dateTo)
      to.setHours(23, 59, 59, 999)
      result = result.filter((d) => d.created_at && new Date(d.created_at) <= to)
    }

    result.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))

    return result
  }, [allDocs, search, statusFilter, docTypeFilter, dateFrom, dateTo])

  const totalPages = Math.max(1, Math.ceil(filteredDocs.length / pageSize))
  const paginatedDocs = filteredDocs.slice((page - 1) * pageSize, page * pageSize)

  const pieData = stats?.typeCounts
    ? Object.keys(stats.typeCounts).map(key => ({ name: key, value: stats.typeCounts[key] }))
    : []

  const uniqueDocTypes = useMemo(() => {
    const types = new Set()
    allDocs.forEach((d) => types.add(getDocType(d)))
    return [...types].sort()
  }, [allDocs])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#f1f5f9] flex items-center gap-2">
            <Sparkles className="text-[#6366f1]" size={24} /> Dashboard Overview
          </h2>
          <p className="text-[#64748b] text-sm mt-1">
            Monitor your document extraction queues, success rates, and type distributions.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-5 hover:border-[#6366f1]/50 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#6366f1]/10 to-transparent rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#94a3b8]">Total Processed</span>
            <div className="p-2 bg-[#6366f1]/10 text-[#6366f1] rounded-lg">
              <Layers size={18} />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-[#f1f5f9] mt-4">
            {statsLoading ? '...' : stats?.totalDocs || 0}
          </p>
        </div>

        <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-5 hover:border-[#22c55e]/50 transition-all duration-300 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#22c55e]/10 to-transparent rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#94a3b8]">Completed</span>
            <div className="p-2 bg-[#22c55e]/10 text-[#22c55e] rounded-lg">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-[#22c55e] mt-4">
            {statsLoading ? '...' : stats?.statusCounts?.completed || 0}
          </p>
        </div>

        <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-5 hover:border-[#f59e0b]/50 transition-all duration-300 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#f59e0b]/10 to-transparent rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#94a3b8]">In Progress</span>
            <div className="p-2 bg-[#f59e0b]/10 text-[#f59e0b] rounded-lg">
              <RefreshCw className="animate-spin" size={18} />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-[#f59e0b] mt-4">
            {statsLoading ? '...' : (stats?.statusCounts?.processing || 0) + (stats?.statusCounts?.queued || 0)}
          </p>
        </div>

        <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-5 hover:border-[#0ea5e9]/50 transition-all duration-300 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#0ea5e9]/10 to-transparent rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#94a3b8]">Avg. Confidence</span>
            <div className="p-2 bg-[#0ea5e9]/10 text-[#0ea5e9] rounded-lg">
              <Award size={18} />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-[#0ea5e9] mt-4">
            {statsLoading ? '...' : `${stats?.averageConfidence || 0}%`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[#f1f5f9] flex items-center gap-2">
              <TrendingUp size={16} className="text-[#6366f1]" /> Processing Volume (Last 7 Days)
            </h3>
          </div>
          <div className="h-64">
            {statsLoading ? (
              <div className="h-full flex items-center justify-center text-[#64748b]">Loading trends...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.volumeOverTime || []}>
                  <defs>
                    <linearGradient id="colorUploads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                    labelStyle={{ color: '#94a3b8' }}
                  />
                  <Area type="monotone" dataKey="uploads" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorUploads)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[#f1f5f9] flex items-center gap-2 mb-4">
            <BarChart3 size={16} className="text-[#0ea5e9]" /> Document Types
          </h3>
          <div className="h-64 flex flex-col justify-center">
            {statsLoading ? (
              <div className="text-center text-[#64748b]">Loading distribution...</div>
            ) : pieData.length === 0 ? (
              <div className="text-center text-[#64748b] text-xs">No classification data recorded</div>
            ) : (
              <div className="relative h-full w-full">
                <ResponsiveContainer width="100%" height="90%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-[11px] text-[#cbd5e1]">
                  {pieData.map((item, index) => (
                    <span key={item.name} className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      {item.name} ({item.value})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div>
              <h3 className="text-base font-semibold text-[#f1f5f9]">
                {viewAll ? 'All Documents' : 'Recent Extractions'}
              </h3>
              <p className="text-xs text-[#64748b]">
                {viewAll
                  ? `${filteredDocs.length} document${filteredDocs.length !== 1 ? 's' : ''} found`
                  : 'Monitor queue states, verify details, or navigate to full previews'}
              </p>
            </div>
            <button
              onClick={() => { setViewAll(!viewAll); setPage(1) }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                viewAll
                  ? 'bg-[#6366f1]/10 text-[#6366f1] border-[#6366f1]/30'
                  : 'bg-[#1e293b] text-[#94a3b8] border-[#1e293b] hover:border-[#6366f1]/50 hover:text-[#f1f5f9]'
              }`}
            >
              <ListOrdered size={14} />
              {viewAll ? 'Show Recent' : 'View All'}
            </button>
          </div>

          <div className="relative w-full md:w-56">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]" />
            <input
              type="text"
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-[#0b0f19] border border-[#1e293b] rounded-lg text-[#f1f5f9] text-xs placeholder-[#64748b] focus:outline-none focus:border-[#6366f1]"
            />
          </div>
        </div>

        {viewAll && (
          <div className="flex flex-wrap items-center gap-2 p-3 bg-[#0b0f19] border border-[#1e293b] rounded-lg">
            <Filter size={14} className="text-[#64748b]" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#0f172a] border border-[#1e293b] rounded-lg text-[#f1f5f9] text-xs px-2 py-1.5 focus:outline-none focus:border-[#6366f1]"
            >
              <option value="">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="processing">Processing</option>
              <option value="failed">Failed</option>
              <option value="queued">Queued</option>
            </select>
            <select
              value={docTypeFilter}
              onChange={(e) => setDocTypeFilter(e.target.value)}
              className="bg-[#0f172a] border border-[#1e293b] rounded-lg text-[#f1f5f9] text-xs px-2 py-1.5 focus:outline-none focus:border-[#6366f1]"
            >
              <option value="">All Types</option>
              {uniqueDocTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <div className="flex items-center gap-1 text-[#64748b]">
              <CalendarDays size={13} />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="bg-[#0f172a] border border-[#1e293b] rounded-lg text-[#f1f5f9] text-xs px-2 py-1.5 w-32 focus:outline-none focus:border-[#6366f1]"
                title="From date"
              />
              <span className="text-[#64748b]">—</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="bg-[#0f172a] border border-[#1e293b] rounded-lg text-[#f1f5f9] text-xs px-2 py-1.5 w-32 focus:outline-none focus:border-[#6366f1]"
                title="To date"
              />
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-2 py-1.5 text-xs text-[#ef4444] hover:bg-[#ef4444]/10 rounded-lg transition-colors"
              >
                <X size={13} /> Clear
              </button>
            )}
          </div>
        )}

        {error && (
          <div className="p-3 bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-lg text-[#ef4444] text-xs">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#1e293b] text-xs text-[#64748b]">
                <th className="pb-3 font-medium">Document Name</th>
                <th className="pb-3 font-medium">Doc Type</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Extracted Name</th>
                <th className="pb-3 font-medium">{viewAll ? 'Uploaded' : 'Timestamp'}</th>
                <th className="pb-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {docsLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8">
                    <RefreshCw className="animate-spin text-[#6366f1] mx-auto" size={20} />
                  </td>
                </tr>
              ) : paginatedDocs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-xs text-[#64748b]">
                    {hasActiveFilters
                      ? 'No documents match the current filters.'
                      : 'No documents uploaded yet. Upload your first document to get started.'}
                  </td>
                </tr>
              ) : (
                paginatedDocs.map((doc) => (
                  <tr key={doc._id} className="border-b border-[#1e293b] text-xs hover:bg-[#1e293b]/20 transition-colors">
                    <td className="py-3 font-medium text-[#f1f5f9] max-w-[150px] truncate">
                      {doc.original_name}
                    </td>
                    <td className="py-3 text-[#cbd5e1]">{getDocType(doc)}</td>
                    <td className="py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusColors[doc.status] || statusColors.processing}`}>
                        <span className={`w-1 h-1 rounded-full ${doc.status === 'processing' ? 'animate-pulse bg-[#f59e0b]' : doc.status === 'completed' ? 'bg-[#22c55e]' : doc.status === 'queued' ? 'bg-[#6366f1]' : 'bg-[#ef4444]'}`} />
                        {doc.status}
                      </span>
                    </td>
                    <td className="py-3 text-[#cbd5e1]">{doc.extracted_data?.name || '—'}</td>
                    <td className="py-3 text-[#64748b]">{formatDate(doc.created_at)}</td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate(`/extraction/${doc._id}`)}
                          className="p-1.5 hover:bg-[#1e293b] rounded-md text-[#64748b] hover:text-[#6366f1]"
                          title="View Extraction"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(doc._id)}
                          disabled={deleting === doc._id}
                          className="p-1.5 hover:bg-[#1e293b] rounded-md text-[#64748b] hover:text-[#ef4444]"
                        >
                          <Trash2 size={14} />
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
          <div className="flex items-center justify-between pt-2">
            <span className="text-[10px] text-[#64748b]">Page {page} of {totalPages} ({filteredDocs.length} total)</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1 border border-[#1e293b] rounded-md text-[#64748b] disabled:opacity-50 hover:bg-[#1e293b]"
              >
                <ChevronLeft size={12} />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1 border border-[#1e293b] rounded-md text-[#64748b] disabled:opacity-50 hover:bg-[#1e293b]"
              >
                <ChevronRight size={12} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
