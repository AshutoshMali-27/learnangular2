import { isAxiosError } from 'axios'
import { readFailure, type Failure } from './api-response'

export class ApiError extends Error {
  status?: number
  description?: string
  fieldErrors?: Record<string, string[]>

  constructor(failure: Failure) {
    super(failure.message)
    this.name = 'ApiError'
    this.status = failure.status
    this.description = failure.description
    this.fieldErrors = failure.fieldErrors
  }

  /** Text to show the user: the specific reason when the server gave one. */
  get displayMessage() {
    return this.description ?? this.message
  }
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error

  if (isAxiosError(error)) {
    const status = error.response?.status
    const failure = readFailure(error.response?.data)
    if (failure) return new ApiError({ ...failure, status: failure.status ?? status })
    if (!error.response) {
      return new ApiError({ message: 'Unable to reach the server. Check your connection.' })
    }
    return new ApiError({ message: error.message, status })
  }

  return new ApiError({ message: error instanceof Error ? error.message : 'Unexpected error.' })
}

export const getErrorMessage = (error: unknown) => toApiError(error).displayMessage
