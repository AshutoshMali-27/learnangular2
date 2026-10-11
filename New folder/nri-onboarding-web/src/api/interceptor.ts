import type { AxiosInstance } from 'axios'
import { readFailure } from './api-response'
import { ApiError, toApiError } from './error'
import { HTTP_STATUS } from './http-status'

const ANTI_FORGERY_HEADER = 'RequestVerificationToken'

let antiForgeryToken: string | null = null
let unauthorizedHandler: (() => void) | null = null

/** Held in memory only; supplied by the session response. */
export const setAntiForgeryToken = (token: string | null) => {
  antiForgeryToken = token
}

/** Registered once by Providers so the api layer stays unaware of routing and auth. */
export const setUnauthorizedHandler = (handler: () => void) => {
  unauthorizedHandler = handler
}

const reject = (error: ApiError) => {
  if (error.status === HTTP_STATUS.UNAUTHORIZED) unauthorizedHandler?.()
  return Promise.reject(error)
}

export function setupInterceptors(instance: AxiosInstance) {
  instance.interceptors.request.use((config) => {
    if (antiForgeryToken) config.headers.set(ANTI_FORGERY_HEADER, antiForgeryToken)
    return config
  })

  instance.interceptors.response.use(
    (response) => {
      const { skipEnvelopeCheck, responseType } = response.config
      if (skipEnvelopeCheck || responseType === 'blob') return response

      const failure = readFailure(response.data)
      if (!failure) return response
      return reject(new ApiError({ ...failure, status: failure.status ?? response.status }))
    },
    (error: unknown) => reject(toApiError(error)),
  )
}
