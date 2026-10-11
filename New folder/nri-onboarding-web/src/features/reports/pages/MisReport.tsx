import type { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { REPORT_FIELDS, ReportList, toExportColumns, toGridColumns } from '../components/ReportList'
import { REPORT_QUERY_KEYS, reportService } from '../services'
import type { ReportRow } from '../types'

const IN_PROCESS = 'INPROCESS'
const statusText = (status: string) => (status === IN_PROCESS ? 'In Process' : status)

// MIS shows the branch code after Mobile No; the other columns are the shared ones.
const MIS_FIELDS = [
  ...REPORT_FIELDS.slice(0, 5),
  { key: 'branchCode' as const, header: 'Branch Code' },
  ...REPORT_FIELDS.slice(5),
]

const COLUMNS: ColumnDef<ReportRow, unknown>[] = [
  ...toGridColumns(MIS_FIELDS),
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <Badge variant={row.original.status === IN_PROCESS ? 'outline' : 'secondary'}>
        {statusText(row.original.status)}
      </Badge>
    ),
  },
]

const EXPORT_COLUMNS = [
  ...toExportColumns(MIS_FIELDS),
  { header: 'Status', value: (row: ReportRow) => statusText(row.status) },
]

/** MIS listing of NRI applications in every status. */
export default function MisReport() {
  return (
    <ReportList
      title="MIS Reports"
      description="All NRI applications of your branch, in every status."
      queryKey={REPORT_QUERY_KEYS.MIS}
      queryFn={reportService.getMis}
      columns={COLUMNS}
      exportColumns={EXPORT_COLUMNS}
      exportName="MIS_summary"
      emptyText="No applications found."
    />
  )
}
