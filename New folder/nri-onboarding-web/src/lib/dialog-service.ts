// Promise-based replacement for SweetAlert: `await confirm({...})` / `await alertDialog({...})`
// from any handler or mutation callback. Rendered once by <DialogHost />.

export type DialogTone = 'default' | 'success' | 'warning' | 'destructive'

export interface DialogOptions {
  title: string
  description?: string
  tone?: DialogTone
  confirmText?: string
  cancelText?: string
}

export interface DialogRequest extends DialogOptions {
  kind: 'alert' | 'confirm'
  resolve: (confirmed: boolean) => void
}

let current: DialogRequest | null = null
const listeners = new Set<() => void>()

const emit = () => listeners.forEach((listener) => listener())

const open = (kind: DialogRequest['kind'], options: DialogOptions) =>
  new Promise<boolean>((resolve) => {
    current?.resolve(false)
    current = { ...options, kind, resolve }
    emit()
  })

export const dialogStore = {
  subscribe: (listener: () => void) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  getSnapshot: () => current,
  settle: (confirmed: boolean) => {
    current?.resolve(confirmed)
    current = null
    emit()
  },
}

/** Resolves true when the user confirms, false when they cancel or dismiss. */
export const confirm = (options: DialogOptions) => open('confirm', options)

/** Resolves once the user acknowledges the message. */
export const alertDialog = (options: DialogOptions) => open('alert', options).then(() => undefined)
