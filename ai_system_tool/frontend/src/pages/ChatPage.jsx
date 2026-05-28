import { useState, useEffect, useRef } from 'react'
import { Bot, User, Send, Loader2, Sparkles, FileText, AlertCircle } from 'lucide-react'
import { listDocuments, askQuestion } from '../services/api'

const suggestions = [
  'What is my name?',
  'Show me the date of birth',
  'What is the document number?',
  'Summarize this document',
]

export default function ChatPage() {
  const [docs, setDocs] = useState([])
  const [selectedDoc, setSelectedDoc] = useState('')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetchingDocs, setFetchingDocs] = useState(true)
  const [visible, setVisible] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => { setVisible(true) }, [])

  useEffect(() => {
    listDocuments(1, 50)
      .then((res) => {
        setDocs(res.data.documents || [])
        if (res.data.documents?.length > 0) {
          setSelectedDoc(res.data.documents[0]._id)
        }
      })
      .catch(() => {})
      .finally(() => setFetchingDocs(false))
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (selectedDoc && messages.length === 0) {
      setMessages([{
        role: 'bot',
        text: `👋 Hi! I can answer questions about your document. Try asking:\n${suggestions.map((s) => `• "${s}"`).join('\n')}`,
      }])
    }
  }, [selectedDoc])

  const handleSend = async () => {
    const q = input.trim()
    if (!q || !selectedDoc || loading) return
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', text: q }])
    setLoading(true)
    try {
      const res = await askQuestion(selectedDoc, q)
      setMessages((prev) => [...prev, { role: 'bot', text: res.data.answer }])
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'bot', text: `Error: ${err.message}` }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const selectedDocData = docs.find((d) => d._id === selectedDoc)

  return (
    <div className={`h-full flex flex-col transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <FileText size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748b] pointer-events-none" />
          <select
            value={selectedDoc}
            onChange={(e) => {
              setSelectedDoc(e.target.value)
              setMessages([])
            }}
            disabled={fetchingDocs}
            className="w-full pl-10 pr-4 py-2.5 bg-[#1e293b] border border-[#334155] rounded-xl text-[#f1f5f9] text-sm appearance-none cursor-pointer focus:outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1]/40 transition-all disabled:opacity-50"
          >
            {fetchingDocs ? (
              <option value="">Loading documents...</option>
            ) : docs.length === 0 ? (
              <option value="">No documents yet</option>
            ) : (
              docs.map((doc) => (
                <option key={doc._id} value={doc._id}>
                  {doc.original_name || doc._id}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {docs.length === 0 && !fetchingDocs ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <FileText size={48} className="text-[#334155] mx-auto mb-4" />
            <p className="text-[#64748b] text-sm">Upload a document first to start asking questions.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 scroll-smooth">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-3 max-w-[85%] md:max-w-[70%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-[#6366f1] to-[#0ea5e9]'
                      : 'bg-[#1e293b] border border-[#334155]'
                  }`}>
                    {msg.role === 'user' ? (
                      <User size={16} className="text-white" />
                    ) : (
                      <Bot size={16} className="text-[#94a3b8]" />
                    )}
                  </div>
                  <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-[#6366f1] to-[#0ea5e9] text-white'
                      : 'bg-[#0f172a] border border-[#1e293b] text-[#cbd5e1]'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="flex gap-3 max-w-[85%] md:max-w-[70%]">
                  <div className="w-8 h-8 rounded-full bg-[#1e293b] border border-[#334155] flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot size={16} className="text-[#94a3b8]" />
                  </div>
                  <div className="rounded-2xl px-4 py-3 bg-[#0f172a] border border-[#1e293b]">
                    <div className="flex gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#6366f1] animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 rounded-full bg-[#6366f1] animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 rounded-full bg-[#6366f1] animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {selectedDoc && messages.length === 1 && (
            <div className="flex flex-wrap gap-2 mt-3 mb-3">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setInput(s)
                  }}
                  className="px-3 py-1.5 bg-[#1e293b] border border-[#334155] rounded-lg text-xs text-[#94a3b8] hover:text-[#cbd5e1] hover:border-[#6366f1]/40 transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-2 pt-3 border-t border-[#1e293b] mt-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about your document..."
              disabled={loading || !selectedDoc}
              className="flex-1 px-4 py-2.5 bg-[#1e293b] border border-[#334155] rounded-xl text-[#f1f5f9] text-sm placeholder:text-[#475569] focus:outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1]/40 transition-all disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim() || !selectedDoc}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#0ea5e9] text-white hover:shadow-lg hover:shadow-[#6366f1]/30 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
