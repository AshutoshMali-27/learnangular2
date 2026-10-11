import type { ColumnDef } from '@tanstack/react-table'
import { Link } from 'react-router-dom'
import { getErrorMessage } from '@/api'
import { DataTable } from '@/components/shared/DataTable'
import { SearchFilters } from '@/components/shared/SearchFilters'
import { NO_STANDARD_FILTERS, StandardFilterFields } from '@/components/shared/StandardFilterFields'
import { Button } from '@/components/ui/button'
import { useUrlFilters } from '@/lib/useUrlFilters'
import { useObjectionForms } from '../hooks/useObjections'
import type { ObjectionForm } from '../types'

const COLUMNS: ColumnDef<ObjectionForm, unknown>[] = [
  { accessorKey: 'pan', header: 'PAN No' },
  { accessorKey: 'formNo', header: 'Form No' },
  { accessorKey: 'nriType', header: 'NRI Type' },
  { accessorKey: 'products', header: 'Product Name' },
  { accessorKey: 'clientName', header: 'Name As Per PAN' },
  { accessorKey: 'skRefNo', header: 'Reference No' },
  { accessorKey: 'punchDate', header: 'Form Punch Date' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'mobile', header: 'Mobile No' },
  {
    id: 'action',
    header: 'Action',
    enableSorting: false,
    cell: ({ row }) => (
      <Button asChild size="sm" variant="outline">
        <Link to={`/objections/${encodeURIComponent(row.original.formNo)}`}>Check Objection</Link>
      </Button>
    ),
  },
]

/** Forms of this branch that scrutiny has objected to. */
export default function ObjectionList() {
  const [filters, setFilters] = useUrlFilters(NO_STANDARD_FILTERS)
  const forms = useObjectionForms(filters)

  return (
    <div className="grid gap-6">
      <header className="grid gap-1">
        <h1 className="text-xl font-semibold">Data Objection</h1>
        <p className="text-sm text-muted-foreground">Forms returned by scrutiny for correction.</p>
      </header>

      <SearchFilters values={filters} emptyValues={NO_STANDARD_FILTERS} onSearch={setFilters} isSearching={forms.isFetching}>
        <StandardFilterFields dateLabel="Objection" />
      </SearchFilters>

      {forms.isError ? (
        <p role="alert" className="text-sm text-destructive">
          {getErrorMessage(forms.error)}
        </p>
      ) : (
        <DataTable
          columns={COLUMNS}
          data={forms.data}
          isLoading={forms.isPending}
          searchPlaceholder="Search in results…"
          emptyText="No forms with objections found."
        />
      )}
    </div>
  )
}
