import { http, setAntiForgeryToken, type ActionResult } from '@/api'
import { ENV } from '@/config/environment'
import { AUTH_ENDPOINTS } from './auth.endpoints'
import { authMock } from './auth.mock'
import type {
  AuthenticateResponse,
  CurrentUser,
  LoginRequest,
  SessionResponse,
  VerifyOtpRequest,
} from './types'

const api = {
  /** Returns null when nobody is logged in. Also refreshes the in-memory anti-forgery token. */
  getCurrentUser: async (): Promise<CurrentUser | null> => {
    const session = await http.get<SessionResponse>(AUTH_ENDPOINTS.SESSION)
    setAntiForgeryToken(session.antiForgeryToken)
    return session.user
  },

  /** Validates the credentials and sends the OTP to the registered mobile. */
  login: ({ userName, password }: LoginRequest) =>
    http.postForm<AuthenticateResponse>(AUTH_ENDPOINTS.AUTHENTICATE_USER, {
      username: userName,
      password,
    }),

  /** On success the backend populates the employee session. */
  verifyOtp: ({ otp }: VerifyOtpRequest) =>
    http.postJson<ActionResult>(AUTH_ENDPOINTS.VERIFY_OTP, { OTPToCheck: otp }),

  logout: () => http.postJson<ActionResult>(AUTH_ENDPOINTS.LOGOUT),
}

// Dev with VITE_MOCK_SESSION=true signs in against the hard-coded user in auth.mock.ts.
// The literal DEV check lets the production build drop the mock and its credentials.
export const authService: typeof api = import.meta.env.DEV && ENV.MOCK_SESSION ? authMock : api
