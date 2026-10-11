import { describe, expect, it } from 'vitest'
import { toCsv } from '@/lib/export-csv'
import { operationsMock } from '@/mocks/operations.mock'
import { groupByForm, isVerified, notificationFor, type LivelinessRow } from './liveliness/services'
import { canResend, hasCooldown, uploadTarget, type PdfForm } from './pdf-upload/services'
import { accountFiltersSchema, NO_ACCOUNT_FILTERS } from './reports/accountFilters'
import { initials, pick } from './reports/accountSections'

const NO_FILTERS = { formNo: '', pan: '', mobile: '', email: '', fromDate: '', toDate: '' }

describe('csv export', () => {
  const columns = [
    { header: 'Form No', value: (row: { formNo: string; name: string }) => row.formNo },
    { header: 'Name', value: (row: { formNo: string; name: string }) => row.name },
  ]

  it('quotes cells that contain commas, quotes or line breaks', () => {
    expect(toCsv(columns, [{ formNo: 'NRI000123', name: 'Sharma, "Rahul"' }])).toBe(
      'Form No,Name\r\nNRI000123,"Sharma, ""Rahul"""',
    )
  })

  it('neutralises cells a spreadsheet would run as a formula', () => {
    expect(toCsv(columns, [{ formNo: '=1+1', name: '@cmd' }])).toBe("Form No,Name\r\n'=1+1,'@cmd")
  })
})

describe('pdf upload rules', () => {
  const form: PdfForm = {
    formNo: 'NRI000095', skRefNo: '1', pan: '', clientName: '', email: '', mobile: '',
    pdfType: 'Signed KYC PDF', cooldown: '', objections: ['Signature mismatch'], remarks: '',
  }

  it('allows resend only for an objected signed-KYC PDF with no cooldown', () => {
    expect(canResend(form)).toBe(true)
    expect(canResend({ ...form, objections: [] })).toBe(false)
    expect(canResend({ ...form, cooldown: '00:14:30' })).toBe(false)
    expect(canResend({ ...form, pdfType: 'PDF With Bank Details' })).toBe(false)
    expect(hasCooldown({ ...form, cooldown: '0' })).toBe(false)
  })

  it('routes the upload by PDF type', () => {
    expect(uploadTarget(form)).toBe('signed')
    expect(uploadTarget({ ...form, pdfType: 'PDF With Bank Details' })).toBe('withBank')
  })
})

describe('liveliness rules', () => {
  const row: LivelinessRow = {
    formNo: 'NRI000099', skRefNo: '1', pan: '', holderType: 'TRD', clientName: '', email: '', mobile: '',
    mailLastSentOn: '', isEmailVerified: false, canSendMail: true,
  }

  it('asks an unverified primary holder to verify their email first', () => {
    expect(notificationFor(row)).toBe('emailVerification')
    expect(notificationFor({ ...row, isEmailVerified: true })).toBe('liveliness')
    expect(notificationFor({ ...row, isEmailVerified: true, canSendMail: false })).toBe('livelinessBlocked')
  })

  it('treats joint holders as verified', () => {
    expect(isVerified({ ...row, holderType: '2ND' })).toBe(true)
    expect(notificationFor({ ...row, holderType: '3RD' })).toBe('liveliness')
  })

  it('groups holders by form with the primary holder first', () => {
    const groups = groupByForm([
      { ...row, formNo: 'NRI000099', holderType: '2ND' },
      { ...row, formNo: 'NRI000098' },
      { ...row, formNo: 'NRI000099' },
    ])
    expect(groups.map((group) => group.formNo)).toEqual(['NRI000098', 'NRI000099'])
    expect(groups[1].holders.map((holder) => holder.holderType)).toEqual(['TRD', '2ND'])
  })
})

describe('account status filters', () => {
  const errors = (filters: Partial<typeof NO_ACCOUNT_FILTERS>) => {
    const result = accountFiltersSchema.safeParse({ ...NO_ACCOUNT_FILTERS, ...filters })
    return result.success ? [] : result.error.issues.map((issue) => issue.path.join('.'))
  }

  it('lets an identifier search run without dates', () => {
    expect(errors({ panNo: 'AAAPL1111C' })).toEqual([])
    expect(errors({})).toEqual([])
  })

  it('needs a complete, ordered date range when searching by form status', () => {
    expect(errors({ formStatusId: '5' })).toEqual(['formRecDateFrom'])
    expect(errors({ formStatusId: '5', formRecDateFrom: '2026-09-01' })).toEqual(['formRecDateTo'])
    expect(errors({ formStatusId: '5', formRecDateFrom: '2026-09-10', formRecDateTo: '2026-09-01' })).toEqual([
      'formRecDateTo',
    ])
    expect(errors({ formStatusId: '5', accountOpenedFromDt: '2026-09-01', accountOpenetToDt: '2026-09-30' })).toEqual([])
  })
})

describe('account report helpers', () => {
  it('builds label / value pairs from a field config', () => {
    expect(pick({ PANNO: 'AAAPL1111C' }, [{ label: 'PAN', key: 'PANNO' }, { label: 'DOB', key: 'DOB' }])).toEqual([
      { label: 'PAN', value: 'AAAPL1111C' },
      { label: 'DOB', value: '' },
    ])
    expect(initials('LATA MOHAN MENON')).toBe('LM')
    expect(initials('')).toBe('')
  })
})

describe('operations mock', () => {
  it('moves a courier from the client list to the HO list, then off both', async () => {
    const [first] = await operationsMock.getCourierForms('client', NO_FILTERS)
    await operationsMock.saveCourier('client', first.formNo)
    expect((await operationsMock.getCourierForms('client', NO_FILTERS)).map((row) => row.formNo)).not.toContain(first.formNo)
    expect((await operationsMock.getCourierForms('ho', NO_FILTERS)).map((row) => row.formNo)).toContain(first.formNo)

    await operationsMock.saveCourier('ho', first.formNo)
    expect((await operationsMock.getCourierForms('ho', NO_FILTERS)).map((row) => row.formNo)).not.toContain(first.formNo)
  }, 20_000)

  it('generates a form number that then appears as available', async () => {
    const { formNo } = await operationsMock.generateFormNumber('5')
    expect(formNo).toMatch(/^NRI\d{6}$/)
    expect(await operationsMock.getAvailableFormNumbers()).toContain(formNo)
  }, 20_000)

  it('finds an account by any identifier', async () => {
    expect(await operationsMock.searchAccounts({ panNo: 'aaapl' })).toHaveLength(1)
    expect(await operationsMock.searchAccounts({ formStatusId: '3' })).toHaveLength(1)
    expect(await operationsMock.searchAccounts({ customerId: '999' })).toEqual([])
  }, 20_000)
})
