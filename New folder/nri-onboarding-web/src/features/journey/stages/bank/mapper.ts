import type { BankTypeConfig } from './rules'
import type { BankValues } from './schema'
import type { BankAccountPayload, BankRequest } from './types'

interface BankContext {
  formNo: string
  skRefNo: string
  empId: string
  pan: string
}

/** One common bank letter supports every account, so its path is repeated on each. */
export function toBankRequest(values: BankValues, types: BankTypeConfig[], context: BankContext): BankRequest {
  const letterPath = values.bankLetter?.filePath ?? ''

  const accounts = types.flatMap((type) =>
    type.accounts.map((config): BankAccountPayload => {
      const account = values.accounts[config.code]
      return {
        NriType: config.code,
        BankBranchID: account.branchId,
        IfscCode: account.ifsc,
        AccountNumber: account.accountNo,
        AccountType: account.accountType,
        IsDefault: account.isDefault || config.alwaysDefault ? '1' : '0',
        RBIReferenceNumber: config.requireRbi ? account.rbiRefNo.trim() : '',
        RBIApprovalDate: config.requireRbi ? account.rbiRefDate : '',
        ChequeLeafUploadFlag: letterPath ? 'Y' : 'N',
        ChequeLeafUploadPath: letterPath,
        MicrCode: '',
        TransactionReferenceNumber: '',
        UpiID: '',
      }
    }),
  )

  return {
    EmployeeCode: context.empId,
    employeeformno: context.formNo,
    FormEntryID: context.skRefNo,
    employeePanNo: context.pan,
    BankDetails: accounts,
  }
}
