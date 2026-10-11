import { useRef, type ClipboardEvent, type KeyboardEvent } from 'react'
import { cn } from '@/lib/utils'

interface OtpInputProps {
  value: string
  onChange: (value: string) => void
  length?: number
  invalid?: boolean
  disabled?: boolean
  autoFocus?: boolean
}

/** One box per digit: typing advances, Backspace goes back, pasting a full code fills every box. */
export function OtpInput({ value, onChange, length = 6, invalid, disabled, autoFocus }: OtpInputProps) {
  const boxes = useRef<(HTMLInputElement | null)[]>([])
  const focus = (index: number) => boxes.current[Math.min(Math.max(index, 0), length - 1)]?.focus()

  const setDigits = (from: number, digits: string) => {
    const next = (value.slice(0, from) + digits + value.slice(from + digits.length)).slice(0, length)
    onChange(next)
    focus(from + digits.length)
  }

  const onKeyDown = (index: number) => (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace') {
      event.preventDefault()
      // Clear this box, or the previous one when this box is already empty.
      const target = value[index] ? index : index - 1
      if (target >= 0) onChange(value.slice(0, target))
      focus(target)
    } else if (event.key === 'ArrowLeft') {
      focus(index - 1)
    } else if (event.key === 'ArrowRight') {
      focus(index + 1)
    }
  }

  const onPaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault()
    const digits = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (digits) setDigits(0, digits)
  }

  return (
    <div role="group" aria-label="One-time password" className="flex justify-between gap-2">
      {Array.from({ length }, (_, index) => (
        <input
          key={index}
          ref={(element) => {
            boxes.current[index] = element
          }}
          value={value[index] ?? ''}
          onChange={(event) => {
            const digits = event.target.value.replace(/\D/g, '')
            // Digits fill left to right, so typing in a later box lands on the first empty one.
            if (digits.length > 2) setDigits(0, digits.slice(0, length)) // browser autofill of the whole code
            else if (digits) setDigits(Math.min(index, value.length), digits.slice(-1))
          }}
          onKeyDown={onKeyDown(index)}
          onPaste={onPaste}
          onFocus={(event) => event.target.select()}
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          aria-label={`Digit ${index + 1} of ${length}`}
          aria-invalid={invalid}
          disabled={disabled}
          autoFocus={autoFocus && index === 0}
          className={cn(
            'h-12 w-full min-w-0 rounded-lg border border-input bg-transparent text-center text-xl font-semibold tabular-nums transition-colors outline-none',
            'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30',
            'aria-invalid:border-destructive aria-invalid:ring-destructive/20',
            value[index] && 'border-primary/60 bg-primary/5',
          )}
        />
      ))}
    </div>
  )
}
