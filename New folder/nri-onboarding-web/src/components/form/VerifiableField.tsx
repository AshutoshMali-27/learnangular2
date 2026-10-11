import { useMutation } from '@tanstack/react-query'
import { CircleCheck, CircleX, Loader2 } from 'lucide-react'
import { useFormContext, useWatch } from 'react-hook-form'
import { getErrorMessage } from '@/api'
import { Button } from '@/components/ui/button'
import { TextField, type TextFieldProps } from './TextField'

export type VerifyStatus = 'idle' | 'valid' | 'invalid'

export interface VerifyResult<TData = unknown> {
  valid: boolean
  message?: string
  /** Anything the check returned that the caller needs (PAN name and DOB, bank name…). */
  data?: TData
}

export interface VerifiableFieldProps<TData = unknown> extends Omit<TextFieldProps, 'onValueChange'> {
  /** Form path that stores the VerifyStatus, so the schema can require `'valid'`. */
  statusName: string
  /** Server check. Resolve `{ valid, message }`; a thrown error also marks the field invalid. */
  onVerify: (value: string) => Promise<VerifyResult<TData>>
  /** Local format check that enables the Validate button. */
  canVerify?: (value: string) => boolean
  onVerified?: (value: string, data: TData | undefined) => void
  onReset?: () => void
  /** Hide Reset when the value must stay locked (objection mode). */
  resettable?: boolean
}

/**
 * Input with the Validate / Reset pair used across the journey (PAN, email, mobile, lead,
 * sales code, TIN, bank account). A verified or rejected value is locked until Reset.
 */
export function VerifiableField<TData = unknown>({
  name,
  statusName,
  onVerify,
  canVerify = (value) => value.trim().length > 0,
  onVerified,
  onReset,
  resettable = true,
  disabled,
  description,
  ...fieldProps
}: VerifiableFieldProps<TData>) {
  const { setValue, setError, clearErrors, getValues, getFieldState, formState } = useFormContext()
  const status: VerifyStatus = useWatch({ name: statusName }) ?? 'idle'
  const value: string = useWatch({ name }) ?? ''

  const setStatus = (next: VerifyStatus) =>
    setValue(statusName, next, { shouldValidate: next === 'valid', shouldDirty: true })

  const verify = useMutation({
    mutationFn: onVerify,
    onSuccess: ({ valid, message, data }, verifiedValue) => {
      if (valid) {
        clearErrors(name)
        setStatus('valid')
        onVerified?.(verifiedValue, data)
      } else {
        setStatus('invalid')
        setError(name, { type: 'verify', message: message ?? 'Validation failed.' })
      }
    },
    onError: (error) => {
      setStatus('invalid')
      setError(name, { type: 'verify', message: getErrorMessage(error) })
    },
  })

  const reset = () => {
    verify.reset()
    setValue(name, '', { shouldDirty: true })
    clearErrors([name, statusName])
    setStatus('idle')
    onReset?.()
  }

  const locked = status !== 'idle' || verify.isPending

  // "Not verified yet" comes from the schema as an error on the status path.
  const statusError = getFieldState(statusName, formState).error?.message
  const valueError = getFieldState(name, formState).error

  return (
    <div className="grid gap-1.5">
      <div className="flex items-start gap-2">
      <TextField
        {...fieldProps}
        name={name}
        className="min-w-0 flex-1"
        disabled={disabled}
        readOnly={locked}
        description={status === 'valid' ? 'Verified' : description}
      />
      {/* Offset by the label height so the buttons line up with the input. */}
      <div className="flex gap-2 pt-[1.375rem]">
        <Button
          type="button"
          variant={status === 'invalid' ? 'destructive' : status === 'valid' ? 'secondary' : 'default'}
          disabled={disabled || locked || !canVerify(value)}
          onClick={() => verify.mutate(getValues(name))}
        >
          {verify.isPending ? (
            <Loader2 className="animate-spin" />
          ) : status === 'valid' ? (
            <CircleCheck />
          ) : status === 'invalid' ? (
            <CircleX />
          ) : null}
          {status === 'valid' ? 'Verified' : status === 'invalid' ? 'Failed' : 'Validate'}
        </Button>
        {resettable && (
          <Button
            type="button"
            variant="outline"
            disabled={disabled || verify.isPending || (status === 'idle' && !value)}
            onClick={reset}
          >
            Reset
          </Button>
        )}
      </div>
      </div>
      {statusError && !valueError && (
        <p role="alert" className="text-xs text-destructive">
          {statusError}
        </p>
      )}
    </div>
  )
}
