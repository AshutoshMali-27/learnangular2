import { toast } from 'sonner'
import type { UploadedFile, UploadHandler } from '@/components/shared/file-upload/FileUpload'
import { journeyService, type UploadKind } from './services'
import type { Journey } from './types'

/** `onUpload` for a <FileUpload /> inside a journey stage. */
export const uploadHandler =
  (kind: UploadKind, journey: Journey): UploadHandler =>
  (file, fileName, { onProgress }) =>
    journeyService.uploadDocument(kind, journey, file, fileName, onProgress)

/** `onView` for a <FileUpload />. UI phase: the real version opens the GetDocument blob in a new tab. */
export const viewDocument = (file: UploadedFile) => toast.info(`Would open ${file.fileName}`)

/** Zod-free shape check used by stage schemas for an uploaded file value. */
export const hasFile = (file: UploadedFile | null | undefined): file is UploadedFile => !!file?.filePath
