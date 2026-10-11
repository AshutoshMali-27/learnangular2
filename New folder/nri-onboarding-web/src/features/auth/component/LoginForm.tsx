import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, LockKeyhole, UserRound } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { loginSchema, type LoginFormValues } from '../auth.validation'

interface LoginFormProps {
  onSubmit: (values: LoginFormValues) => void
  isPending: boolean
  error?: string
  /** Dev only: the credentials of the mock login, shown as a hint. */
  hint?: string
}

const ICON = 'pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground'

export function LoginForm({ onSubmit, isPending, error, hint }: LoginFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { userName: '', password: '' },
  })
  const [showPassword, setShowPassword] = useState(false)
  const [capsLock, setCapsLock] = useState(false)

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
      <div className="grid gap-2">
        <Label htmlFor="userName">User ID</Label>
        <div className="relative">
          <UserRound className={ICON} />
          <Input
            id="userName"
            className="h-10 pl-9"
            placeholder="Enter your user ID"
            autoComplete="username"
            autoFocus
            aria-invalid={!!errors.userName}
            {...register('userName')}
          />
        </div>
        {errors.userName && <p className="text-sm text-destructive">{errors.userName.message}</p>}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <LockKeyhole className={ICON} />
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            className="h-10 px-9"
            placeholder="Enter your password"
            autoComplete="current-password"
            aria-invalid={!!errors.password}
            onKeyUp={(event) => setCapsLock(event.getModifierState('CapsLock'))}
            {...register('password')}
          />
          <button
            type="button"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
            onClick={() => setShowPassword((shown) => !shown)}
            className="absolute top-1/2 right-1.5 grid size-7 -translate-y-1/2 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
        {capsLock && <p className="text-xs font-medium text-warning">Caps Lock is on</p>}
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" className="mt-1 h-10" disabled={isPending}>
        {isPending ? 'Logging in…' : 'Login'}
      </Button>
      {hint && <p className="text-center text-xs text-muted-foreground">{hint}</p>}
    </form>
  )
}
