// Response envelopes returned by the MVC controllers (Docs/API/README.md §4–6).
// Many actions answer HTTP 200 with a failure body, so status alone is not enough.

export interface ActionResult {
  success: boolean
  message?: string
  description?: string
  details?: string
  status?: number
}

export interface ServiceEnvelope<T = unknown> {
  Message: string
  Data: T
  Description?: string
}

export interface Failure {
  message: string
  description?: string
  status?: number
  fieldErrors?: Record<string, string[]>
}

type UnknownRecord = Record<string, unknown>

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const text = (value: unknown) => (typeof value === 'string' && value ? value : undefined)

const statusOf = (body: UnknownRecord) => (typeof body.status === 'number' ? body.status : undefined)

/** Returns the failure carried by a response body, or null when the body is a success. */
export function readFailure(body: unknown): Failure | null {
  if (!isRecord(body)) return null

  // ASP.NET model validation (HTTP 400).
  if (isRecord(body.errors) && typeof body.title === 'string') {
    return {
      message: body.title,
      status: statusOf(body),
      fieldErrors: body.errors as Record<string, string[]>,
    }
  }

  if (body.success === false) {
    return {
      message: text(body.message) ?? 'Request failed.',
      description: text(body.description) ?? text(body.details),
      status: statusOf(body),
    }
  }

  if (body.Message === 'Failure') {
    return { message: text(body.Description) ?? 'Request failed.' }
  }

  return null
}
