import { useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'
import { useGlobalSearch } from '../features/search/useGlobalSearch'
import SearchResults from '../features/search/SearchResults'

export default function GlobalSearchModal({ open, onClose }) {
  const { query, setQuery, results, loading, hasQuery } = useGlobalSearch()
  const inputRef = useRef(null)

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-16 sm:pt-24 px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border">
          <Search size={17} className="text-muted shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks, notes, goals, transactions, splitwise…"
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted/60"
          />
          <button onClick={onClose} className="text-muted hover:text-text shrink-0"><X size={16} /></button>
        </div>
        <div className="p-3">
          {!hasQuery ? (
            <p className="text-sm text-muted py-6 text-center">Type at least 2 characters to search everything — title, content, category, and dates.</p>
          ) : (
            <SearchResults results={results} loading={loading} hasQuery={hasQuery} onNavigate={onClose} />
          )}
        </div>
      </div>
    </div>
  )
}
