import { useState, useEffect } from 'react'
import { Plus, Trash2, Save, AlertCircle, Loader2, X } from 'lucide-react'
import api from '../services/api'

const EMPTY_FIELD = { key: '', description: '', regex_pattern: '', is_required: true }

export default function AdminConfigsPage() {
  const [configs, setConfigs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    document_type: '',
    display_name: '',
    confidence_threshold: 0.78,
    fields: [{ ...EMPTY_FIELD }],
  })

  const fetchConfigs = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/admin/document-configs')
      setConfigs(res.data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchConfigs() }, [])

  const resetForm = () => {
    setForm({ document_type: '', display_name: '', confidence_threshold: 0.78, fields: [{ ...EMPTY_FIELD }] })
    setEditing(null)
  }

  const startEdit = (cfg) => {
    setForm({
      document_type: cfg.document_type,
      display_name: cfg.display_name,
      confidence_threshold: cfg.confidence_threshold ?? 0.78,
      fields: cfg.fields.length ? cfg.fields.map(f => ({
        key: f.key || '',
        description: f.description || '',
        regex_pattern: f.regex_pattern || '',
        is_required: f.is_required !== false,
      })) : [{ ...EMPTY_FIELD }],
    })
    setEditing(cfg.document_type)
    setError('')
    setSuccess('')
  }

  const addField = () => {
    setForm(prev => ({ ...prev, fields: [...prev.fields, { ...EMPTY_FIELD }] }))
  }

  const removeField = (idx) => {
    setForm(prev => ({ ...prev, fields: prev.fields.filter((_, i) => i !== idx) }))
  }

  const updateField = (idx, key, value) => {
    setForm(prev => {
      const fields = [...prev.fields]
      fields[idx] = { ...fields[idx], [key]: value }
      return { ...prev, fields }
    })
  }

  const handleSave = async () => {
    if (!form.document_type.trim() || !form.display_name.trim()) {
      setError('Document type and display name are required')
      return
    }
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const payload = {
        document_type: form.document_type,
        display_name: form.display_name,
        confidence_threshold: form.confidence_threshold,
        tenant_id: 'default',
        fields: form.fields.filter(f => f.key.trim()).map(f => ({
          key: f.key.trim(),
          description: f.description.trim(),
          regex_pattern: f.regex_pattern.trim() || null,
          is_required: f.is_required,
        })),
      }
      if (editing) {
        await api.put(`/admin/document-configs/${editing}`, payload)
        setSuccess(`Updated "${form.display_name}" config`)
      } else {
        await api.post('/admin/document-configs', payload)
        setSuccess(`Created "${form.display_name}" config`)
      }
      resetForm()
      fetchConfigs()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (docType) => {
    if (!confirm(`Delete configuration for "${docType}"?`)) return
    try {
      await api.delete(`/admin/document-configs/${docType}`)
      setSuccess(`Deleted "${docType}" config`)
      fetchConfigs()
    } catch (err) {
      setError(err.message)
    }
  }

  const selected = editing ? configs.find(c => c.document_type === editing) : null

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-[#f1f5f9]">Document Configs</h2>
        <p className="text-[#64748b] text-sm mt-1">
          Manage document types, fields, and extraction rules
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-xl text-[#ef4444] text-sm">
          <AlertCircle size={18} />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 p-4 bg-[#22c55e]/10 border border-[#22c55e]/20 rounded-xl text-[#22c55e] text-sm">
          <Save size={18} />
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-2">
          <h3 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider mb-3">Document Types</h3>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 size={24} className="animate-spin text-[#6366f1]" />
            </div>
          ) : configs.length === 0 ? (
            <p className="text-[#64748b] text-sm">No configs yet. Create one.</p>
          ) : (
            <div className="space-y-1">
              {configs.map((cfg) => (
                <button
                  key={cfg.document_type}
                  onClick={() => startEdit(cfg)}
                  className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-all ${
                    editing === cfg.document_type
                      ? 'bg-[#6366f1]/10 text-[#6366f1] border border-[#6366f1]/30'
                      : 'bg-[#0f172a] text-[#cbd5e1] border border-[#1e293b] hover:border-[#6366f1]/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{cfg.display_name}</span>
                      <span className="text-[#64748b] ml-2 text-xs">({cfg.document_type})</span>
                    </div>
                    <span className="text-xs text-[#64748b]">{cfg.fields?.length || 0} fields</span>
                  </div>
                </button>
              ))}
              <button
                onClick={resetForm}
                className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-all border border-dashed ${
                  !editing
                    ? 'bg-[#6366f1]/10 text-[#6366f1] border-[#6366f1]/30'
                    : 'bg-[#0f172a] text-[#94a3b8] border-[#1e293b] hover:border-[#6366f1]/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Plus size={16} />
                  <span className="font-medium">New Document Type</span>
                </div>
              </button>
            </div>
          )}
        </div>

        <div className="lg:col-span-3 space-y-4">
          <h3 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider mb-3">
            {editing ? `Edit: ${editing}` : 'New Configuration'}
          </h3>

          <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#94a3b8] mb-1">Document Type (slug)</label>
                <input
                  type="text"
                  value={form.document_type}
                  onChange={e => setForm(prev => ({ ...prev, document_type: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') }))}
                  placeholder="e.g. passport"
                  className="w-full px-3 py-2 bg-[#1e293b] border border-[#334155] rounded-lg text-[#f1f5f9] text-sm placeholder-[#475569] focus:outline-none focus:border-[#6366f1]"
                  disabled={!!editing}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#94a3b8] mb-1">Display Name</label>
                <input
                  type="text"
                  value={form.display_name}
                  onChange={e => setForm(prev => ({ ...prev, display_name: e.target.value }))}
                  placeholder="e.g. Passport"
                  className="w-full px-3 py-2 bg-[#1e293b] border border-[#334155] rounded-lg text-[#f1f5f9] text-sm placeholder-[#475569] focus:outline-none focus:border-[#6366f1]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#94a3b8] mb-1">Confidence Threshold</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={form.confidence_threshold}
                onChange={e => setForm(prev => ({ ...prev, confidence_threshold: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 bg-[#1e293b] border border-[#334155] rounded-lg text-[#f1f5f9] text-sm focus:outline-none focus:border-[#6366f1]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-[#94a3b8]">Fields</label>
                <button
                  onClick={addField}
                  className="flex items-center gap-1 text-xs text-[#6366f1] hover:text-[#818cf8] transition-colors"
                >
                  <Plus size={14} />
                  Add Field
                </button>
              </div>

              {form.fields.length === 0 && (
                <p className="text-[#64748b] text-xs">No fields defined. Click "Add Field".</p>
              )}

              <div className="space-y-2">
                {form.fields.map((field, idx) => (
                  <div key={idx} className="bg-[#1e293b] rounded-lg p-3 border border-[#334155]">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs font-medium text-[#64748b]">Field {idx + 1}</span>
                      <button
                        onClick={() => removeField(idx)}
                        className="p-1 text-[#64748b] hover:text-[#ef4444] transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div>
                        <label className="block text-[10px] text-[#64748b] mb-0.5">Key</label>
                        <input
                          type="text"
                          value={field.key}
                          onChange={e => updateField(idx, 'key', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                          placeholder="e.g. passport_number"
                          className="w-full px-2 py-1.5 bg-[#0f172a] border border-[#334155] rounded text-[#f1f5f9] text-xs placeholder-[#475569] focus:outline-none focus:border-[#6366f1]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-[#64748b] mb-0.5">Description</label>
                        <input
                          type="text"
                          value={field.description}
                          onChange={e => updateField(idx, 'description', e.target.value)}
                          placeholder="e.g. Passport number"
                          className="w-full px-2 py-1.5 bg-[#0f172a] border border-[#334155] rounded text-[#f1f5f9] text-xs placeholder-[#475569] focus:outline-none focus:border-[#6366f1]"
                        />
                      </div>
                    </div>
                    <div className="mb-2">
                      <label className="block text-[10px] text-[#64748b] mb-0.5">Regex Pattern (optional)</label>
                      <input
                        type="text"
                        value={field.regex_pattern}
                        onChange={e => updateField(idx, 'regex_pattern', e.target.value)}
                        placeholder="e.g. (?:passport\s*(?:no|number)..."
                        className="w-full px-2 py-1.5 bg-[#0f172a] border border-[#334155] rounded text-[#f1f5f9] text-xs font-mono placeholder-[#475569] focus:outline-none focus:border-[#6366f1]"
                      />
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={field.is_required}
                        onChange={e => updateField(idx, 'is_required', e.target.checked)}
                        className="rounded border-[#334155] bg-[#0f172a] text-[#6366f1] focus:ring-[#6366f1]"
                      />
                      <span className="text-xs text-[#94a3b8]">Required field</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-2.5 px-4 rounded-lg font-medium text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-[#6366f1] to-[#0ea5e9] text-white hover:shadow-lg hover:shadow-[#6366f1]/25 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {saving ? (
                <><Loader2 size={16} className="animate-spin" /> Saving...</>
              ) : (
                <><Save size={16} /> {editing ? 'Update Configuration' : 'Create Configuration'}</>
              )}
            </button>

            {editing && (
              <button
                onClick={() => handleDelete(editing)}
                className="w-full py-2 px-4 rounded-lg font-medium text-sm flex items-center justify-center gap-2 bg-[#ef4444]/10 border border-[#ef4444]/20 text-[#ef4444] hover:bg-[#ef4444]/20 transition-all"
              >
                <Trash2 size={16} />
                Delete Configuration
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
