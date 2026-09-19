import { useState, useRef, useEffect } from 'react'
import { Download, Copy, FileSpreadsheet, FileText, ChevronDown, Check } from 'lucide-react'
import { copyRows, exportExcel, exportPDF } from '../lib/exportUtils'

export default function ExportMenu({ rows, columns, filename, title }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const disabled = !rows || rows.length === 0

  const handleCopy = async () => {
    const ok = await copyRows(rows, columns)
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), 1500) }
    setOpen(false)
  }

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={disabled}
        className="flex items-center gap-1.5 bg-surface-2 border border-border rounded-xl px-2.5 py-1.5 text-xs hover:bg-surface-3 transition disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {copied ? <Check size={13} className="text-success" /> : <Download size={13} />}
        <span>{copied ? 'Copied' : 'Export'}</span>
        <ChevronDown size={12} />
      </button>
      {open && (
        <div className="absolute right-0 mt-1.5 w-48 bg-surface border border-border rounded-xl shadow-2xl z-30 overflow-hidden py-1">
          <button type="button" onClick={handleCopy} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-surface-2 text-left">
            <Copy size={14} className="text-muted" /> Copy
          </button>
          <button type="button" onClick={() => { exportExcel(rows, columns, filename); setOpen(false) }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-surface-2 text-left">
            <FileSpreadsheet size={14} className="text-success" /> Export Excel
          </button>
          <button type="button" onClick={() => { exportPDF(rows, columns, filename, title); setOpen(false) }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-surface-2 text-left">
            <FileText size={14} className="text-danger" /> Export PDF
          </button>
        </div>
      )}
    </div>
  )
}
