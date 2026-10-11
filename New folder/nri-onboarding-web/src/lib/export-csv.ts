export interface ExportColumn<T> {
  header: string
  value: (row: T) => string | number | null | undefined
}

const escapeCell = (value: unknown) => {
  const text = String(value ?? '')
  // A leading = + - @ would be run as a formula by spreadsheet apps; the quote neutralises it.
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
}

export const toCsv = <T>(columns: ExportColumn<T>[], rows: T[]) =>
  [columns.map((column) => escapeCell(column.header)), ...rows.map((row) => columns.map((column) => escapeCell(column.value(row))))]
    .map((cells) => cells.join(','))
    .join('\r\n')

/** Downloads the rows as a CSV file that Excel opens directly. */
export function exportCsv<T>(fileName: string, columns: ExportColumn<T>[], rows: T[]) {
  // The BOM makes Excel read the file as UTF-8.
  const blob = new Blob(['﻿', toCsv(columns, rows)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${fileName}_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
