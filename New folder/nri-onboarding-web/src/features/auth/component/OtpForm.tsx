import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Smartphone } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { otpSchema, type OtpFormValues } from '../auth.validation'
import { OtpInput } from './OtpInput'

interface OtpFormProps {
  mobileNo: string
  onSubmit: (values: OtpFormValues) => void
  /** Sends a fresh OTP. The countdown restarts once it is called. */
  onResend: () => void
  onBack: () => void
  isPending: boolean
  isResending?: boolean
  error?: string
  /** Dev only: the fixed OTP of the mock login, shown as a hint. */
  hint?: string
}
const OTP_LENGTH = 6
const OTP_VALIDITY_SECONDS = 5 * 60
const maskMobile = (mobileNo: string) => mobileNo.slice(-3).padStart(mobileNo.length, 'X')
const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`

export function OtpForm({ mobileNo, onSubmit, onResend, onBack, isPending, isResending, error, hint }: OtpFormProps) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: '' },
  })
  const [secondsLeft, setSecondsLeft] = useState(OTP_VALIDITY_SECONDS)
  const expired = secondsLeft === 0
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (expired) return
    const timer = setInterval(() => setSecondsLeft((seconds) => Math.max(seconds - 1, 0)), 1000)
    return () => clearInterval(timer)
  }, [expired])

  // A rejected OTP is cleared so the next attempt starts from the first box.
  useEffect(() => {
    if (!error) return
    reset()
    formRef.current?.querySelector('input')?.focus()
  }, [error, reset])

  const submit = handleSubmit(onSubmit)

  const resend = () => {
    reset()
    setSecondsLeft(OTP_VALIDITY_SECONDS)
    onResend()
  }

  return (
    <form ref={formRef} onSubmit={submit} className="grid gap-5" noValidate>
      <div className="flex items-center gap-3 rounded-xl bg-muted p-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
          <Smartphone className="size-5" />
        </span>
        <p className="text-sm text-muted-foreground">
          Enter the 6-digit OTP sent to{' '}
          <span className="font-semibold tracking-wide text-foreground">{maskMobile(mobileNo)}</span>
        </p>
      </div>

      <div className="grid gap-2">
        <Controller
          control={control}
          name="otp"
          render={({ field }) => (
            <OtpInput
              value={field.value}
              onChange={(otp) => {
                field.onChange(otp)
                // The last digit submits the form; no need to press the button.
                if (otp.length === OTP_LENGTH) void submit()
              }}
              length={OTP_LENGTH}
              invalid={!!errors.otp || !!error}
              disabled={isPending || expired}
              autoFocus
            />
          )}
        />
        {errors.otp && <p className="text-sm text-destructive">{errors.otp.message}</p>}
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <p className="text-center text-sm text-muted-foreground" aria-live="polite">
        {expired ? (
          <>
            OTP expired.{' '}
            <button
              type="button"
              className="font-medium text-primary underline-offset-4 hover:underline disabled:opacity-50"
              onClick={resend}
              disabled={isResending}
            >
              Resend OTP
            </button>
          </>
        ) : (
          <>
            Resend in <span className="font-semibold text-foreground tabular-nums">{clock(secondsLeft)}</span>
          </>
        )}
      </p>

      <div className="grid gap-2">
        <Button type="submit" size="lg" className="h-10" disabled={isPending || expired}>
          {isPending ? 'Verifying…' : 'Verify & continue'}
        </Button>
        <Button type="button" variant="ghost" size="lg" className="h-10" onClick={onBack} disabled={isPending}>
          <ArrowLeft />
          Use a different account
        </Button>
      </div>
    </form>
  )
}
