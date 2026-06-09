import { useEffect, useState } from 'react'
import { UserCircle2, Camera, Save, LogOut, Mail, Edit3 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { updateProfile } from '../services/api'

export default function AccountPage() {
  const { user, logout, updateUser } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (user) {
      setName(user.name || '')
      setEmail(user.email || '')
      setAvatarUrl(user.avatarUrl || '')
    }
  }, [user])

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setMessage('Please select an image smaller than 5MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setAvatarUrl(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage('')
    try {
      const payload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        avatar_url: avatarUrl,
      }
      const res = await updateProfile(payload)
      const updatedUser = {
        ...res.data.user,
        avatarUrl: res.data.user.avatar_url || res.data.user.avatarUrl,
      }
      updateUser(updatedUser)
      if (res.data.token) {
        localStorage.setItem('token', res.data.token)
      }
      setMessage('Profile updated successfully.')
    } catch (err) {
      const message = err?.response?.data?.detail || err.message || 'Unable to save profile changes. Please try again.'
      setMessage(message)
    } finally {
      setSaving(false)
    }
  }

  if (!user) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-[#e2e8f0]">
        <p className="text-sm text-[#64748b]">Loading account information...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-[#0f172a]">Account</h2>
        </div>
        <button
          onClick={logout}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#ef4444] text-white text-sm font-medium hover:bg-[#dc2626] transition-colors"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="bg-[#ffffff] border border-[#e2e8f0] rounded-3xl p-6 text-center">
          <div className="mx-auto mb-5 h-28 w-28 rounded-full overflow-hidden bg-[#eef2ff] flex items-center justify-center text-[#6366f1]">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              <UserCircle2 size={72} />
            )}
          </div>
          <label className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#dbeafe] text-[#0f172a] text-sm font-medium cursor-pointer hover:bg-[#eef2ff] transition-colors">
            <Camera size={16} />
            Update photo
            <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
          </label>
        </div>

        <div className="bg-[#ffffff] border border-[#e2e8f0] rounded-3xl p-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-[#64748b]">Name</label>
              <div className="relative">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3 text-sm text-[#0f172a] focus:border-[#6366f1] focus:outline-none"
                />
                <Edit3 size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748b]" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-[#64748b]">Email</label>
              <div className="relative">
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3 text-sm text-[#0f172a] focus:border-[#6366f1] focus:outline-none"
                />
                <Mail size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748b]" />
              </div>
            </div>
          </div>

            {message && (
            <div className="rounded-2xl border border-[#c7d2fe] bg-[#eff6ff] px-4 py-3 text-sm text-[#1e293b]">
              {message}
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#6366f1] px-5 py-3 text-sm font-semibold text-white hover:bg-[#4f46e5] transition-colors disabled:opacity-60"
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
