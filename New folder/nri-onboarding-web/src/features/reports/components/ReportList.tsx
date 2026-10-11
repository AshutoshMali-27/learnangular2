import { useQuery } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import { Download } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getErrorMessage } from '@/api'
import { DataTable } from '@/components/shared/DataTable'
import { PageHeader } from '@/components/shared/PageHeader'
import { SearchFilters } from '@/components/shared/SearchFilters'
import {
  NO_STANDARD_FILTERS,
  StandardFilterFields,
  type StandardFilters,
} from '@/components/shared/StandardFilterFields'
import { Button } from '@/components/ui/button'
import { exportCsv, type ExportColumn } from '@/lib/export-csv'
import { useUrlFilters } from '@/lib/useUrlFilters'
import type { ReportRow } from '../types'

interface ReportListProps {
  title: string
  description: string
  queryKey: (filters: StandardFilters) => readonly unknown[]
  queryFn: (filters: StandardFilters) => Promise<ReportRow[]>
  columns: ColumnDef<ReportRow, unknown>[]
  /** Columns written to the export, and the file name it is saved under. */
  exportColumns: ExportColumn<ReportRow>[]
  exportName: string
  emptyText: string
}

/** The In-process and MIS screens: standard filters, a results grid, export and "Add new account". */
export function ReportList({
  title,
  description,
  queryKey,
  queryFn,
  columns,
  exportColumns,
  exportName,
  emptyText,
}: ReportListProps) {
  const [filters, setFilters] = useUrlFilters(NO_STANDARD_FILTERS)
  const rows = useQuery({ queryKey: queryKey(filters), queryFn: () => queryFn(filters) })

  return (
    <div className="grid gap-6">
      <PageHeader
        title={title}
        description={description}
        actions={
          <>
            <Button
              variant="outline"
              disabled={!rows.data?.length}
              onClick={() => exportCsv(exportName, exportColumns, rows.data ?? [])}
            >
              <Download />
              Export to Excel
            </Button>
            <Button asChild>
              <Link to="/journey">Add new account</Link>
            </Button>
          </>
        }
      />

      <SearchFilters values={filters} emptyValues={NO_STANDARD_FILTERS} onSearch={setFilters} isSearching={rows.isFetching}>
        <StandardFilterFields />
      </SearchFilters>

      {rows.isError ? (
        <p role="alert" className="text-sm text-destructive">
          {getErrorMessage(rows.error)}
        </p>
      ) : (
        <DataTable
          columns={columns}
          data={rows.data}
          isLoading={rows.isPending}
          searchPlaceholder="Search in results…"
          emptyText={emptyText}
        />
      )}
    </div>
  )
}

/** Columns both report screens share, for the grid and for the export. */
export const REPORT_FIELDS: { key: keyof ReportRow; header: string }[] = [
  { key: 'pan', header: 'PAN No' },
  { key: 'formNo', header: 'Form No' },
  { key: 'email', header: 'Email' },
  { key: 'nriType', header: 'NRI Type' },
  { key: 'mobile', header: 'Mobile No' },
  { key: 'products', header: 'Product Name' },
  { key: 'clientName', header: 'Name As Per PAN' },
  { key: 'skRefNo', header: 'Reference No' },
]

export const toGridColumns = (fields: typeof REPORT_FIELDS): ColumnDef<ReportRow, unknown>[] =>
  fields.map(({ key, header }) => ({ accessorKey: key, header }))

export const toExportColumns = (fields: typeof REPORT_FIELDS): ExportColumn<ReportRow>[] =>
  fields.map(({ key, header }) => ({ header, value: (row) => row[key] }))
