import { useSyncExternalStore } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { dialogStore } from '@/lib/dialog-service'

export function DialogHost() {
  const request = useSyncExternalStore(dialogStore.subscribe, dialogStore.getSnapshot)

  return (
    <AlertDialog open={request !== null} onOpenChange={(open) => !open && dialogStore.settle(false)}>
      {request && (
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{request.title}</AlertDialogTitle>
            {request.description && (
              <AlertDialogDescription className="whitespace-pre-line">
                {request.description}
              </AlertDialogDescription>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            {request.kind === 'confirm' && (
              <AlertDialogCancel onClick={() => dialogStore.settle(false)}>
                {request.cancelText ?? 'Cancel'}
              </AlertDialogCancel>
            )}
            <AlertDialogAction
              variant={request.tone === 'destructive' ? 'destructive' : 'default'}
              onClick={() => dialogStore.settle(true)}
            >
              {request.confirmText ?? (request.kind === 'confirm' ? 'Confirm' : 'OK')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      )}
    </AlertDialog>
  )
}
