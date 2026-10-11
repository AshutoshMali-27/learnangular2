import { FileCheck2, Globe, ShieldCheck, type LucideIcon } from 'lucide-react'
import { Navigate, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { getErrorMessage } from '@/api'
import { BrandLogo } from '@/components/shared/BrandLogo'
import { ENV } from '@/config/environment'
import { ThemeSwitcher } from '@/components/shared/ThemeSwitcher'
import { MOCK_CREDENTIALS } from '../auth.mock'
import { LoginForm } from '../component/LoginForm'
import { OtpForm } from '../component/OtpForm'
import { useCurrentUser } from '../hooks/useCurrentUser'
import { useLogin, useVerifyOtp } from '../hooks/useLogin'

const HIGHLIGHTS: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Globe, title: 'Built for NRI clients', text: 'NRE and NRO accounts, FATCA and overseas addresses in one guided journey.' },
  { icon: FileCheck2, title: 'Stage by stage', text: 'Every stage is saved as you go, so a form can be resumed at any time.' },
  { icon: ShieldCheck, title: 'Secure by default', text: 'OTP sign-in and verified PAN, mobile and email on every form.' },
]

const YEAR = new Date().getFullYear()

export default function Login() {
  const location = useLocation()
  const { data: user } = useCurrentUser()
  const login = useLogin()
  const verifyOtp = useVerifyOtp()
  // Resending signs in again with the same credentials; a second mutation keeps the OTP step mounted.
  const resend = useLogin()

  if (user) {
    const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname
    return <Navigate to={from ?? '/'} replace />
  }

  // The credentials step is done once its mutation has data; no separate step state is kept.
  const otpStep = login.data

  return (
    <main className="grid min-h-svh bg-background lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <section className="relative hidden overflow-hidden bg-hero p-12 lg:flex lg:flex-col lg:justify-between xl:p-16">
        <div aria-hidden className="absolute -right-24 -bottom-24 size-96 rounded-full border-[3rem] border-white/5" />
        <div aria-hidden className="absolute top-1/3 -left-16 size-56 rounded-full bg-white/5" />

        <div className="relative flex flex-wrap items-center gap-3">
          <BrandLogo className="px-4 py-2.5 shadow-lg [&_img]:h-7" />
          <span className="border-l border-white/25 pl-3 text-sm font-medium tracking-wide text-white/85">NRI Onboarding</span>
        </div>

        <div className="relative grid max-w-lg gap-8">
          <div className="grid gap-3">
            <span className="h-1 w-14 rounded-full bg-brand" />
            <h1 className="text-4xl leading-tight font-semibold tracking-tight xl:text-5xl">
              Open NRI accounts with confidence.
            </h1>
            <p className="text-base text-white/75">
              One portal for inward, verification, documents and courier tracking.
            </p>
          </div>
          <ul className="grid gap-5">
            {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-white/10 ring-1 ring-white/15">
                  <Icon className="size-5" />
                </span>
                <span className="grid gap-0.5">
                  <span className="font-medium">{title}</span>
                  <span className="text-sm text-white/70">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/55">© {YEAR} · Authorised employees only</p>
      </section>

      <section className="relative flex flex-col">
        <div aria-hidden className="h-1 bg-brand-stripe lg:hidden" />
        <div className="flex items-center justify-between p-4">
          <BrandLogo className="border lg:invisible" />
          <ThemeSwitcher />
        </div>

        <div className="grid flex-1 place-items-center px-4 pb-12 sm:px-8">
          <div className="grid w-full max-w-sm gap-6">
            <div className="grid gap-1.5">
              <h2 className="text-2xl font-semibold tracking-tight">{otpStep ? 'Verify it’s you' : 'Welcome back'}</h2>
              <p className="text-sm text-muted-foreground">
                {otpStep ? 'One more step to keep your session secure.' : 'Sign in with your employee credentials to continue.'}
              </p>
            </div>

            <div className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
              {otpStep ? (
                <OtpForm
                  mobileNo={otpStep.mobileno}
                  onSubmit={(values) => verifyOtp.mutate(values)}
                  onResend={() =>
                    login.variables &&
                    resend.mutate(login.variables, {
                      onSuccess: () => toast.success('A new OTP has been sent.'),
                      onError: (error) => toast.error(getErrorMessage(error)),
                    })
                  }
                  isResending={resend.isPending}
                  hint={import.meta.env.DEV && ENV.MOCK_SESSION ? `Demo OTP: ${MOCK_CREDENTIALS.otp}` : undefined}
                  onBack={() => {
                    verifyOtp.reset()
                    login.reset()
                  }}
                  isPending={verifyOtp.isPending}
                  error={verifyOtp.isError ? getErrorMessage(verifyOtp.error) : undefined}
                />
              ) : (
                <LoginForm
                  onSubmit={(values) => login.mutate(values)}
                  isPending={login.isPending}
                  error={login.isError ? getErrorMessage(login.error) : undefined}
                  hint={
                    import.meta.env.DEV && ENV.MOCK_SESSION
                      ? `Demo login: ${MOCK_CREDENTIALS.userName} / ${MOCK_CREDENTIALS.password}`
                      : undefined
                  }
                />
              )}
            </div>

            <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5" />
              Protected by OTP verification
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
