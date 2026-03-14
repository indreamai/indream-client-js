import { createApiError, type APIError } from './errors'
import { ExportsResource } from './resources/exports'
import { EditorResource } from './resources/editor'
import { shouldRetryStatus, withRetry } from './retry'
import type { IApiEnvelope, IClientOptions } from './types'

export class IndreamClient {
  readonly apiKey: string
  readonly baseURL: string
  readonly timeout: number
  readonly maxRetries: number
  readonly pollIntervalMs: number
  readonly fetchImpl: typeof fetch

  readonly exports: ExportsResource
  readonly editor: EditorResource

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
  }

  async request<T>(
    path: string,
    init: {
      method: 'GET' | 'POST'
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
      method: 'GET' | 'POST'
      body?: unknown
      headers?: Record<string, string>
      idempotencyKey?: string
      signal?: AbortSignal
      skipRetry?: boolean
    }
  ): Promise<IApiEnvelope<T>> {
    const url = `${this.baseURL}${path.startsWith('/') ? path : `/${path}`}`
    const payload = init.body === undefined ? undefined : JSON.stringify(init.body)

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

      if (payload !== undefined) {
        headers['Content-Type'] = 'application/json'
      }

      if (init.idempotencyKey) {
        headers['Idempotency-Key'] = init.idempotencyKey
      }

      try {
        const response = await this.fetchImpl(url, {
          method: init.method,
          body: payload,
          headers,
          signal: controller.signal,
        })

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
