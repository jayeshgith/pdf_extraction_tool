import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Upload, FileText, Database, Menu, X, Sparkles, ChevronLeft, LogOut, User, MessageSquare,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const navItems = [
  { path: '/upload', label: 'Upload', icon: Upload },
  { path: '/documents', label: 'Documents', icon: FileText },
  { path: '/chat', label: 'Chat', icon: MessageSquare },
]

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  const sidebarContent = (
    <>
      <div className="flex items-center gap-3 px-4 h-16 border-b border-[#1e293b] flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6366f1] to-[#0ea5e9] flex items-center justify-center flex-shrink-0">
          <Sparkles size={16} className="text-white" />
        </div>
        {(sidebarOpen || mobileOpen) && (
          <span className="font-bold text-lg text-[#f1f5f9] whitespace-nowrap">DocuVerse</span>
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
                  : 'text-[#94a3b8] hover:bg-[#1e293b] hover:text-[#cbd5e1]'
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
        className="hidden md:flex items-center gap-3 px-4 py-3 border-t border-[#1e293b] text-[#64748b] hover:text-[#94a3b8] transition-colors"
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
    <div className="flex h-screen overflow-hidden bg-[#020617]">
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
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
        } transition-all duration-300 flex-shrink-0 bg-[#0f172a] border-r border-[#1e293b] flex flex-col`}
      >
        {sidebarContent}
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-[#1e293b] bg-[#0f172a]/80 backdrop-blur-sm flex items-center justify-between px-4 md:px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 -ml-2 text-[#94a3b8] hover:text-[#f1f5f9]"
            >
              <Menu size={22} />
            </button>
            <div>
              <h1 className="text-[#f1f5f9] font-semibold text-base md:text-lg">
                {navItems.find((i) => i.path === location.pathname)?.label || 'Dashboard'}
              </h1>
              <p className="text-xs text-[#64748b] mt-0.5 hidden md:block">
                AI-Powered Document Extraction System
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1e293b] rounded-lg">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#6366f1] to-[#0ea5e9] flex items-center justify-center text-xs font-bold text-white">
                  {user.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <span className="text-xs text-[#94a3b8] hidden md:inline">{user.name}</span>
              </div>
            )}
            <button
              onClick={logout}
              className="p-2 text-[#94a3b8] hover:text-[#ef4444] transition-colors"
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
