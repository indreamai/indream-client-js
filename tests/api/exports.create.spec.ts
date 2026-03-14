import { describe, expect, it } from 'vitest'
import { IndreamClient } from '../../src/client'
import { getIndreamApiUrl, getMockApiKey } from '../utils/env'

const apiKey = getMockApiKey()
const baseURL = getIndreamApiUrl()

describe('exports.create', () => {
  it('sends create request without idempotency key by default', async () => {
    const capturedHeaders: Record<string, string> = {}
    let capturedUrl = ''

    const client = new IndreamClient({
      apiKey,
      baseURL,
      fetch: async (input, init) => {
        capturedUrl = String(input)
        const headers = new Headers(init?.headers)
        headers.forEach((value, key) => {
          capturedHeaders[key] = value
        })

        return new Response(
          JSON.stringify({
            data: {
              taskId: '2d531e48-d424-4acc-a3f7-88b0a4f9f73c',
              createdAt: '2026-02-15T00:00:00.000Z',
              durationSeconds: 120,
              billedStandardSeconds: 120,
              chargedCredits: '10.000000000000',
            },
            meta: {},
          }),
          { status: 201 }
        )
      },
    })

    const result = await client.exports.create(
      {
        editorState: {},
        ratio: '9:16',
        scale: 0.6,
        fps: 30,
        format: 'mp4',
      },
      {}
    )

    expect(capturedUrl).toBe(`${baseURL}/v1/exports`)
    expect(capturedHeaders['x-api-key']).toBe(apiKey)
    expect(capturedHeaders['idempotency-key']).toBeUndefined()
    expect(capturedHeaders['content-type']).toContain('application/json')
    expect(result.taskId).toBe('2d531e48-d424-4acc-a3f7-88b0a4f9f73c')
    expect(result.durationSeconds).toBe(120)
    expect(result.billedStandardSeconds).toBe(120)
  })

  it('forwards idempotency key header when provided', async () => {
    const capturedHeaders: Record<string, string> = {}

    const client = new IndreamClient({
      apiKey,
      baseURL,
      fetch: async (_input, init) => {
        const headers = new Headers(init?.headers)
        headers.forEach((value, key) => {
          capturedHeaders[key] = value
        })

        return new Response(
          JSON.stringify({
            data: {
              taskId: 'aa2dd4c4-c484-45e3-99e2-e84f7e474cc5',
              createdAt: '2026-02-15T00:00:00.000Z',
              durationSeconds: 120,
              billedStandardSeconds: 120,
              chargedCredits: '10.000000000000',
            },
            meta: {},
          }),
          { status: 201 }
        )
      },
    })

    await client.exports.create(
      {
        editorState: {},
        ratio: '9:16',
        scale: 0.6,
        fps: 30,
        format: 'mp4',
      },
      {
        idempotencyKey: 'idem-1',
      }
    )

    expect(capturedHeaders['idempotency-key']).toBe('idem-1')
  })
})
