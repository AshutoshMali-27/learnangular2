import { api } from './axios'
import { toProgressHandler, type RequestOptions, type UploadOptions } from './request-options'

// One helper per request shape the controllers accept (Docs/API/README.md §6).

type FormFields = Record<string, string | number | boolean | null | undefined>

const flatten = (value: unknown, prefix: string, out: URLSearchParams) => {
  if (value == null) return
  if (Array.isArray(value)) {
    value.forEach((item, index) => flatten(item, `${prefix}[${index}]`, out))
  } else if (typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) {
      flatten(item, prefix ? `${prefix}.${key}` : key, out)
    }
  } else {
    out.append(prefix, String(value))
  }
}

const toUrlEncoded = (model: object) => {
  const body = new URLSearchParams()
  flatten(model, '', body)
  return body
}

export const http = {
  get: <T>(url: string, options?: RequestOptions) => api.get<T>(url, options).then((r) => r.data),

  /** JSON object body. */
  postJson: <T>(url: string, body?: unknown, options?: RequestOptions) =>
    api.post<T>(url, body ?? {}, options).then((r) => r.data),

  /** `[FromBody] string` actions: the body is a bare JSON string such as "12345". */
  postRawString: <T>(url: string, value: string, options?: RequestOptions) =>
    api
      .post<T>(url, JSON.stringify(value), {
        ...options,
        headers: { 'Content-Type': 'application/json' },
      })
      .then((r) => r.data),

  /** `application/x-www-form-urlencoded` fields. */
  postForm: <T>(url: string, fields: FormFields, options?: RequestOptions) =>
    api.post<T>(url, toUrlEncoded(fields), options).then((r) => r.data),

  /** `[FromForm] string model` actions: one form field `model` holding the JSON payload. */
  postModel: <T>(url: string, model: unknown, options?: RequestOptions) => {
    const body = new FormData()
    body.append('model', JSON.stringify(model))
    return api.post<T>(url, body, options).then((r) => r.data)
  },

  /** `[FromForm]` complex models bound by indexed keys such as `BankDetails[0].AccountNumber`. */
  postIndexedForm: <T>(url: string, model: object, options?: RequestOptions) =>
    api.post<T>(url, toUrlEncoded(model), options).then((r) => r.data),

  /** `multipart/form-data` file upload with real progress. */
  upload: <T>(
    url: string,
    file: { field: string; blob: Blob; name?: string },
    fields: Record<string, string> = {},
    { onProgress, ...options }: UploadOptions = {},
  ) => {
    const body = new FormData()
    for (const [key, value] of Object.entries(fields)) body.append(key, value)
    if (file.name) body.append(file.field, file.blob, file.name)
    else body.append(file.field, file.blob)
    return api
      .post<T>(url, body, { ...options, onUploadProgress: toProgressHandler(onProgress) })
      .then((r) => r.data)
  },

  getBlob: (url: string, options?: RequestOptions) =>
    api.get<Blob>(url, { ...options, responseType: 'blob' }).then((r) => r.data),
}
