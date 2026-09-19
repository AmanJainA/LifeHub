import { useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import ExportMenu from '../../components/ExportMenu'

export const ROW_OPTIONS = [10, 20, 30, 50, 100, 250, 500]

/**
 * @param {Array} items - full list of rows for this page/tab
 * @param {Object} opts
 * @param {string[]} opts.searchKeys - fields to match the dedicated page search against
 * @param {string} [opts.dateKey] - date field (YYYY-MM-DD) used for the month-wise filter
 * @param {Array} opts.columns - [{ label, value: (row) => any }] used by Export
 * @param {string} opts.filename - export filename (without extension)
 * @param {string} [opts.title] - export document title
 */
export function useListControls(items, { searchKeys = [], dateKey = null, columns = [], filename = 'export', title = '' } = {}) {
  const [q, setQ] = useState('')
  const [month, setMonth] = useState('')
  const [pageSize, setPageSize] = useState(20)
  const [page, setPage] = useState(1)

  const months = useMemo(() => {
    if (!dateKey) return []
    const set = new Set(items.map((i) => i[dateKey]?.slice(0, 7)).filter(Boolean))
    return Array.from(set).sort().reverse()
  }, [items, dateKey])

  const filtered = useMemo(() => {
    let rows = items
    if (dateKey && month) rows = rows.filter((r) => r[dateKey]?.slice(0, 7) === month)
    if (q.trim()) {
      const needle = q.trim().toLowerCase()
      rows = rows.filter((r) => searchKeys.some((k) => String(r[k] || '').toLowerCase().includes(needle)))
    }
    return rows
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, q, month, dateKey])

  useEffect(() => { setPage(1) }, [q, month, pageSize])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const visibleItems = useMemo(
    () => filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filtered, safePage, pageSize]
  )

  const Toolbar = (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-2 bg-surface-2 border border-border rounded-xl px-3 py-1.5 flex-1 min-w-[160px]">
        <Search size={14} className="text-muted shrink-0" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search this page…"
          className="bg-transparent outline-none text-sm flex-1 placeholder:text-muted/60 min-w-0"
        />
      </div>
      {dateKey && months.length > 0 && (
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="bg-surface-2 border border-border rounded-xl px-2.5 py-1.5 text-xs text-text shrink-0"
        >
          <option value="">All time</option>
          {months.map((m) => (
            <option key={m} value={m}>
              {new Date(`${m}-01`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
            </option>
          ))}
        </select>
      )}
      <select
        value={pageSize}
        onChange={(e) => setPageSize(Number(e.target.value))}
        className="bg-surface-2 border border-border rounded-xl px-2.5 py-1.5 text-xs text-text shrink-0"
      >
        {ROW_OPTIONS.map((n) => <option key={n} value={n}>{n} rows</option>)}
      </select>
      {columns.length > 0 && <ExportMenu rows={filtered} columns={columns} filename={filename} title={title} />}
    </div>
  )

  const PaginationBar = totalPages > 1 ? (
    <div className="flex items-center justify-between text-xs text-muted pt-1">
      <span>
        Showing {visibleItems.length ? (safePage - 1) * pageSize + 1 : 0}–{(safePage - 1) * pageSize + visibleItems.length} of {filtered.length}
      </span>
      <div className="flex items-center gap-1">
        <button type="button" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)} className="px-2.5 py-1 rounded-lg bg-surface-2 border border-border disabled:opacity-40">Prev</button>
        <span className="px-2 font-mono-num">{safePage} / {totalPages}</span>
        <button type="button" disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)} className="px-2.5 py-1 rounded-lg bg-surface-2 border border-border disabled:opacity-40">Next</button>
      </div>
    </div>
  ) : null

  return { visibleItems, total: filtered.length, Toolbar, PaginationBar }
}
