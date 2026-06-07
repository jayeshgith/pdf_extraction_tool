import { useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Upload, Menu, Sparkles, ChevronLeft, LogOut, MessageSquare, Settings, Layers, LayoutGrid,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const allNavItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutGrid, adminOnly: false },
  { path: '/upload', label: 'Upload', icon: Upload, adminOnly: false },
  { path: '/bulk', label: 'Bulk Upload', icon: Layers, adminOnly: false },
  { path: '/chat', label: 'Chat', icon: MessageSquare, adminOnly: false },
  { path: '/admin', label: 'Configs', icon: Settings, adminOnly: false },
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
      <div className="flex items-center gap-3 px-4 h-16 border-b border-[#e2e8f0] flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6366f1] to-[#0ea5e9] flex items-center justify-center flex-shrink-0">
          <Sparkles size={16} className="text-white" />
        </div>
        {(sidebarOpen || mobileOpen) && (
          <span className="font-bold text-lg text-[#0f172a] whitespace-nowrap">DocuVerse</span>
        )}
      </div>

      <nav className="flex-1 py-4 px-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                active
                  ? 'bg-[#6366f1]/10 text-[#6366f1]'
                  : 'text-[#475569] hover:bg-[#f8fafc] hover:text-[#334155]'
              }`}
            >
              <Icon size={20} className="flex-shrink-0" />
              {(sidebarOpen || mobileOpen) && <span className="font-medium text-sm">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      <button
        onClick={() => { setSidebarOpen(!sidebarOpen); setMobileOpen(false) }}
        className="hidden md:flex items-center gap-3 px-4 py-3 border-t border-[#e2e8f0] text-[#64748b] hover:text-[#475569] transition-colors"
      >
        <ChevronLeft
          size={18}
          className={`transition-transform ${!sidebarOpen ? 'rotate-180' : ''}`}
        />
        {sidebarOpen && <span className="text-xs">Collapse</span>}
      </button>
    </>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc]">
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-20 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`${
          mobileOpen
            ? 'fixed inset-y-0 left-0 z-30 w-64'
            : 'hidden md:flex'
        } ${
          sidebarOpen ? 'md:w-64' : 'md:w-16'
        } transition-all duration-300 flex-shrink-0 bg-[#ffffff] border-r border-[#e2e8f0] flex flex-col shadow-sm`}
      >
        {sidebarContent}
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-[#e2e8f0] bg-[#ffffff]/90 backdrop-blur-sm flex items-center justify-between px-4 md:px-6 flex-shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 -ml-2 text-[#475569] hover:text-[#0f172a]"
            >
              <Menu size={22} />
            </button>
            <div>
              <h1 className="text-[#0f172a] font-semibold text-base md:text-lg">
                {navItems.find((i) => i.path === location.pathname)?.label || 'Dashboard'}
              </h1>
              <p className="text-xs text-[#64748b] mt-0.5 hidden md:block">
                AI-Powered Document Extraction System
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#6366f1] to-[#0ea5e9] flex items-center justify-center text-xs font-bold text-white">
                  {user.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <span className="text-xs text-[#475569] hidden md:inline">{user.name}</span>
                {user.role === 'admin' && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#6366f1]/20 text-[#6366f1] font-medium ml-1">admin</span>
                )}
              </div>
            )}
            <button
              onClick={logout}
              className="p-2 text-[#475569] hover:text-[#ef4444] transition-colors"
              title="Sign Out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
