import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { getErrorMessage } from '@/api'
import { DescriptionList } from '@/components/shared/DescriptionList'
import { PageLoader } from '@/components/shared/PageLoader'
import { SimpleTable } from '@/components/shared/SimpleTable'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ADDRESS_FIELDS,
  BANK_COLUMNS,
  CLIENT_FIELDS,
  DP_COLUMNS,
  EXTRA_FIELDS,
  FATCA_FIELDS,
  FATCA_SUMMARY,
  initials,
  JURISDICTION_FIELDS,
  NOMINEE_FIELDS,
  NOMINEE_SUMMARY,
  pick,
  PROOF_COLUMNS,
  type FieldConfig,
} from '../accountSections'
import { REPORT_QUERY_KEYS, reportService } from '../services'

type Fields = Record<string, string>

function FieldTable({ columns, rows, caption }: { columns: FieldConfig[]; rows: Fields[]; caption: string }) {
  return (
    <SimpleTable
      caption={caption}
      columns={[
        { header: 'Sr No', cell: (_, index) => index + 1 },
        ...columns.map(({ label, key }) => ({ header: label, cell: (row: Fields) => row[key] })),
      ]}
      rows={rows}
      getKey={(_, index) => String(index)}
    />
  )
}

/** Rows that open to show more: the summary fields are always visible, the rest on expand. */
function ExpandableList({ rows, summary, details, emptyText }: {
  rows: Fields[]
  summary: FieldConfig[]
  details: FieldConfig[]
  emptyText: string
}) {
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">{emptyText}</p>

  return (
    <ul className="grid gap-3">
      {rows.map((row, index) => (
        <li key={index}>
          <details className="rounded-md border open:bg-muted/30">
            <summary className="cursor-pointer px-4 py-3">
              <span className="inline-flex flex-wrap gap-x-6 gap-y-1 align-middle text-sm">
                {summary.map(({ label, key }) => (
                  <span key={key}>
                    <span className="text-muted-foreground">{label}: </span>
                    <span className="font-medium">{row[key] || '—'}</span>
                  </span>
                ))}
              </span>
            </summary>
            <div className="border-t px-4 py-3">
              <DescriptionList items={pick(row, details)} />
            </div>
          </details>
        </li>
      ))}
    </ul>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-3">
      <h3 className="text-sm font-medium">{title}</h3>
      {children}
    </section>
  )
}

/** Read-only 360° view of one account: client master, addresses, bank, FATCA, proofs, DP and nominees. */
export default function AccountStatusDetail() {
  const [params] = useSearchParams()
  const customerId = params.get('custId') ?? ''
  const formNo = params.get('formNo') ?? ''

  const detail = useQuery({
    queryKey: REPORT_QUERY_KEYS.ACCOUNT_DETAIL(customerId, formNo),
    // The backend looks up by customer id when there is one, otherwise by form number.
    queryFn: () => reportService.getAccountDetail(customerId, customerId ? '' : formNo),
  })

  const back = (
    <Button asChild variant="outline" size="sm">
      <Link to="/reports/account-status">Back to search</Link>
    </Button>
  )

  if (detail.isPending) return <PageLoader label="Loading account…" />
  if (detail.isError || !detail.data.ClientData) {
    return (
      <section className="grid justify-items-start gap-3">
        <h1 className="text-xl font-semibold">Account details cannot be shown</h1>
        <p className="text-sm text-muted-foreground">
          {detail.isError ? getErrorMessage(detail.error) : 'Failed to load account details.'}
        </p>
        {back}
      </section>
    )
  }

  const report = detail.data
  const client = report.ClientData

  return (
    <div className="grid gap-6">
      <Card>
        <CardContent className="flex flex-wrap items-center gap-4">
          <span
            aria-hidden
            className="grid size-14 shrink-0 place-items-center rounded-full bg-primary text-lg font-semibold text-primary-foreground"
          >
            {initials(client.PANNAME ?? '')}
          </span>
          <div className="grid min-w-0 flex-1 gap-1">
            <h1 className="text-xl font-semibold">{client.PANNAME}</h1>
            <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
              {[
                ['Form No', client.FORMNO],
                ['PAN', client.PANNO],
                ['S2K ID', client.S2K_ID],
              ].map(([label, value]) => (
                <div key={label} className="flex gap-1.5">
                  <dt>{label}</dt>
                  <dd className="font-medium text-foreground">{value || '—'}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {client.FORM_STATUS && <Badge variant="secondary">{client.FORM_STATUS}</Badge>}
            {client.ACCOUNT_STATUS && <Badge>{client.ACCOUNT_STATUS}</Badge>}
            {back}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="client">
        <TabsList className="h-auto flex-wrap justify-start">
          <TabsTrigger value="client">Client</TabsTrigger>
          <TabsTrigger value="address">Address</TabsTrigger>
          <TabsTrigger value="bank">Bank</TabsTrigger>
          <TabsTrigger value="fatca">FATCA</TabsTrigger>
          <TabsTrigger value="proof">Proof</TabsTrigger>
          <TabsTrigger value="dp">DP Details</TabsTrigger>
          <TabsTrigger value="nominee">Nominee</TabsTrigger>
          <TabsTrigger value="extra">Extra</TabsTrigger>
        </TabsList>

        <TabsContent value="client" className="pt-4">
          <DescriptionList items={pick(client, CLIENT_FIELDS)} className="xl:grid-cols-4" />
        </TabsContent>

        <TabsContent value="address" className="grid gap-6 pt-4">
          <Section title="Registered address">
            <DescriptionList items={pick(report.RegisteredAddressDetails, ADDRESS_FIELDS)} />
          </Section>
          <Section title="Communication address">
            <DescriptionList items={pick(report.CommunicationAddressDetails, ADDRESS_FIELDS)} />
          </Section>
          <Section title="Jurisdiction">
            <DescriptionList items={pick(report.ClientJurisdictionDetails, JURISDICTION_FIELDS)} />
          </Section>
        </TabsContent>

        <TabsContent value="bank" className="pt-4">
          <FieldTable caption="Bank accounts" columns={BANK_COLUMNS} rows={report.BankDetails ?? []} />
        </TabsContent>

        <TabsContent value="fatca" className="pt-4">
          <ExpandableList
            rows={report.FATCADetail ?? []}
            summary={FATCA_SUMMARY}
            details={FATCA_FIELDS}
            emptyText="No FATCA records."
          />
        </TabsContent>

        <TabsContent value="proof" className="pt-4">
          <FieldTable caption="Proof documents" columns={PROOF_COLUMNS} rows={report.DocProofDetails ?? []} />
        </TabsContent>

        <TabsContent value="dp" className="pt-4">
          <FieldTable caption="DP accounts" columns={DP_COLUMNS} rows={report.DPDetail ?? []} />
        </TabsContent>

        <TabsContent value="nominee" className="pt-4">
          <ExpandableList
            rows={report.NomineeDetail ?? []}
            summary={NOMINEE_SUMMARY}
            details={NOMINEE_FIELDS}
            emptyText="No nominees."
          />
        </TabsContent>

        <TabsContent value="extra" className="pt-4">
          <DescriptionList items={pick(report['Client Extra Detail'], EXTRA_FIELDS)} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
