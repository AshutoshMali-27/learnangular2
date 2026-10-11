import { z } from 'zod'
import { todayIso } from '@/lib/dates'
import { SAVINGS, type BankTypeConfig } from './rules'

const accountSchema = z.object({
  ifsc: z.string(),
  branchId: z.string(),
  bankName: z.string(),
  branchName: z.string(),
  accountNo: z.string(),
  accountType: z.string(),
  rbiRefNo: z.string(),
  rbiRefDate: z.string(),
  isDefault: z.boolean(),
  /** Result of the bank check. */
  status: z.enum(['idle', 'valid', 'invalid']),
})

export type BankAccountValues = z.infer<typeof accountSchema>

export const emptyAccount = (isDefault: boolean): BankAccountValues => ({
  ifsc: '',
  branchId: '',
  bankName: '',
  branchName: '',
  accountNo: '',
  accountType: SAVINGS,
  rbiRefNo: '',
  rbiRefDate: '',
  isDefault,
  status: 'idle',
})

/** The schema covers exactly the accounts this form needs. */
export const createBankSchema = (types: BankTypeConfig[]) =>
  z
    .object({
      bankLetter: z
        .object({ filePath: z.string(), fileName: z.string() })
        .nullable()
        .refine((file) => file !== null, 'Upload the bank letter'),
      accounts: z.record(z.string(), accountSchema),
    })
    .superRefine((values, context) => {
      const issue = (code: string, field: string, message: string) =>
        context.addIssue({ code: 'custom', path: ['accounts', code, field], message })

      for (const type of types) {
        for (const config of type.accounts) {
          const account = values.accounts[config.code]
          if (!account) continue
          if (!account.branchId) issue(config.code, 'ifsc', 'Find the branch for this IFSC')
          if (!/^[A-Za-z0-9]{6,20}$/.test(account.accountNo)) {
            issue(config.code, 'accountNo', 'Enter a valid account number')
          }
          if (config.requireRbi) {
            if (!account.rbiRefNo.trim()) issue(config.code, 'rbiRefNo', 'RBI reference number is required')
            if (!account.rbiRefDate) issue(config.code, 'rbiRefDate', 'RBI reference date is required')
            else if (account.rbiRefDate > todayIso()) issue(config.code, 'rbiRefDate', 'Date cannot be in the future')
          }
          if (account.status !== 'valid') issue(config.code, 'status', 'Validate the bank account to continue')
        }

        // The two accounts of a PIS type must be different accounts.
        const [first, second] = type.accounts.map((config) => values.accounts[config.code])
        if (first && second && first.accountNo && first.accountNo === second.accountNo) {
          issue(type.accounts[1].code, 'accountNo', 'Use a different account from the primary one')
        }
      }
    })

export type BankValues = z.input<ReturnType<typeof createBankSchema>>

export const bankDefaults = (types: BankTypeConfig[]): BankValues => ({
  bankLetter: null,
  accounts: Object.fromEntries(
    types.flatMap((type) =>
      // The first account of a type starts as its default.
      type.accounts.map((config, index) => [config.code, emptyAccount(index === 0)]),
    ),
  ),
})
