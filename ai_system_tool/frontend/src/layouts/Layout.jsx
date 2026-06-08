import { useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Upload, Menu, Sparkles, ChevronLeft, MessageSquare, Settings, Layers, LayoutGrid, UserCircle2,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const allNavItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutGrid, adminOnly: false },
  { path: '/upload', label: 'Upload', icon: Upload, adminOnly: false },
  { path: '/bulk', label: 'Bulk Upload', icon: Layers, adminOnly: false },
  { path: '/account', label: 'Account', icon: UserCircle2, adminOnly: false },
  { path: '/chat', label: 'Chat', icon: MessageSquare, adminOnly: false },
  { path: '/admin', label: 'Configs', icon: Settings, adminOnly: true },
]

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  const navItems = useMemo(() => {
    const role = user?.role || 'user'
    return allNavItems.filter((item) => !item.adminOnly || role === 'admin')
  }, [user])

  const sidebarContent = (
    <>
      <div className="flex items-center gap-3 px-5 h-16 border-b border-[#2d2d4a] flex-shrink-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#818cf8] to-[#38bdf8] flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#818cf8]/20">
          <Sparkles size={18} className="text-white" />
        </div>
        {(sidebarOpen || mobileOpen) && (
          <span className="font-bold text-lg text-[#f1f5f9] whitespace-nowrap tracking-tight">DocuVerse</span>
        )}
      </div>

      <nav className="flex-1 py-5 px-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                active
                  ? 'bg-gradient-to-r from-[#818cf8]/15 to-[#818cf8]/5 text-[#818cf8] shadow-sm shadow-[#818cf8]/5'
                  : 'text-[#64748b] hover:bg-[#1a1a2e] hover:text-[#cbd5e1]'
              }`}
            >
              <Icon size={20} className="flex-shrink-0" />
              {(sidebarOpen || mobileOpen) && <span className="font-medium text-sm tracking-wide">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 pb-3">
        <button
          onClick={() => { setSidebarOpen(!sidebarOpen); setMobileOpen(false) }}
          className="hidden md:flex w-full items-center justify-center gap-3 px-3 py-2.5 rounded-xl border border-[#2d2d4a] text-[#64748b] hover:text-[#cbd5e1] hover:bg-[#1a1a2e] transition-all duration-200"
        >
          <ChevronLeft
            size={16}
            className={`transition-transform duration-200 ${!sidebarOpen ? 'rotate-180' : ''}`}
          />
          {sidebarOpen && <span className="text-xs font-medium">Collapse</span>}
        </button>
      </div>
    </>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc]">
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`${
          mobileOpen
            ? 'fixed inset-y-0 left-0 z-30 w-64'
            : 'hidden md:flex'
        } ${
          sidebarOpen ? 'md:w-64' : 'md:w-[72px]'
        } transition-all duration-300 ease-in-out flex-shrink-0 bg-[#0f0f1a] border-r border-[#2d2d4a] flex flex-col`}
      >
        {sidebarContent}
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-[#2d2d4a] bg-[#0f0f1a]/80 backdrop-blur-xl flex items-center justify-between px-4 md:px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 -ml-2 text-[#64748b] hover:text-[#f1f5f9] transition-colors"
            >
              <Menu size={22} />
            </button>
            <div>
              <h1 className="text-[#f1f5f9] font-semibold text-base md:text-lg tracking-tight">
                {navItems.find((i) => i.path === location.pathname)?.label || 'Dashboard'}
              </h1>
              <p className="text-xs text-[#64748b] mt-0.5 hidden md:block">
                AI-Powered Document Extraction System
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {user && (
            <Link
              to="/account"
              className="flex items-center gap-2.5 px-3 py-1.5 bg-[#1a1a2e] border border-[#2d2d4a] rounded-xl hover:border-[#6366f1]/40 transition-all duration-200"
            >
              <div className="w-7 h-7 rounded-full overflow-hidden bg-gradient-to-br from-[#818cf8] to-[#38bdf8] flex items-center justify-center text-xs font-bold text-white shadow-sm flex-shrink-0">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  user.name?.charAt(0)?.toUpperCase() || '?'
                )}
              </div>
              <span className="text-xs text-[#cbd5e1] font-medium hidden md:inline truncate max-w-[100px]">{user.name}</span>
              {user.role === 'admin' && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#818cf8]/20 text-[#818cf8] font-semibold ml-0.5">admin</span>
              )}
            </Link>
          )}
          </div>
        </header>
        <div className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
