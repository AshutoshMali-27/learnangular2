import { z } from 'zod'

export const loginSchema = z.object({
  userName: z
    .string()
    .min(1, 'User ID is required')
    .regex(/^[A-Za-z0-9@.]+$/, 'Only letters, digits, @ and . are allowed'),
  password: z.string().min(1, 'Password is required'),
})

export const otpSchema = z.object({
  otp: z.string().regex(/^\d{6}$/, 'Enter the 6-digit OTP'),
})

export type LoginFormValues = z.infer<typeof loginSchema>
export type OtpFormValues = z.infer<typeof otpSchema>
