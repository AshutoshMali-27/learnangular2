import { ApiError, type ActionResult } from '@/api'
import type { AuthenticateResponse, CurrentUser, LoginRequest, VerifyOtpRequest } from './types'

// Dev-only stand-in for the Auth controller (VITE_MOCK_SESSION=true): one hard-coded user
// and a fixed OTP, until the backend login is wired. Never bundled into a production build.
export const MOCK_CREDENTIALS = { userName: 'ASHU', password: 'pass@123', otp: '123456' } as const

const MOCK_USER: CurrentUser = {
  empId: '0',
  empName: 'Ashu',
  empCode: 'ASHU',
  branchId: '0',
  branchCode: 'DEV',
  branchTypeCode: 'DEV',
}

const MOBILE = '9876543210'
const SESSION_KEY = 'mock-session'
// Password accepted, OTP still pending. Lives only in memory, like the server's login session.
let otpPending = false

const wait = <T>(value: T, ms = 500) => new Promise<T>((resolve) => setTimeout(() => resolve(value), ms))
const fail = (message: string, ms = 500) =>
  new Promise<never>((_, reject) => setTimeout(() => reject(new ApiError({ message })), ms))

const session = {
  // Kept for the tab, so a refresh stays logged in the way the session cookie would.
  get active() {
    try {
      return sessionStorage.getItem(SESSION_KEY) === 'true'
    } catch {
      return false
    }
  },
  set active(value: boolean) {
    try {
      if (value) sessionStorage.setItem(SESSION_KEY, 'true')
      else sessionStorage.removeItem(SESSION_KEY)
    } catch {
      // Storage unavailable: the login just does not survive a refresh.
    }
  },
}

export const authMock = {
  getCurrentUser: (): Promise<CurrentUser | null> => Promise.resolve(session.active ? MOCK_USER : null),

  login: ({ userName, password }: LoginRequest): Promise<AuthenticateResponse> => {
    if (userName.toUpperCase() !== MOCK_CREDENTIALS.userName || password !== MOCK_CREDENTIALS.password) {
      return fail('Invalid User ID or Password.')
    }
    otpPending = true
    return wait({
      success: true,
      message: 'OTP sent',
      description: 'OTP sent to the registered mobile number.',
      loginid: MOCK_CREDENTIALS.userName,
      mobileno: MOBILE,
    })
  },

  verifyOtp: ({ otp }: VerifyOtpRequest): Promise<ActionResult> => {
    if (!otpPending || otp !== MOCK_CREDENTIALS.otp) return fail('Invalid OTP.')
    otpPending = false
    session.active = true
    return wait({ success: true })
  },

  logout: (): Promise<ActionResult> => {
    session.active = false
    return wait({ success: true }, 200)
  },
}
