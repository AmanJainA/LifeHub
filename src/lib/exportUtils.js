import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// columns: [{ label: 'Title', value: (row) => row.title }]

export async function copyRows(rows, columns) {
  const header = columns.map((c) => c.label).join('\t')
  const lines = rows.map((r) => columns.map((c) => String(c.value(r) ?? '')).join('\t'))
  const text = [header, ...lines].join('\n')
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

export function exportExcel(rows, columns, filename = 'export') {
  const data = rows.map((r) => {
    const obj = {}
    columns.forEach((c) => { obj[c.label] = c.value(r) })
    return obj
  })
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Data')
  XLSX.writeFile(wb, `${filename}.xlsx`)
}

export function exportPDF(rows, columns, filename = 'export', title = '') {
  const doc = new jsPDF()
  doc.setFontSize(14)
  doc.text(title || filename, 14, 15)
  doc.setFontSize(9)
  doc.setTextColor(120)
  doc.text(new Date().toLocaleString('en-IN'), 14, 21)

  autoTable(doc, {
    startY: 26,
    head: [columns.map((c) => c.label)],
    body: rows.map((r) => columns.map((c) => String(c.value(r) ?? ''))),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [245, 166, 35], textColor: [20, 22, 43] },
    alternateRowStyles: { fillColor: [245, 246, 251] },
  })
  doc.save(`${filename}.pdf`)
}
