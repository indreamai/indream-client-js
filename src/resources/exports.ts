import { APIError } from '../errors'
import type {
  ICreateExportRequest,
  ICreateRequestOptions,
  ICreateExportResponse,
  IExportTask,
  IListExportsResponse,
  IWaitOptions,
  TTaskStatus,
} from '../types'
import type { IndreamClient } from '../client'

const TERMINAL_STATUSES = new Set<TTaskStatus>(['COMPLETED', 'FAILED', 'CANCELED'])

const sleep = async (ms: number) => {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

export class ExportsResource {
  private readonly client: IndreamClient

  constructor(client: IndreamClient) {
    this.client = client
  }

  async create(
    payload: ICreateExportRequest,
    options: ICreateRequestOptions = {}
  ): Promise<ICreateExportResponse> {
    const idempotencyKey = options.idempotencyKey?.trim()

    return await this.client.request<ICreateExportResponse>('/v1/exports', {
      method: 'POST',
      body: payload,
      idempotencyKey: idempotencyKey || undefined,
      signal: options.signal,
    })
  }

  async get(taskId: string, options: { signal?: AbortSignal } = {}): Promise<IExportTask> {
    return await this.client.request<IExportTask>(`/v1/exports/${taskId}`, {
      method: 'GET',
      signal: options.signal,
    })
  }

  async list(params?: {
    pageSize?: number
    pageCursor?: string
    createdByApiKeyId?: string
    signal?: AbortSignal
  }): Promise<IListExportsResponse> {
    const search = new URLSearchParams()
    if (params?.pageSize) {
      search.set('pageSize', String(params.pageSize))
    }
    if (params?.pageCursor) {
      search.set('pageCursor', params.pageCursor)
    }
    if (params?.createdByApiKeyId) {
      search.set('createdByApiKeyId', params.createdByApiKeyId)
    }

    const query = search.toString()
    const envelope = await this.client.requestEnvelope<IExportTask[]>(
      `/v1/exports${query ? `?${query}` : ''}`,
      {
        method: 'GET',
        signal: params?.signal,
      }
    )

    return {
      items: envelope.data || [],
      nextPageCursor:
        typeof envelope.meta?.nextPageCursor === 'string' ? envelope.meta.nextPageCursor : null,
    }
  }

  async wait(taskId: string, options: IWaitOptions = {}): Promise<IExportTask> {
    const timeoutMs = options.timeoutMs || 10 * 60 * 1000
    const pollIntervalMs = options.pollIntervalMs || this.client.pollIntervalMs
    const startedAt = Date.now()

    // The polling helper only advances client-side observation and does not change server semantics.
    while (true) {
      if (options.signal?.aborted) {
        throw new Error('wait aborted by caller signal')
      }

      if (Date.now() - startedAt > timeoutMs) {
        throw new Error(`wait timeout after ${timeoutMs}ms`)
      }

      const task = await this.get(taskId, {
        signal: options.signal,
      })

      if (TERMINAL_STATUSES.has(task.status)) {
        if (task.status === 'FAILED' || task.status === 'CANCELED') {
          throw new APIError({
            type: 'TASK_TERMINAL_FAILURE',
            title: 'Task failed',
            status: 422,
            detail: task.error || `Task ended with status ${task.status}`,
            errorCode: 'TASK_TERMINAL_FAILURE',
          })
        }

        return task
      }

      await sleep(pollIntervalMs)
    }
  }
}
