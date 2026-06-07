import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CheckCircle2, RefreshCw, BarChart3,
  Eye, Trash2,
  TrendingUp, Award, Layers, Sparkles, ExternalLink
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
  const [docs, setDocs] = useState([])
  const [docsLoading, setDocsLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(null)

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

  const fetchDocs = async () => {
    setDocsLoading(true)
    setError('')
    try {
      const res = await listDocuments(1, 5)
      setDocs(res.data.documents || res.data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setDocsLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    const loadInitialStats = async () => {
      try {
        const statsRes = await getDashboardStats()
        if (!cancelled) setStats(statsRes.data)
      } catch (err) {
        console.error("Failed to load dashboard metrics", err)
      } finally {
        if (!cancelled) setStatsLoading(false)
      }
    }

    loadInitialStats()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false

    const loadInitialDocs = async () => {
      try {
        const res = await listDocuments(1, 5)
        if (!cancelled) setDocs(res.data.documents || res.data || [])
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setDocsLoading(false)
      }
    }

    loadInitialDocs()
    return () => { cancelled = true }
  }, [])

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return
    setDeleting(id)
    try {
      await deleteDocument(id)
      setDocs((prev) => prev.filter((d) => d._id !== id))
      loadDashboardData()
    } catch (err) {
      setError(err.message)
    } finally {
      setDeleting(null)
    }
  }

  const getDocType = (doc) => {
    return doc.extracted_data?.document_type || 'Unclassified'
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric',
      timeZone: 'Asia/Kolkata',
    })
  }

  const pieData = stats?.typeCounts
    ? Object.keys(stats.typeCounts).map(key => ({ name: key, value: stats.typeCounts[key] }))
    : []

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#0f172a] flex items-center gap-2">
          <Sparkles className="text-[#6366f1]" size={24} /> Dashboard Overview
        </h2>
        <p className="text-[#64748b] text-sm mt-1">
          Monitor your document extraction queues, success rates, and type distributions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#ffffff] border border-[#e2e8f0] rounded-xl p-5 hover:border-[#6366f1]/50 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#6366f1]/10 to-transparent rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#475569]">Total Processed</span>
            <div className="p-2 bg-[#6366f1]/10 text-[#6366f1] rounded-lg">
              <Layers size={18} />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-[#0f172a] mt-4">
            {statsLoading ? '...' : stats?.totalDocs || 0}
          </p>
        </div>

        <div className="bg-[#ffffff] border border-[#e2e8f0] rounded-xl p-5 hover:border-[#22c55e]/50 transition-all duration-300 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#22c55e]/10 to-transparent rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#475569]">Completed</span>
            <div className="p-2 bg-[#22c55e]/10 text-[#22c55e] rounded-lg">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-[#22c55e] mt-4">
            {statsLoading ? '...' : stats?.statusCounts?.completed || 0}
          </p>
        </div>

        <div className="bg-[#ffffff] border border-[#e2e8f0] rounded-xl p-5 hover:border-[#f59e0b]/50 transition-all duration-300 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#f59e0b]/10 to-transparent rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#475569]">In Progress</span>
            <div className="p-2 bg-[#f59e0b]/10 text-[#f59e0b] rounded-lg">
              <RefreshCw className="animate-spin" size={18} />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-[#f59e0b] mt-4">
            {statsLoading ? '...' : (stats?.statusCounts?.processing || 0) + (stats?.statusCounts?.queued || 0)}
          </p>
        </div>

        <div className="bg-[#ffffff] border border-[#e2e8f0] rounded-xl p-5 hover:border-[#0ea5e9]/50 transition-all duration-300 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#0ea5e9]/10 to-transparent rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#475569]">Avg. Confidence</span>
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
        <div className="bg-[#ffffff] border border-[#e2e8f0] rounded-xl p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[#0f172a] flex items-center gap-2">
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
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px' }}
                    labelStyle={{ color: '#475569' }}
                  />
                  <Area type="monotone" dataKey="uploads" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorUploads)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-[#ffffff] border border-[#e2e8f0] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[#0f172a] flex items-center gap-2 mb-4">
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
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-[11px] text-[#334155]">
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

      <div className="bg-[#ffffff] border border-[#e2e8f0] rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-[#0f172a]">Recent Extractions</h3>
            <p className="text-xs text-[#64748b]">Monitor queue states, verify details, or navigate to full previews</p>
          </div>
          <button
            onClick={() => navigate('/documents')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#6366f1]/10 text-[#6366f1] border border-[#6366f1]/30 hover:bg-[#6366f1]/20 transition-all"
          >
            <ExternalLink size={14} />
            View All
          </button>
        </div>

        {error && (
          <div className="p-3 bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-lg text-[#ef4444] text-xs">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#e2e8f0] text-xs text-[#64748b]">
                <th className="pb-3 font-medium">Document Name</th>
                <th className="pb-3 font-medium">Doc Type</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Extracted Name</th>
                <th className="pb-3 font-medium">Timestamp</th>
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
              ) : docs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-xs text-[#64748b]">
                    No documents uploaded yet. Upload your first document to get started.
                  </td>
                </tr>
              ) : (
                docs.map((doc) => (
                  <tr key={doc._id} className="border-b border-[#e2e8f0] text-xs hover:bg-[#f1f5f9]/20 transition-colors">
                    <td className="py-3 font-medium text-[#0f172a] max-w-[150px] truncate">
                      {doc.original_name}
                    </td>
                    <td className="py-3 text-[#334155]">{getDocType(doc)}</td>
                    <td className="py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusColors[doc.status] || statusColors.processing}`}>
                        <span className={`w-1 h-1 rounded-full ${doc.status === 'processing' ? 'animate-pulse bg-[#f59e0b]' : doc.status === 'completed' ? 'bg-[#22c55e]' : doc.status === 'queued' ? 'bg-[#6366f1]' : 'bg-[#ef4444]'}`} />
                        {doc.status}
                      </span>
                    </td>
                    <td className="py-3 text-[#334155]">{doc.extracted_data?.name || '-'}</td>
                    <td className="py-3 text-[#64748b]">{formatDate(doc.created_at)}</td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate(`/extraction/${doc._id}`)}
                          className="p-1.5 hover:bg-[#f1f5f9] rounded-md text-[#64748b] hover:text-[#6366f1]"
                          title="View Extraction"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(doc._id)}
                          disabled={deleting === doc._id}
                          className="p-1.5 hover:bg-[#f1f5f9] rounded-md text-[#64748b] hover:text-[#ef4444]"
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
      </div>
    </div>
  )
}
