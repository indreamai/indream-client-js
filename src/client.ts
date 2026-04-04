import { createApiError, type APIError } from './errors'
import { AssetsResource } from './resources/assets'
import { ExportsResource } from './resources/exports'
import { EditorResource } from './resources/editor'
import { ProjectsResource } from './resources/projects'
import { UploadsResource } from './resources/uploads'
import { shouldRetryStatus, withRetry } from './retry'
import type { IApiEnvelope, IClientOptions } from './types'

const isBodyInit = (value: unknown): value is BodyInit => {
  if (typeof value === 'string') return true
  if (value instanceof URLSearchParams) return true
  if (value instanceof ArrayBuffer) return true
  if (ArrayBuffer.isView(value)) return true
  if (typeof Blob !== 'undefined' && value instanceof Blob) return true
  if (typeof FormData !== 'undefined' && value instanceof FormData) return true
  if (typeof ReadableStream !== 'undefined' && value instanceof ReadableStream) return true
  return false
}

export class IndreamClient {
  readonly apiKey: string
  readonly baseURL: string
  readonly timeout: number
  readonly maxRetries: number
  readonly pollIntervalMs: number
  readonly fetchImpl: typeof fetch

  readonly exports: ExportsResource
  readonly editor: EditorResource
  readonly projects: ProjectsResource
  readonly uploads: UploadsResource
  readonly assets: AssetsResource

  constructor(options: IClientOptions) {
    if (!options.apiKey) {
      throw new Error('apiKey is required')
    }

    this.apiKey = options.apiKey
    this.baseURL = (options.baseURL || 'https://api.indream.ai').replace(/\/$/, '')
    this.timeout = options.timeout || 60_000
    this.maxRetries = Number.isFinite(options.maxRetries) ? Number(options.maxRetries) : 2
    this.pollIntervalMs = options.pollIntervalMs || 2000
    this.fetchImpl = options.fetch || fetch

    this.exports = new ExportsResource(this)
    this.editor = new EditorResource(this)
    this.projects = new ProjectsResource(this)
    this.uploads = new UploadsResource(this)
    this.assets = new AssetsResource(this)
  }

  async request<T>(
    path: string,
    init: {
      method: 'GET' | 'POST' | 'PATCH' | 'DELETE'
      body?: unknown
      headers?: Record<string, string>
      idempotencyKey?: string
      signal?: AbortSignal
      skipRetry?: boolean
    }
  ): Promise<T> {
    const envelope = await this.requestEnvelope<T>(path, init)
    return envelope.data
  }

  async requestEnvelope<T>(
    path: string,
    init: {
      method: 'GET' | 'POST' | 'PATCH' | 'DELETE'
      body?: unknown
      headers?: Record<string, string>
      idempotencyKey?: string
      signal?: AbortSignal
      skipRetry?: boolean
    }
  ): Promise<IApiEnvelope<T>> {
    const url = `${this.baseURL}${path.startsWith('/') ? path : `/${path}`}`
    const isJsonPayload = init.body !== undefined && !isBodyInit(init.body)
    let payload: BodyInit | undefined
    if (init.body !== undefined) {
      if (isJsonPayload) {
        payload = JSON.stringify(init.body)
      } else if (isBodyInit(init.body)) {
        payload = init.body
      }
    }

    const execute = async (): Promise<IApiEnvelope<T>> => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)
      const externalSignal = init.signal
      const onExternalAbort = () => controller.abort()
      let hasExternalAbortListener = false

      if (externalSignal) {
        if (externalSignal.aborted) {
          controller.abort()
        } else {
          externalSignal.addEventListener('abort', onExternalAbort, { once: true })
          hasExternalAbortListener = true
        }
      }

      const headers: Record<string, string> = {
        'x-api-key': this.apiKey,
        Accept: 'application/json',
        ...init.headers,
      }

      if (isJsonPayload && payload !== undefined) {
        headers['Content-Type'] = 'application/json'
      }

      if (init.idempotencyKey) {
        headers['Idempotency-Key'] = init.idempotencyKey
      }

      const requestInit: RequestInit & { duplex?: 'half' } = {
        method: init.method,
        body: payload,
        headers,
        signal: controller.signal,
      }

      if (typeof ReadableStream !== 'undefined' && payload instanceof ReadableStream) {
        requestInit.duplex = 'half'
      }

      try {
        const response = await this.fetchImpl(url, requestInit)

        const text = await response.text()
        const parsed = text ? JSON.parse(text) : null

        if (!response.ok) {
          throw createApiError(response.status, parsed)
        }

        if (!parsed || typeof parsed !== 'object' || !('data' in parsed)) {
          throw createApiError(response.status, parsed)
        }

        return parsed as IApiEnvelope<T>
      } finally {
        clearTimeout(timeoutId)
        if (hasExternalAbortListener) {
          externalSignal?.removeEventListener('abort', onExternalAbort)
        }
      }
    }

    if (init.skipRetry) {
      return await execute()
    }

    return await withRetry(
      async () => {
        try {
          return await execute()
        } catch (error) {
          const apiError = error as APIError
          if (apiError?.status && shouldRetryStatus(apiError.status)) {
            throw error
          }

          if (error instanceof Error && error.name === 'AbortError') {
            throw {
              noRetry: true,
              error,
            }
          }

          if (apiError?.status) {
            throw {
              noRetry: true,
              error,
            }
          }

          throw error
        }
      },
      {
        maxRetries: this.maxRetries,
      }
    ).catch((error) => {
      if (error && typeof error === 'object' && 'noRetry' in error) {
        throw (error as { error: unknown }).error
      }
      throw error
    })
  }
}
