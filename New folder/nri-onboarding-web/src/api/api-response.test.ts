import { describe, expect, it } from 'vitest'
import { readFailure } from './api-response'

describe('readFailure', () => {
  it('treats arrays and success bodies as success', () => {
    expect(readFailure([{ country_id: 1 }])).toBeNull()
    expect(readFailure({ success: true, message: 'ok' })).toBeNull()
    expect(readFailure({ Message: 'Success', Data: {} })).toBeNull()
    expect(readFailure({ isValid: false, description: 'PAN not found' })).toBeNull()
  })

  it('reads the controller failure envelope returned with HTTP 200', () => {
    expect(
      readFailure({ success: false, message: 'Failed to fetch', status: 401 }),
    ).toEqual({ message: 'Failed to fetch', description: undefined, status: 401 })
    expect(readFailure({ success: false, message: 'OTP failed', details: 'raw' })).toMatchObject({
      description: 'raw',
    })
  })

  it('reads the downstream failure envelope', () => {
    expect(readFailure({ Message: 'Failure', Data: null, Description: 'Reason' })).toEqual({
      message: 'Reason',
    })
  })

  it('reads ASP.NET validation problems', () => {
    expect(
      readFailure({ title: 'One or more validation errors occurred.', status: 400, errors: { Pan: ['Required'] } }),
    ).toEqual({
      message: 'One or more validation errors occurred.',
      status: 400,
      fieldErrors: { Pan: ['Required'] },
    })
  })
})
