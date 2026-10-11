import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import { Clock, Loader2, Upload } from 'lucide-react'
import { useId } from 'react'
import { toast } from 'sonner'
import { getErrorMessage } from '@/api'
import { DataTable } from '@/components/shared/DataTable'
import { PageHeader } from '@/components/shared/PageHeader'
import { SearchFilters } from '@/components/shared/SearchFilters'
import { NO_STANDARD_FILTERS, StandardFilterFields } from '@/components/shared/StandardFilterFields'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { confirm } from '@/lib/dialog-service'
import { useUrlFilters } from '@/lib/useUrlFilters'
import { canResend, hasCooldown, hasObjection, isPdf, PDF_QUERY_KEYS, pdfService, type PdfForm } from '../services'

function ObjectionsDialog({ form }: { form: PdfForm }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          View
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Objections – Form No: {form.formNo}</DialogTitle>
          <DialogDescription>Raised against the uploaded PDF.</DialogDescription>
        </DialogHeader>
        <ol className="grid list-decimal gap-2 pl-5 text-sm">
          {form.objections.map((objection) => (
            <li key={objection}>{objection}</li>
          ))}
        </ol>
        {form.remarks && (
          <p className="text-sm">
            <span className="font-medium">Remark: </span>
            <span className="text-muted-foreground">{form.remarks}</span>
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}

function RowActions({ form }: { form: PdfForm }) {
  const inputId = useId()
  const queryClient = useQueryClient()
  const refresh = () => queryClient.invalidateQueries({ queryKey: PDF_QUERY_KEYS.ALL })

  const upload = useMutation({
    mutationFn: (file: File) => pdfService.upload(form, file, () => undefined),
    onSuccess: async () => {
      await refresh()
      toast.success(`PDF uploaded successfully for ${form.formNo}`)
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const resend = useMutation({
    mutationFn: () => pdfService.resend(form),
    onSuccess: async () => {
      await refresh()
      toast.success('PDF resent successfully')
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const pick = (file: File | undefined) => {
    if (!file) return
    if (isPdf(file)) upload.mutate(file)
    else toast.error('Only PDF files can be uploaded.')
  }

  const askResend = async () => {
    const confirmed = await confirm({
      title: 'Resend PDF',
      description: `The generated PDF for ${form.formNo} will be emailed to the client again.`,
      confirmText: 'Resend',
    })
    if (confirmed) resend.mutate()
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button asChild size="sm" disabled={upload.isPending}>
        <label htmlFor={inputId} className="cursor-pointer has-focus-visible:ring-2 has-focus-visible:ring-ring">
          {upload.isPending ? <Loader2 className="animate-spin" /> : <Upload />}
          {upload.isPending ? 'Uploading…' : 'Upload'}
          <input
            id={inputId}
            type="file"
            accept="application/pdf,.pdf"
            className="sr-only"
            aria-label={`Upload PDF for ${form.formNo}`}
            disabled={upload.isPending}
            onChange={(event) => {
              pick(event.target.files?.[0])
              event.target.value = ''
            }}
          />
        </label>
      </Button>
      {hasObjection(form) && <ObjectionsDialog form={form} />}
      {canResend(form) && (
        <Button size="sm" variant="outline" onClick={askResend} disabled={resend.isPending}>
          {resend.isPending ? 'Resending…' : 'Resend'}
        </Button>
      )}
    </div>
  )
}

const COLUMNS: ColumnDef<PdfForm, unknown>[] = [
  { accessorKey: 'pan', header: 'PAN No' },
  { accessorKey: 'formNo', header: 'Form No' },
  {
    accessorKey: 'clientName',
    header: 'Client Name',
    cell: ({ row }) => (
      <span className="block max-w-48 truncate" title={row.original.clientName}>
        {row.original.clientName}
      </span>
    ),
  },
  {
    accessorKey: 'pdfType',
    header: 'PDF Type',
    cell: ({ row }) => <Badge variant="secondary">{row.original.pdfType}</Badge>,
  },
  { accessorKey: 'email', header: 'Email' },
  {
    accessorKey: 'cooldown',
    header: 'Cooldown',
    cell: ({ row }) =>
      hasCooldown(row.original) ? (
        <Badge variant="outline">
          <Clock />
          {row.original.cooldown}
        </Badge>
      ) : (
        '-'
      ),
  },
  {
    id: 'status',
    header: 'Status',
    accessorFn: (form) => (hasObjection(form) ? 'Objection' : 'No Objection'),
    cell: ({ row }) => (
      <Badge variant={hasObjection(row.original) ? 'destructive' : 'secondary'}>
        {hasObjection(row.original) ? 'Objection' : 'No Objection'}
      </Badge>
    ),
  },
  { id: 'action', header: 'Action', enableSorting: false, cell: ({ row }) => <RowActions form={row.original} /> },
]

/** Forms awaiting a signed PDF: upload it, read objections against it, or resend the generated PDF. */
export default function PdfUpload() {
  const [filters, setFilters] = useUrlFilters(NO_STANDARD_FILTERS)
  const forms = useQuery({ queryKey: PDF_QUERY_KEYS.LIST(filters), queryFn: () => pdfService.getForms(filters) })

  return (
    <div className="grid gap-6">
      <PageHeader title="PDF Upload" description="Upload the PDF the client signed, or resend the generated one." />

      <SearchFilters values={filters} emptyValues={NO_STANDARD_FILTERS} onSearch={setFilters} isSearching={forms.isFetching}>
        <StandardFilterFields />
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
          emptyText="No forms are waiting for a PDF."
        />
      )}
    </div>
  )
}
