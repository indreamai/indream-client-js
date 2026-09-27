import { APIError, createApiError } from './errors'
import { AssetsResource } from './resources/assets'
import { ExportsResource } from './resources/exports'
import { EditorResource } from './resources/editor'
import { IllustrationsResource } from './resources/illustrations'
import { ProjectsResource } from './resources/projects'
import { UploadsResource } from './resources/uploads'
import { parseRetryAfter, shouldRetryStatus, withRetry } from './retry'
import { isValidResponse } from './response-validation'
import type { IApiEnvelope, IClientOptions } from './types'

interface IRequestInit {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  headers?: Record<string, string>
  idempotencyKey?: string
  signal?: AbortSignal
  skipRetry?: boolean
}

const isBodyInit = (value: unknown): value is BodyInit => {
  if (typeof value === 'string') return true
  if (value instanceof URLSearchParams) return true
  if (value instanceof ArrayBuffer || ArrayBuffer.isView(value)) return true
  if (typeof Blob !== 'undefined' && value instanceof Blob) return true
  if (typeof FormData !== 'undefined' && value instanceof FormData) return true
  return typeof ReadableStream !== 'undefined' && value instanceof ReadableStream
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

export class IndreamClient {
  readonly apiKey: string
  readonly baseURL: string
  readonly timeout: number
  readonly maxRetries: number
  readonly pollIntervalMs: number
  readonly fetchImpl: typeof fetch
  readonly exports: ExportsResource
  readonly editor: EditorResource
  readonly illustrations: IllustrationsResource
  readonly projects: ProjectsResource
  readonly uploads: UploadsResource
  readonly assets: AssetsResource

  constructor(options: IClientOptions) {
    if (!options.apiKey?.trim()) throw new Error('apiKey is required')
    this.apiKey = options.apiKey.trim()
    this.baseURL = (options.baseURL || 'https://api.indream.ai').replace(/\/$/, '')
    this.timeout = options.timeout ?? 60_000
    this.maxRetries = options.maxRetries ?? 2
    this.pollIntervalMs = options.pollIntervalMs ?? 2000
    if (!Number.isFinite(this.timeout) || this.timeout <= 0)
      throw new RangeError('timeout must be positive')
    if (!Number.isInteger(this.maxRetries) || this.maxRetries < 0)
      throw new RangeError('maxRetries must be a nonnegative integer')
    if (!Number.isFinite(this.pollIntervalMs) || this.pollIntervalMs <= 0)
      throw new RangeError('pollIntervalMs must be positive')
    this.fetchImpl = options.fetch || fetch
    this.exports = new ExportsResource(this)
    this.editor = new EditorResource(this)
    this.illustrations = new IllustrationsResource(this)
    this.projects = new ProjectsResource(this)
    this.uploads = new UploadsResource(this)
    this.assets = new AssetsResource(this)
  }

  async request<T>(path: string, init: IRequestInit): Promise<T> {
    return (await this.requestEnvelope<T>(path, init)).data
  }

  async requestEnvelope<T>(path: string, init: IRequestInit): Promise<IApiEnvelope<T>> {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    const isJsonPayload = init.body !== undefined && !isBodyInit(init.body)
    const payload =
      init.body === undefined
        ? undefined
        : isJsonPayload
          ? JSON.stringify(init.body)
          : (init.body as BodyInit)
    const idempotencyKey = init.idempotencyKey?.trim()
    const clientTaskId =
      isRecord(init.body) && typeof init.body.clientTaskId === 'string'
        ? init.body.clientTaskId.trim()
        : ''
    // Only exports have the documented clientTaskId deduplication contract.
    const retryableRequest =
      !init.skipRetry &&
      (init.method === 'GET' ||
        (init.method === 'POST' &&
          /^\/v1\/(?:exports|projects\/[^/]+\/exports)$/.test(normalizedPath) &&
          Boolean(idempotencyKey || clientTaskId)))

    const headers = new Headers(init.headers)
    headers.set('Authorization', `Bearer ${this.apiKey}`)
    headers.set('Accept', 'application/json')
    if (isJsonPayload) headers.set('Content-Type', 'application/json')
    if (idempotencyKey) headers.set('Idempotency-Key', idempotencyKey)

    const execute = async (): Promise<IApiEnvelope<T>> => {
      init.signal?.throwIfAborted()
      const controller = new AbortController()
      let timedOut = false
      const timeoutId = setTimeout(() => {
        timedOut = true
        controller.abort()
      }, this.timeout)
      const onExternalAbort = () => controller.abort(init.signal?.reason)
      init.signal?.addEventListener('abort', onExternalAbort, { once: true })
      const requestInit: RequestInit & { duplex?: 'half' } = {
        method: init.method,
        body: payload,
        headers,
        signal: controller.signal,
      }
      if (typeof ReadableStream !== 'undefined' && payload instanceof ReadableStream)
        requestInit.duplex = 'half'
      try {
        const response = await this.fetchImpl(this.baseURL + normalizedPath, requestInit)
        const text = await response.text()
        let parsed: unknown
        try {
          parsed = text ? JSON.parse(text) : null
        } catch {
          throw createApiError(response.status, null)
        }
        if (!response.ok)
          throw createApiError(
            response.status,
            parsed,
            parseRetryAfter(response.headers.get('Retry-After'))
          )
        if (!isRecord(parsed) || !('data' in parsed) || !isRecord(parsed.meta)) {
          throw createApiError(response.status, null)
        }
        if (!isValidResponse(init.method, normalizedPath, parsed)) {
          throw createApiError(response.status, null)
        }
        return parsed as unknown as IApiEnvelope<T>
      } catch (error) {
        if (init.signal?.aborted)
          throw init.signal.reason ?? new DOMException('Request aborted', 'AbortError')
        if (timedOut) throw new DOMException('Request timed out', 'TimeoutError')
        throw error
      } finally {
        clearTimeout(timeoutId)
        init.signal?.removeEventListener('abort', onExternalAbort)
      }
    }

    return withRetry(execute, {
      maxRetries: retryableRequest ? this.maxRetries : 0,
      signal: init.signal,
      shouldRetry: (error) => {
        if (error instanceof APIError) {
          if (error.errorCode === 'SDK_UNEXPECTED_RESPONSE') return false
          return shouldRetryStatus(error.status, error.errorCode)
        }
        return (
          error instanceof TypeError || (error instanceof Error && error.name === 'TimeoutError')
        )
      },
      retryAfterMs: (error) => (error instanceof APIError ? error.retryAfterMs : undefined),
    })
  }
}
