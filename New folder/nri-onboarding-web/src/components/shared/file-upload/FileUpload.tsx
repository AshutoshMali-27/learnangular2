import { useMutation } from '@tanstack/react-query'
import { FileText, Upload, X } from 'lucide-react'
import { useId, useState, type DragEvent } from 'react'
import { useController } from 'react-hook-form'
import { getErrorMessage } from '@/api'
import { FieldShell } from '@/components/form'
import type { BaseFieldProps } from '@/components/form'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { CropDialog } from './CropDialog'

export interface UploadedFile {
  /** Relative path returned by the upload API; this is what the save payload carries. */
  filePath: string
  fileName: string
}

export type UploadHandler = (
  file: Blob,
  fileName: string,
  options: { onProgress: (percent: number) => void },
) => Promise<UploadedFile>

export interface FileUploadProps extends BaseFieldProps {
  /** Uploads immediately on pick (as the MVC pages did) and resolves the stored path. */
  onUpload: UploadHandler
  /** Opens the stored file, usually through a GetDocument blob. */
  onView?: (file: UploadedFile) => void
  accept?: string[]
  maxSizeMb?: number
  /** Send picked images through the crop dialog first. */
  crop?: boolean
}

const DEFAULT_ACCEPT = ['.pdf', '.jpg', '.jpeg', '.png']
const extensionOf = (fileName: string) => fileName.slice(fileName.lastIndexOf('.')).toLowerCase()
const toJpegName = (fileName: string) => fileName.replace(/\.[^.]+$/, '') + '.jpg'

/**
 * Drag-and-drop file field bound to an `UploadedFile | null` form value. Checks type and
 * size, optionally crops images, uploads with real progress, then shows View / Remove.
 */
export function FileUpload({
  name,
  label,
  required,
  description,
  disabled,
  className,
  onUpload,
  onView,
  accept = DEFAULT_ACCEPT,
  maxSizeMb = 5,
  crop = true,
}: FileUploadProps) {
  const id = useId()
  const { field, fieldState } = useController({ name })
  const value: UploadedFile | null = field.value ?? null
  const [progress, setProgress] = useState(0)
  const [rejection, setRejection] = useState<string>()
  const [pendingCrop, setPendingCrop] = useState<{ src: string; fileName: string } | null>(null)
  const [dragging, setDragging] = useState(false)

  const upload = useMutation({
    mutationFn: ({ file, fileName }: { file: Blob; fileName: string }) =>
      onUpload(file, fileName, { onProgress: setProgress }),
    onMutate: () => setProgress(0),
    onSuccess: (uploaded) => field.onChange(uploaded),
  })

  const closeCrop = () => {
    if (pendingCrop) URL.revokeObjectURL(pendingCrop.src)
    setPendingCrop(null)
  }

  const pick = (file: File | undefined) => {
    if (!file) return
    upload.reset()
    if (!accept.includes(extensionOf(file.name))) {
      return setRejection(`Allowed file types: ${accept.join(', ')}`)
    }
    if (file.size > maxSizeMb * 1024 * 1024) {
      return setRejection(`File must be ${maxSizeMb} MB or smaller`)
    }
    setRejection(undefined)
    if (crop && file.type.startsWith('image/')) {
      setPendingCrop({ src: URL.createObjectURL(file), fileName: toJpegName(file.name) })
    } else {
      upload.mutate({ file, fileName: file.name })
    }
  }

  const handleDrop = (event: DragEvent) => {
    event.preventDefault()
    setDragging(false)
    if (!disabled) pick(event.dataTransfer.files[0])
  }

  const error =
    rejection ?? (upload.isError ? getErrorMessage(upload.error) : fieldState.error?.message)

  return (
    <FieldShell
      id={id}
      label={label}
      required={required}
      description={description ?? `${accept.join(', ')} up to ${maxSizeMb} MB`}
      error={error}
      className={className}
    >
      {value ? (
        <div className="flex items-center gap-3 rounded-md border p-3">
          <FileText className="size-5 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1 truncate text-sm">{value.fileName}</span>
          {onView && (
            <Button type="button" variant="outline" size="sm" onClick={() => onView(value)}>
              View
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Remove ${value.fileName}`}
            disabled={disabled}
            onClick={() => field.onChange(null)}
          >
            <X />
          </Button>
        </div>
      ) : upload.isPending ? (
        <div className="grid gap-2 rounded-md border p-3">
          <span className="text-sm text-muted-foreground">Uploading… {progress}%</span>
          <Progress value={progress} aria-label="Upload progress" />
        </div>
      ) : (
        <label
          htmlFor={id}
          onDragOver={(event) => {
            event.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={cn(
            'flex cursor-pointer flex-col items-center gap-1 rounded-md border border-dashed p-5 text-center text-sm text-muted-foreground',
            'hover:bg-muted/50 has-focus-visible:ring-2 has-focus-visible:ring-ring',
            dragging && 'border-primary bg-muted/50',
            fieldState.invalid && 'border-destructive',
            disabled && 'pointer-events-none opacity-50',
          )}
        >
          <Upload className="size-5" />
          <span>
            <span className="font-medium text-foreground">Choose a file</span> or drag it here
          </span>
          <input
            id={id}
            ref={field.ref}
            type="file"
            className="sr-only"
            accept={accept.join(',')}
            disabled={disabled}
            onBlur={field.onBlur}
            onChange={(event) => {
              pick(event.target.files?.[0])
              event.target.value = ''
            }}
          />
        </label>
      )}

      {pendingCrop && (
        <CropDialog
          src={pendingCrop.src}
          onCancel={closeCrop}
          onCropped={(image) => {
            upload.mutate({ file: image, fileName: pendingCrop.fileName })
            closeCrop()
          }}
        />
      )}
    </FieldShell>
  )
}
