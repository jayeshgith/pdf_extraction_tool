import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Upload, FileText, Database, Menu, X, Sparkles, ChevronLeft,
} from 'lucide-react'

const navItems = [
  { path: '/upload', label: 'Upload', icon: Upload },
  { path: '/documents', label: 'Documents', icon: FileText },
]

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const location = useLocation()

  return (
    <div className="flex h-screen overflow-hidden bg-[#020617]">
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-16'
        } transition-all duration-300 flex-shrink-0 bg-[#0f172a] border-r border-[#1e293b] flex flex-col`}
      >
        <div className="flex items-center gap-3 px-4 h-16 border-b border-[#1e293b] flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6366f1] to-[#0ea5e9] flex items-center justify-center flex-shrink-0">
            <Sparkles size={16} className="text-white" />
          </div>
          {sidebarOpen && (
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
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  active
                    ? 'bg-[#6366f1]/10 text-[#6366f1]'
                    : 'text-[#94a3b8] hover:bg-[#1e293b] hover:text-[#cbd5e1]'
                }`}
              >
                <Icon size={20} className="flex-shrink-0" />
                {sidebarOpen && <span className="font-medium text-sm">{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="flex items-center gap-3 px-4 py-3 border-t border-[#1e293b] text-[#64748b] hover:text-[#94a3b8] transition-colors"
        >
          <ChevronLeft
            size={18}
            className={`transition-transform ${!sidebarOpen ? 'rotate-180' : ''}`}
          />
          {sidebarOpen && <span className="text-xs">Collapse</span>}
        </button>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-[#1e293b] bg-[#0f172a]/80 backdrop-blur-sm flex items-center justify-between px-6 flex-shrink-0">
          <div>
            <h1 className="text-[#f1f5f9] font-semibold text-lg">
              {navItems.find((i) => i.path === location.pathname)?.label || 'Dashboard'}
            </h1>
            <p className="text-xs text-[#64748b] mt-0.5">
              AI-Powered Document Extraction System
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1e293b] rounded-lg">
              <div className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
              <span className="text-xs text-[#94a3b8]">System Online</span>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
