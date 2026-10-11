import type { ReactNode } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface RecordDialogProps {
  open: boolean
  title: string
  description?: string
  /** Closing discards whatever was typed; nothing is added until the editor's Save. */
  onClose: () => void
  children: ReactNode
}

/** Large dialog that hosts the editor for one record of a multi-record stage. */
export function RecordDialog({ open, title, description, onClose, children }: RecordDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        className="max-h-[90svh] overflow-y-auto sm:max-w-5xl"
        // A stray click outside must not throw away a half-filled record.
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description ?? 'Nothing is added until you save this record.'}</DialogDescription>
        </DialogHeader>
        {open && children}
      </DialogContent>
    </Dialog>
  )
}
