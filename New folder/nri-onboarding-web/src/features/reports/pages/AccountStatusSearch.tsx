import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import { Link } from 'react-router-dom'
import { getErrorMessage, MASTER_QUERY_OPTIONS } from '@/api'
import { DateField, SelectField, TextField } from '@/components/form'
import { DataTable } from '@/components/shared/DataTable'
import { PageHeader } from '@/components/shared/PageHeader'
import { SearchFilters } from '@/components/shared/SearchFilters'
import { useUrlFilters } from '@/lib/useUrlFilters'
import { filters as inputFilters } from '@/lib/validators'
import { accountFiltersSchema, NO_ACCOUNT_FILTERS } from '../accountFilters'
import { REPORT_QUERY_KEYS, reportService } from '../services'
import type { AccountFilters, AccountRow } from '../types'

export const accountDetailPath = (row: Pick<AccountRow, 'customerId' | 'formNo'>) =>
  `/reports/account-status/detail?${new URLSearchParams({ custId: row.customerId, formNo: row.formNo })}`

/** The in-depth report exists only for accounts that have a customer id or S2K id. */
const hasDetail = (row: AccountRow) => Boolean(row.customerId || row.s2kId)

const linked = (text: string, row: AccountRow) =>
  text && hasDetail(row) ? (
    <Link to={accountDetailPath(row)} className="font-medium text-primary underline-offset-4 hover:underline">
      {text}
    </Link>
  ) : (
    text
  )

const COLUMNS: ColumnDef<AccountRow, unknown>[] = [
  { accessorKey: 'formNo', header: 'Form Number', cell: ({ row }) => linked(row.original.formNo, row.original) },
  { accessorKey: 'customerId', header: 'Customer ID', cell: ({ row }) => linked(row.original.customerId, row.original) },
  { accessorKey: 'loginId', header: 'Login ID' },
  { accessorKey: 'clientName', header: 'Client Name' },
  { accessorKey: 's2kId', header: 'S2K ID', cell: ({ row }) => linked(row.original.s2kId, row.original) },
  { accessorKey: 'branchName', header: 'Branch Name' },
  { accessorKey: 'branchCode', header: 'Branch Code' },
  { accessorKey: 'leadId', header: 'Lead ID' },
  { accessorKey: 'pan', header: 'PAN No' },
  { accessorKey: 'formStatus', header: 'Form Status' },
  { accessorKey: 'accountStatus', header: 'Account Status' },
  { accessorKey: 'lockRemarks', header: 'Lock Remarks' },
  { accessorKey: 'accountOpenDate', header: 'Account Open Date' },
  { accessorKey: 'updateDate', header: 'Update Date' },
  { accessorKey: 'nriType', header: 'NRI Type' },
  { accessorKey: 'branchId', header: 'Branch ID' },
  { accessorKey: 'accountType', header: 'Account Type' },
  { accessorKey: 'products', header: 'Products' },
]

const resolver = zodResolver(accountFiltersSchema)

/** Search accounts by any identifier; a result opens the in-depth report. */
export default function AccountStatusSearch() {
  const [filters, setFilters] = useUrlFilters(NO_ACCOUNT_FILTERS)
  const hasSearched = filters.searched === '1'

  const statuses = useQuery({
    queryKey: REPORT_QUERY_KEYS.FORM_STATUSES,
    queryFn: reportService.getFormStatuses,
    ...MASTER_QUERY_OPTIONS,
  })
  const accounts = useQuery({
    queryKey: REPORT_QUERY_KEYS.ACCOUNTS(filters),
    queryFn: () => reportService.searchAccounts(filters),
    // Nothing is listed until the user searches.
    enabled: hasSearched,
  })

  const search = (values: AccountFilters) =>
    setFilters(values === NO_ACCOUNT_FILTERS ? NO_ACCOUNT_FILTERS : { ...values, searched: '1' })

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Account Status Report"
        description="Search by any identifier. Open a result for the full account view."
      />

      <SearchFilters
        values={filters}
        emptyValues={NO_ACCOUNT_FILTERS}
        onSearch={search}
        isSearching={accounts.isFetching}
        resolver={resolver}
      >
        <TextField name="customerId" label="Customer ID" maxLength={20} transform={inputFilters.alnum} />
        <TextField name="s2kId" label="S2K ID" maxLength={20} transform={inputFilters.alnum} />
        <TextField name="dpClientId" label="DP Client ID" maxLength={20} transform={inputFilters.alnum} />
        <TextField name="formNumber" label="Form Number" maxLength={20} transform={inputFilters.upperAlnum} />
        <TextField name="loginId" label="Login ID" maxLength={30} />
        <TextField name="mobileNo" label="Mobile" inputMode="numeric" maxLength={15} transform={inputFilters.digits} />
        <TextField name="panNo" label="PAN No" maxLength={10} transform={inputFilters.upperAlnum} />
        <TextField name="emailId" label="Email ID" type="email" maxLength={120} />
        <SelectField
          name="formStatusId"
          label="Form Status"
          options={statuses.data}
          isLoading={statuses.isPending}
          placeholder="Any status"
        />
        <DateField name="formRecDateFrom" label="Form Rec Date From" />
        <DateField name="formRecDateTo" label="Form Rec Date To" />
        <DateField name="accountOpenedFromDt" label="Account Open Date From" />
        <DateField name="accountOpenetToDt" label="Account Open Date To" />
      </SearchFilters>

      {!hasSearched ? (
        <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
          Enter at least one filter and choose Search.
        </p>
      ) : accounts.isError ? (
        <p role="alert" className="text-sm text-destructive">
          {getErrorMessage(accounts.error)}
        </p>
      ) : (
        <DataTable
          columns={COLUMNS}
          data={accounts.data}
          isLoading={accounts.isPending}
          searchPlaceholder="Search in results…"
          emptyText="No accounts match these filters."
        />
      )}
    </div>
  )
}
