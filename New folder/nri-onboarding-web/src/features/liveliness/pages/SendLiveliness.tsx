import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getErrorMessage } from '@/api'
import { PageHeader } from '@/components/shared/PageHeader'
import { PageLoader } from '@/components/shared/PageLoader'
import { SearchFilters } from '@/components/shared/SearchFilters'
import { SimpleTable, type SimpleColumn } from '@/components/shared/SimpleTable'
import { NO_STANDARD_FILTERS, StandardFilterFields } from '@/components/shared/StandardFilterFields'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { confirm } from '@/lib/dialog-service'
import { useUrlFilters } from '@/lib/useUrlFilters'
import {
  groupByForm,
  isVerified,
  LIVELINESS_QUERY_KEYS,
  livelinessService,
  notificationFor,
  type LivelinessRow,
} from '../services'

function NotificationButton({ row }: { row: LivelinessRow }) {
  const queryClient = useQueryClient()
  const kind = notificationFor(row)
  const isEmailAlert = kind === 'emailVerification'

  const send = useMutation({
    mutationFn: () =>
      isEmailAlert ? livelinessService.sendVerificationMail(row) : livelinessService.sendLivelinessMail(row),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: LIVELINESS_QUERY_KEYS.ALL })
      toast.success(isEmailAlert ? 'Verification mail sent successfully' : 'Liveliness mail sent successfully')
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const ask = async () => {
    const confirmed = await confirm({
      title: isEmailAlert ? 'Send verification email?' : 'Send liveliness email?',
      description: `${row.clientName} (${row.email}) will receive ${
        isEmailAlert ? 'the email verification mail' : 'the link to the liveliness check'
      }.`,
      confirmText: 'Send',
    })
    if (confirmed) send.mutate()
  }

  return (
    <Button
      size="sm"
      variant={isEmailAlert ? 'outline' : 'default'}
      disabled={kind === 'livelinessBlocked' || send.isPending}
      title={kind === 'livelinessBlocked' ? 'A mail was sent recently; it cannot be sent again yet' : undefined}
      onClick={ask}
    >
      {send.isPending ? 'Sending…' : isEmailAlert ? 'Email Alert' : 'Liveness Alert'}
    </Button>
  )
}

const COLUMNS: SimpleColumn<LivelinessRow>[] = [
  { header: 'PAN No', cell: (row) => row.pan },
  { header: 'Holder Type', cell: (row) => row.holderType },
  { header: 'Client Name', cell: (row) => row.clientName },
  { header: 'Email', cell: (row) => row.email },
  { header: 'Mail Last Sent On', cell: (row) => row.mailLastSentOn },
  {
    header: 'Email Verified',
    cell: (row) => (
      <Badge variant={isVerified(row) ? 'secondary' : 'outline'}>{isVerified(row) ? 'Verified' : 'Not Verified'}</Badge>
    ),
  },
  { header: 'Notification', cell: (row) => <NotificationButton row={row} /> },
]

/** Holders whose face-liveliness check is pending, grouped by form, with the mail each can be sent. */
export default function SendLiveliness() {
  const [filters, setFilters] = useUrlFilters(NO_STANDARD_FILTERS)
  const pending = useQuery({
    queryKey: LIVELINESS_QUERY_KEYS.PENDING(filters),
    queryFn: () => livelinessService.getPending(filters),
  })
  const groups = groupByForm(pending.data ?? [])

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Send Liveliness Link"
        description="The primary holder's email must be verified before the liveliness link can be sent."
      />

      <SearchFilters values={filters} emptyValues={NO_STANDARD_FILTERS} onSearch={setFilters} isSearching={pending.isFetching}>
        <StandardFilterFields />
      </SearchFilters>

      {pending.isPending ? (
        <PageLoader />
      ) : pending.isError ? (
        <p role="alert" className="text-sm text-destructive">
          {getErrorMessage(pending.error)}
        </p>
      ) : groups.length === 0 ? (
        <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
          No holders are waiting for a liveliness check.
        </p>
      ) : (
        groups.map((group) => (
          <section key={group.formNo} className="grid gap-2" aria-labelledby={`form-${group.formNo}`}>
            <h2 id={`form-${group.formNo}`} className="text-sm font-medium">
              Form No: {group.formNo}
            </h2>
            <SimpleTable
              caption={`Holders of form ${group.formNo}`}
              columns={COLUMNS}
              rows={group.holders}
              getKey={(row) => `${row.formNo}-${row.holderType}`}
            />
          </section>
        ))
      )}
    </div>
  )
}
