import type { ReactNode } from 'react'

export interface Option<TMeta = unknown> {
  value: string
  label: string
  disabled?: boolean
  meta?: TMeta
}

/** Props shared by every form-bound field. `name` is a React Hook Form path. */
export interface BaseFieldProps {
  name: string
  label?: ReactNode
  required?: boolean
  description?: ReactNode
  disabled?: boolean
  className?: string
}
