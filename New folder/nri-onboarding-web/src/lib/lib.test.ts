import { describe, expect, it } from 'vitest'
import { addressSchema, EMPTY_ADDRESS } from '@/components/shared/address/address.schema'
import { joinName, splitFullName } from './names'
import { filters, isValidEmail, isValidPan } from './validators'

describe('validators', () => {
  it('accepts only individual PANs', () => {
    expect(isValidPan('ABCPE1234F')).toBe(true)
    expect(isValidPan('ABCCE1234F')).toBe(false)
    expect(isValidPan('abcpe1234f')).toBe(false)
  })

  it('blocks company email domains', () => {
    expect(isValidEmail('client@example.com')).toBe(true)
    expect(isValidEmail('staff@Sharekhan.com')).toBe(false)
    expect(isValidEmail('staff@miraeassetcm.com')).toBe(false)
    expect(isValidEmail('not-an-email')).toBe(false)
  })

  it('filters typed input', () => {
    expect(filters.upperAlnum('abc-pe 1234f')).toBe('ABCPE1234F')
    expect(filters.digits('98a76-5')).toBe('98765')
    expect(filters.personName(' Rahul  K9umar')).toBe('Rahul Kumar')
  })
})

describe('names', () => {
  it('splits the NSDL name as the Inward stage did', () => {
    expect(splitFullName('RAHUL')).toEqual({ firstName: 'RAHUL', middleName: '', lastName: '' })
    expect(splitFullName('RAHUL SHARMA')).toEqual({ firstName: 'RAHUL', middleName: '', lastName: 'SHARMA' })
    expect(splitFullName('RAHUL KUMAR SINGH SHARMA')).toEqual({
      firstName: 'RAHUL',
      middleName: 'KUMAR SINGH',
      lastName: 'SHARMA',
    })
  })

  it('joins name parts with single spaces', () => {
    expect(joinName('Rahul', '', ' Sharma ')).toBe('Rahul Sharma')
  })
})

describe('addressSchema', () => {
  const india = { ...EMPTY_ADDRESS, line1: '12 MG Road', countryId: '2', stateId: '201', cityId: '20101' }

  it('requires a valid pincode for India', () => {
    expect(addressSchema.safeParse({ ...india, pincode: '400001' }).success).toBe(true)
    expect(addressSchema.safeParse({ ...india, pincode: '012345' }).success).toBe(false)
  })

  it('requires the fixed pincode outside India', () => {
    const foreign = { ...india, countryId: '10' }
    expect(addressSchema.safeParse({ ...foreign, pincode: '111111' }).success).toBe(true)
    expect(addressSchema.safeParse({ ...foreign, pincode: '400001' }).success).toBe(false)
  })

  it('rejects a digits-only or too-short first line', () => {
    expect(addressSchema.safeParse({ ...india, pincode: '400001', line1: '12345' }).success).toBe(false)
    expect(addressSchema.safeParse({ ...india, pincode: '400001', line1: 'ab' }).success).toBe(false)
  })
})
