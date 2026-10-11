import { describe, expect, it } from 'vitest'
import { journeyMock } from '@/features/journey/journey.mock'
import type { AddressRequest } from '@/features/journey/stages/address/types'
import type { FormInwardPayload } from '@/features/journey/stages/inward/types'
import { hasObjections, stageObjections } from './hooks/useObjections'
import { objectionService } from './services'
import type { ObjectionFilters } from './types'

const NO_FILTERS: ObjectionFilters = { formNo: '', pan: '', mobile: '', email: '', fromDate: '', toDate: '' }
const FORM_NO = 'NRI000127'

const inward = {
  formNo: FORM_NO,
  panNo: 'EFGPK5678L',
  nameAsPerPan: 'MOHAMMED IMRAN KHAN',
  nrePis: 'Y', nreNonPis: 'N', nroPis: 'N', nroNonPis: 'Y',
  eqFlag: 'Y', mfFlag: 'Y', fnoFlag: 'N',
  emailId: 'imran@example.com',
  mobileNo: '9876500009',
} as FormInwardPayload

describe('objection helpers', () => {
  it('treats a remark or any objection as raised', () => {
    expect(hasObjections({ remarks: '', objections: [] })).toBe(false)
    expect(hasObjections({ remarks: 'Check', objections: [] })).toBe(true)
    expect(hasObjections({ remarks: '', objections: [{ id: '1', text: 'x' }] })).toBe(true)
    expect(stageObjections(undefined, 3)).toEqual({ remarks: '', objections: [] })
  })
})

describe('objection flow against the mock backend', () => {
  it('lists a form once Inward and Address are saved, and clears it as objections are closed', async () => {
    await journeyMock.saveInward(inward)
    expect(await objectionService.getForms(NO_FILTERS)).toEqual([])

    await journeyMock.saveAddress(FORM_NO, {} as AddressRequest)
    const [row] = await objectionService.getForms(NO_FILTERS)
    expect(row).toMatchObject({
      formNo: FORM_NO,
      pan: 'EFGPK5678L',
      clientName: 'MOHAMMED IMRAN KHAN',
      nriType: 'NRE PIS, NRO NONPIS',
      products: 'Equity, MF',
    })
    expect(await objectionService.getForms({ ...NO_FILTERS, pan: 'ZZZ' })).toEqual([])
    expect(await objectionService.getForms({ ...NO_FILTERS, formNo: 'nri000127' })).toHaveLength(1)

    const raised = await objectionService.getObjections(FORM_NO, row.skRefNo)
    expect(raised[1].objections).toHaveLength(2)
    expect(raised[2].objections).toHaveLength(1)

    for (const stage of Object.values(raised)) {
      for (const objection of stage.objections) {
        await objectionService.closeObjection(FORM_NO, row.skRefNo, objection.id)
      }
    }
    const closed = await objectionService.getObjections(FORM_NO, row.skRefNo)
    expect(Object.values(closed).some(hasObjections)).toBe(false)
    expect(await objectionService.getForms(NO_FILTERS)).toEqual([])
  }, 20_000)
})
