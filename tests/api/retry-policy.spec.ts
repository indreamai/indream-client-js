import { describe, expect, it } from 'vitest'
import { IndreamClient } from '../../src/client'
import { APIError } from '../../src/errors'
import type { ICreateExportRequest } from '../../src/types'
import { buildMinimalValidEditorState } from '../editor-state/fixtures/builders'

const payload = (): ICreateExportRequest => ({
  editorState: buildMinimalValidEditorState() as ICreateExportRequest['editorState'],
  stateSchemaVersion: 'v1',
  ratio: '16:9',
  fps: 30,
  scale: 1,
  format: 'mp4',
})
const response = (status: number, errorCode = 'TEMPORARILY_UNAVAILABLE') =>
  new Response(
    JSON.stringify({
      type: 'API_ERROR',
      title: 'API error',
      status,
      detail: 'Request could not complete',
      errorCode,
    }),
    { status, headers: { 'Retry-After': '0' } }
  )

function createFailingClient(status: number, errorCode?: string) {
  let calls = 0
  const requests: RequestInit[] = []
  const client = new IndreamClient({
    apiKey: 'sk_indream_test',
    maxRetries: 1,
    fetch: async (_url, init) => {
      calls += 1
      requests.push(init!)
      return response(status, errorCode)
    },
  })
  return { client, requests, calls: () => calls }
}

describe('automatic retry policy', () => {
  it.each([408, 429, 500, 502, 503, 504])('retries a transient GET %i', async (status) => {
    const run = createFailingClient(status)
    await expect(run.client.exports.get('task-1')).rejects.toBeInstanceOf(APIError)
    expect(run.calls()).toBe(2)
  })

  it('does not retry a quota 429', async () => {
    const run = createFailingClient(429, 'OPEN_API_EXPORT_STANDARD_SECOND_LIMIT_EXCEEDED')
    await expect(
      run.client.exports.create(payload(), { idempotencyKey: 'export-1' })
    ).rejects.toMatchObject({
      errorCode: 'OPEN_API_EXPORT_STANDARD_SECOND_LIMIT_EXCEEDED',
    })
    expect(run.calls()).toBe(1)
  })

  it.each(['header', 'clientTaskId'] as const)(
    'retries exports using the same %s',
    async (mode) => {
      const run = createFailingClient(503)
      const body = payload()
      if (mode === 'clientTaskId') body.clientTaskId = 'export-1'
      await expect(
        run.client.exports.create(body, mode === 'header' ? { idempotencyKey: 'export-1' } : {})
      ).rejects.toBeInstanceOf(APIError)
      expect(run.calls()).toBe(2)
      expect(run.requests[0].body).toBe(run.requests[1].body)
      expect(new Headers(run.requests[0].headers).get('Idempotency-Key')).toBe(
        new Headers(run.requests[1].headers).get('Idempotency-Key')
      )
    }
  )

  it('retries a project export with clientTaskId', async () => {
    const run = createFailingClient(503)
    await expect(
      run.client.projects.createExport('project-1', {
        clientTaskId: 'export-1',
        ratio: '16:9',
        fps: 30,
        scale: 1,
        format: 'mp4',
      })
    ).rejects.toBeInstanceOf(APIError)
    expect(run.calls()).toBe(2)
  })

  it.each(['export', 'project', 'sync', 'cancel', 'upload'] as const)(
    'does not retry %s mutations by default',
    async (kind) => {
      const run = createFailingClient(503)
      const actions = {
        export: () => run.client.exports.create(payload()),
        project: () =>
          run.client.projects.create(
            { editorState: payload().editorState, stateSchemaVersion: 'v1' },
            { idempotencyKey: 'project-1' }
          ),
        sync: () =>
          run.client.projects.sync('project-1', {
            editorState: payload().editorState,
            stateSchemaVersion: 'v1',
          }),
        cancel: () => run.client.exports.cancel('task-1'),
        upload: () =>
          run.client.uploads.upload(new Blob(['image']), {
            filename: 'image.png',
            contentType: 'image/png',
          }),
      }
      await expect(actions[kind]()).rejects.toBeInstanceOf(APIError)
      expect(run.calls()).toBe(1)
    }
  )

  it('does not retry an explicit caller abort', async () => {
    const controller = new AbortController()
    let calls = 0
    const client = new IndreamClient({
      apiKey: 'sk_indream_test',
      fetch: async () => {
        calls += 1
        controller.abort()
        throw new DOMException('Aborted', 'AbortError')
      },
    })
    await expect(client.exports.get('task-1', { signal: controller.signal })).rejects.toMatchObject(
      { name: 'AbortError' }
    )
    expect(calls).toBe(1)
  })
})
