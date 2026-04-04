import { describe, expect, it } from 'vitest'
import { IndreamClient } from '../../src/client'
import type { TEditorStateV1 } from '../../src/types'
import { buildMinimalValidEditorState } from '../editor-state/fixtures/builders'
import { getIndreamApiUrl, getMockApiKey } from '../utils/env'

const apiKey = getMockApiKey()
const baseURL = getIndreamApiUrl()

describe('projects resource', () => {
  const createEditorState = (): TEditorStateV1 => {
    return buildMinimalValidEditorState() as unknown as TEditorStateV1
  }

  it('creates project and forwards optional idempotency key', async () => {
    const captured: Record<string, unknown> = {}

    const client = new IndreamClient({
      apiKey,
      baseURL,
      fetch: async (input, init) => {
        captured.url = String(input)
        captured.method = init?.method
        captured.body = init?.body
        const headers = new Headers(init?.headers)
        captured.idempotency = headers.get('idempotency-key')

        return new Response(
          JSON.stringify({
            data: {
              projectId: '93fb8aa8-c301-441d-bb8d-ea733cd72a7e',
              title: 'Launch draft',
              description: null,
              createdAt: '2026-04-04T00:00:00.000Z',
              updatedAt: '2026-04-04T00:00:00.000Z',
            },
            meta: {},
          }),
          { status: 201 }
        )
      },
    })

    const project = await client.projects.create(
      {
        title: 'Launch draft',
        editorState: createEditorState(),
      },
      { idempotencyKey: 'project-create-1' }
    )

    expect(captured.url).toBe(`${baseURL}/v1/projects`)
    expect(captured.method).toBe('POST')
    expect(captured.idempotency).toBe('project-create-1')
    expect(project.projectId).toBe('93fb8aa8-c301-441d-bb8d-ea733cd72a7e')
  })

  it('syncs project state with dedicated endpoint', async () => {
    const captured: Record<string, unknown> = {}

    const client = new IndreamClient({
      apiKey,
      baseURL,
      fetch: async (input, init) => {
        captured.url = String(input)
        captured.method = init?.method
        captured.body = init?.body

        return new Response(
          JSON.stringify({
            data: {
              projectId: '93fb8aa8-c301-441d-bb8d-ea733cd72a7e',
              stateVersion: 'v1',
              updatedAt: '2026-04-04T00:01:00.000Z',
            },
            meta: {},
          }),
          { status: 200 }
        )
      },
    })

    const result = await client.projects.sync('93fb8aa8-c301-441d-bb8d-ea733cd72a7e', {
      editorState: createEditorState(),
    })

    expect(captured.url).toBe(`${baseURL}/v1/projects/93fb8aa8-c301-441d-bb8d-ea733cd72a7e/sync`)
    expect(captured.method).toBe('POST')
    expect(result.stateVersion).toBe('v1')
  })

  it('creates export from persisted project and keeps projectId in task response', async () => {
    const client = new IndreamClient({
      apiKey,
      baseURL,
      fetch: async () =>
        new Response(
          JSON.stringify({
            data: {
              taskId: '07f64f26-3d43-4d2e-9954-1ea9482bcc79',
              projectId: '93fb8aa8-c301-441d-bb8d-ea733cd72a7e',
              createdAt: '2026-04-04T00:00:00.000Z',
              durationSeconds: 6,
              billedStandardSeconds: 6,
              chargedCredits: '1.000000000000',
              chargedCreditPool: 'OPEN_API',
            },
            meta: {},
          }),
          { status: 201 }
        ),
    })

    const created = await client.projects.createExport('93fb8aa8-c301-441d-bb8d-ea733cd72a7e', {
      ratio: '16:9',
      scale: 1,
      fps: 30,
      format: 'mp4',
    })

    expect(created.projectId).toBe('93fb8aa8-c301-441d-bb8d-ea733cd72a7e')
  })
})
