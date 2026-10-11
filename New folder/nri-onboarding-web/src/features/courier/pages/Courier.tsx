import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import { useMemo, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { getErrorMessage } from '@/api'
import { FieldShell, TextField } from '@/components/form'
import { DataTable } from '@/components/shared/DataTable'
import { PageHeader } from '@/components/shared/PageHeader'
import { SearchFilters } from '@/components/shared/SearchFilters'
import { NO_STANDARD_FILTERS, StandardFilterFields } from '@/components/shared/StandardFilterFields'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { useUrlFilters } from '@/lib/useUrlFilters'
import {
  COURIER_QUERY_KEYS,
  COURIER_TYPES,
  courierService,
  toCourierType,
  type CourierForm,
  type CourierType,
} from '../services'

const NO_FILTERS = { ...NO_STANDARD_FILTERS, courierType: '' }

const awbSchema = z.object({
  awbNo: z.string().trim().min(1, 'AWB number is required').max(50),
  remark: z.string().max(250, 'Maximum 250 characters'),
})
type AwbValues = z.infer<typeof awbSchema>

function AwbDialog({ form: courierForm, type }: { form: CourierForm; type: CourierType }) {
  const queryClient = useQueryClient()
  // Local: the dialog has to close itself once the save succeeds.
  const [open, setOpen] = useState(false)
  const form = useForm<AwbValues>({ resolver: zodResolver(awbSchema), defaultValues: { awbNo: '', remark: '' } })

  const save = useMutation({
    mutationFn: (values: AwbValues) => courierService.save(type, { formNo: courierForm.formNo, ...values }),
    onSuccess: async () => {
      setOpen(false)
      await queryClient.invalidateQueries({ queryKey: COURIER_QUERY_KEYS.ALL })
      toast.success(type === 'client' ? 'Courier marked as received' : 'Courier sent to HO')
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) form.reset()
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          {type === 'client' ? 'Mark received' : 'Send to HO'}
        </Button>
      </DialogTrigger>
      <DialogContent onInteractOutside={(event) => event.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{type === 'client' ? 'Courier received from client' : 'Courier sent to HO'}</DialogTitle>
          <DialogDescription>Form No: {courierForm.formNo}</DialogDescription>
        </DialogHeader>
        <FormProvider {...form}>
          <form
            onSubmit={(event) => {
              event.stopPropagation()
              void form.handleSubmit((values) => save.mutate(values))(event)
            }}
            className="grid gap-4"
            noValidate
          >
            <TextField name="awbNo" label="AWB No" required maxLength={50} autoFocus />
            <FieldShell id="courier-remark" label="Remark" error={form.formState.errors.remark?.message}>
              <Textarea id="courier-remark" rows={3} maxLength={250} {...form.register('remark')} />
            </FieldShell>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={save.isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={save.isPending}>
                {save.isPending ? 'Saving…' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  )
}

const BASE_COLUMNS: ColumnDef<CourierForm, unknown>[] = [
  { accessorKey: 'pan', header: 'PAN No' },
  { accessorKey: 'formNo', header: 'Form No' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'nriType', header: 'NRI Type' },
  { accessorKey: 'mobile', header: 'Mobile No' },
  { accessorKey: 'branchName', header: 'Branch Name' },
  { accessorKey: 'products', header: 'Product Name' },
  { accessorKey: 'clientName', header: 'Name As Per PAN' },
  { accessorKey: 'skRefNo', header: 'Reference No' },
  { accessorKey: 'punchDate', header: 'Form Punch Date' },
]

/** Tracks signed forms on their way from the client to the branch and from the branch to Head Office. */
export default function Courier() {
  const [filters, setFilters] = useUrlFilters(NO_FILTERS)
  const { courierType, ...standard } = filters
  const type = toCourierType(courierType)
  const forms = useQuery({
    queryKey: COURIER_QUERY_KEYS.LIST(type, standard),
    queryFn: () => courierService.getForms(type, standard),
  })

  const columns = useMemo<ColumnDef<CourierForm, unknown>[]>(
    () => [
      ...BASE_COLUMNS,
      {
        id: 'action',
        header: 'Action',
        enableSorting: false,
        cell: ({ row }) => <AwbDialog form={row.original} type={type} />,
      },
    ],
    [type],
  )

  return (
    <div className="grid gap-6">
      <PageHeader title="Courier Details" description="Record the AWB as signed forms arrive and move on." />

      <div role="group" aria-label="Courier status" className="flex gap-2">
        {COURIER_TYPES.map((option) => (
          <Button
            key={option.value}
            variant={option.value === type ? 'default' : 'outline'}
            aria-pressed={option.value === type}
            onClick={() => setFilters({ ...filters, courierType: option.value })}
          >
            {option.label}
          </Button>
        ))}
      </div>

      <SearchFilters
        values={filters}
        emptyValues={NO_FILTERS}
        onSearch={(values) => setFilters({ ...values, courierType: values === NO_FILTERS ? '' : courierType })}
        isSearching={forms.isFetching}
      >
        <StandardFilterFields />
      </SearchFilters>

      {forms.isError ? (
        <p role="alert" className="text-sm text-destructive">
          {getErrorMessage(forms.error)}
        </p>
      ) : (
        <DataTable
          columns={columns}
          data={forms.data}
          isLoading={forms.isPending}
          searchPlaceholder="Search in results…"
          emptyText={type === 'client' ? 'No couriers are expected from clients.' : 'Nothing is waiting to go to HO.'}
        />
      )}
    </div>
  )
}
