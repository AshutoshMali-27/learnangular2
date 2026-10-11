export interface LoginRequest {
  userName: string
  password: string
}

/** `Auth/Authenticateuser` success body (Docs/API/AuthController.md §5). */
export interface AuthenticateResponse {
  success: true
  message: string
  description: string
  loginid: string
  mobileno: string
}

export interface VerifyOtpRequest {
  otp: string
}

/** The employee behind the session cookie. Source of empId / branchId for every stage payload. */
export interface CurrentUser {
  empId: string
  empName: string
  empCode: string
  branchId: string
  branchCode: string
  branchTypeCode: string
}

/**
 * `Auth/session` contract (pending backend). Answers for anonymous callers too, with `user: null`,
 * because the login POST already needs the anti-forgery token.
 */
export interface SessionResponse {
  antiForgeryToken: string | null
  user: CurrentUser | null
}
