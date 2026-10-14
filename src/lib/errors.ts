export type ApiErrorKind = 'not_found' | 'network' | 'timeout' | 'server' | 'parse'

export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly status?: number

  constructor(kind: ApiErrorKind, message: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.kind = kind
    this.status = status
  }

  /** Transient failures worth another attempt. */
  get retryable(): boolean {
    if (this.kind === 'network' || this.kind === 'timeout') return true
    if (this.kind === 'server') return this.status === undefined || this.status === 429 || this.status >= 500
    return false
  }
}

export function toApiError(err: unknown): ApiError {
  if (err instanceof ApiError) return err
  return new ApiError('network', 'Something went wrong.')
}

export function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === 'AbortError'
}
