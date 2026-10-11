import type { ReactNode } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export interface SimpleColumn<T> {
  header: string
  cell: (row: T, index: number) => ReactNode
}

interface SimpleTableProps<T> {
  columns: SimpleColumn<T>[]
  rows: T[]
  getKey: (row: T, index: number) => string
  emptyText?: string
  caption?: string
}

/** Plain read-only table for short lists that need no sorting, search or paging. */
export function SimpleTable<T>({ columns, rows, getKey, emptyText = 'No records.', caption }: SimpleTableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <Table>
        {caption && <caption className="sr-only">{caption}</caption>}
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.header}>{column.header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-16 text-center text-muted-foreground">
                {emptyText}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, index) => (
              <TableRow key={getKey(row, index)}>
                {columns.map((column) => (
                  <TableCell key={column.header}>{column.cell(row, index) || '—'}</TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
