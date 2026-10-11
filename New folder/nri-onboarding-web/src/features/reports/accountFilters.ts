import { z } from 'zod'
import type { AccountFilters } from './types'

export const NO_ACCOUNT_FILTERS: AccountFilters = {
  customerId: '',
  s2kId: '',
  dpClientId: '',
  formNumber: '',
  loginId: '',
  mobileNo: '',
  panNo: '',
  emailId: '',
  formStatusId: '',
  formRecDateFrom: '',
  formRecDateTo: '',
  accountOpenedFromDt: '',
  accountOpenetToDt: '',
  searched: '',
}

const text = z.string()

/**
 * A search by form status alone could return the whole branch, so it needs a date range:
 * form-received or account-opened, with both ends filled and in order (Docs/UI/22 §Filters).
 */
export const accountFiltersSchema = z
  .object({
    customerId: text, s2kId: text, dpClientId: text, formNumber: text, loginId: text, mobileNo: text,
    panNo: text, emailId: text, formStatusId: text, formRecDateFrom: text, formRecDateTo: text,
    accountOpenedFromDt: text, accountOpenetToDt: text, searched: text,
  })
  .superRefine((filters, context) => {
    const issue = (path: keyof AccountFilters, message: string) =>
      context.addIssue({ code: 'custom', path: [path], message })

    const ranges = [
      { from: 'formRecDateFrom', to: 'formRecDateTo', label: 'Form received' },
      { from: 'accountOpenedFromDt', to: 'accountOpenetToDt', label: 'Account open' },
    ] as const

    let complete = 0
    for (const { from, to, label } of ranges) {
      const start = filters[from]
      const end = filters[to]
      if (!start && !end) continue
      if (!start) issue(from, `${label} from date is required`)
      else if (!end) issue(to, `${label} to date is required`)
      else if (start > end) issue(to, 'To date cannot be before the from date')
      else complete += 1
    }

    const anyRangeStarted = ranges.some(({ from, to }) => filters[from] || filters[to])
    if (filters.formStatusId && complete === 0 && !anyRangeStarted) {
      issue('formRecDateFrom', 'Select a date range when searching by form status')
    }
  })
