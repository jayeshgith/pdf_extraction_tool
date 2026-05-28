import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, Mail, Loader2, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { forgotPassword } from '../services/api'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [visible, setVisible] = useState(false)

  useEffect(() => { setVisible(true) }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await forgotPassword(email)
      setSent(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-[#020617] flex items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-[#6366f1]/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[#0ea5e9]/10 blur-[120px]" />
      </div>

      <div className={`w-full max-w-md transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#6366f1] to-[#0ea5e9] shadow-lg shadow-[#6366f1]/25 flex items-center justify-center">
              <Sparkles size={24} className="text-white" />
            </div>
            <span className="font-bold text-2xl text-[#f1f5f9] tracking-tight">DocuVerse</span>
          </div>
          <h2 className="text-xl font-semibold text-[#f1f5f9]">Reset password</h2>
          <p className="text-[#64748b] mt-1.5 text-sm">Enter your email and we'll send you a reset link</p>
        </div>

        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-b from-[#6366f1]/5 to-[#0ea5e9]/5 rounded-2xl blur-sm" />
          {sent ? (
            <div className="relative bg-[#0f172a]/90 backdrop-blur-xl border border-[#1e293b] rounded-2xl p-8 text-center shadow-xl shadow-black/20">
              <div className="w-14 h-14 rounded-full bg-[#22c55e]/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={28} className="text-[#22c55e]" />
              </div>
              <h3 className="text-[#f1f5f9] font-semibold text-lg mb-2">Check your email</h3>
              <p className="text-[#94a3b8] text-sm leading-relaxed">
                If an account exists for <span className="text-[#cbd5e1] font-medium">{email}</span>,
                you'll receive a password reset link shortly.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 mt-6 text-sm text-[#6366f1] hover:text-[#818cf8] font-medium transition-colors"
              >
                <ArrowLeft size={16} />
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="relative bg-[#0f172a]/90 backdrop-blur-xl border border-[#1e293b] rounded-2xl p-6 md:p-8 space-y-5 shadow-xl shadow-black/20">
              <div>
                <label className="block text-sm font-medium text-[#94a3b8] mb-1.5">Email</label>
                <div className="relative group">
                  <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748b] group-focus-within:text-[#6366f1] transition-colors" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full pl-11 pr-4 py-3 bg-[#1e293b] border border-[#334155] rounded-xl text-[#f1f5f9] text-sm placeholder:text-[#475569] focus:outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1]/40 transition-all"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2.5 p-3.5 bg-[#ef4444]/10 border border-[#ef4444]/15 rounded-xl text-[#ef4444] text-sm">
                  <AlertCircle size={16} className="flex-shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email}
                className="relative w-full py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-[#6366f1] to-[#0ea5e9] text-white hover:shadow-lg hover:shadow-[#6366f1]/30 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group"
              >
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
                {loading ? (
                  <><Loader2 size={18} className="animate-spin" /> Sending...</>
                ) : (
                  'Send Reset Link'
                )}
              </button>

              <Link
                to="/login"
                className="flex items-center justify-center gap-2 text-sm text-[#64748b] hover:text-[#94a3b8] transition-colors"
              >
                <ArrowLeft size={16} />
                Back to sign in
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
