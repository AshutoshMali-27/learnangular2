import type { ColumnDef } from '@tanstack/react-table'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { journeyPath } from '@/features/journey/stages.config'
import { REPORT_FIELDS, ReportList, toExportColumns, toGridColumns } from '../components/ReportList'
import { REPORT_QUERY_KEYS, reportService } from '../services'
import type { ReportRow } from '../types'

const COLUMNS: ColumnDef<ReportRow, unknown>[] = [
  ...toGridColumns(REPORT_FIELDS),
  { accessorKey: 'nextStage', header: 'Waiting On' },
  {
    id: 'action',
    header: 'Action',
    enableSorting: false,
    cell: ({ row }) => (
      <Button asChild size="sm">
        {/* The journey opens on whichever stage the form is waiting at. */}
        <Link to={journeyPath(row.original.formNo)}>Resume</Link>
      </Button>
    ),
  },
]

const EXPORT_COLUMNS = [
  ...toExportColumns(REPORT_FIELDS),
  { header: 'Waiting On', value: (row: ReportRow) => row.nextStage },
]

/** Applications that were started but not completed, so they can be resumed. */
export default function InProcessForms() {
  return (
    <ReportList
      title="Inprocess Forms"
      description="Applications that were started but not completed."
      queryKey={REPORT_QUERY_KEYS.IN_PROCESS}
      queryFn={reportService.getInProcess}
      columns={COLUMNS}
      exportColumns={EXPORT_COLUMNS}
      exportName="Inprocess_summary"
      emptyText="No in-process forms found."
    />
  )
}
