import { ChevronRight, Home } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Breadcrumb({ items }) {
  return (
    <nav className="flex items-center gap-1.5 text-xs text-[#64748b] mb-4">
      <Link to="/dashboard" className="hover:text-[#6366f1] transition-colors flex items-center gap-1">
        <Home size={13} />
        <span className="hidden sm:inline">Home</span>
      </Link>
      {items?.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <ChevronRight size={12} className="text-[#94a3b8]" />
          {item.href ? (
            <Link to={item.href} className="hover:text-[#6366f1] transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-[#334155] font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}