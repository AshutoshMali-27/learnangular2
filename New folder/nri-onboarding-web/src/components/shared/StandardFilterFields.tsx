import { DateField, TextField } from '@/components/form'
import { todayIso } from '@/lib/dates'
import { filters } from '@/lib/validators'

/** The six filters every list screen shares (`NRIReportRequest` on the backend). */
export interface StandardFilters {
  formNo: string
  pan: string
  mobile: string
  email: string
  fromDate: string
  toDate: string
}

export const NO_STANDARD_FILTERS: StandardFilters = {
  formNo: '',
  pan: '',
  mobile: '',
  email: '',
  fromDate: '',
  toDate: '',
}

/** Fields for <SearchFilters> on a list screen. `dateLabel` names what the date range filters on. */
export function StandardFilterFields({ dateLabel = '' }: { dateLabel?: string }) {
  const dated = (text: string) => (dateLabel ? `${dateLabel} ${text}` : text)

  return (
    <>
      <TextField name="formNo" label="Form No" maxLength={20} transform={filters.upperAlnum} />
      <TextField name="pan" label="PAN No" maxLength={10} transform={filters.upperAlnum} />
      <TextField name="mobile" label="Mobile No" inputMode="numeric" maxLength={15} transform={filters.digits} />
      <TextField name="email" label="Email ID" type="email" maxLength={120} />
      <DateField name="fromDate" label={dated('From Date')} max={todayIso()} />
      <DateField name="toDate" label={dated('To Date')} max={todayIso()} />
    </>
  )
}
