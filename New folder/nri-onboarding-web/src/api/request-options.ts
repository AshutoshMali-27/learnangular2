import type { AxiosProgressEvent, AxiosRequestConfig } from 'axios'

declare module 'axios' {
  interface AxiosRequestConfig {
    /** Return the body untouched even when it carries a failure envelope. */
    skipEnvelopeCheck?: boolean
  }
}

export type RequestOptions = Pick<AxiosRequestConfig, 'signal' | 'params' | 'skipEnvelopeCheck'>

export interface UploadOptions extends RequestOptions {
  onProgress?: (percent: number) => void
}

export const toProgressHandler =
  (onProgress?: (percent: number) => void) =>
  ({ loaded, total }: AxiosProgressEvent) => {
    if (onProgress && total) onProgress(Math.round((loaded / total) * 100))
  }
