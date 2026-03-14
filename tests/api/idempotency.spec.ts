import { describe, expect, it } from 'vitest'
import { IndreamClient } from '../../src/client'
import { getIndreamApiUrl, getMockApiKey } from '../utils/env'

const apiKey = getMockApiKey()
const baseURL = getIndreamApiUrl()

describe('idempotency header', () => {
  it('does not require idempotency key for exports.create', async () => {
    let called = false
    const capturedHeaders: Record<string, string> = {}

    const client = new IndreamClient({
      apiKey,
      baseURL,
      fetch: async (_input, init) => {
        called = true
        const headers = new Headers(init?.headers)
        headers.forEach((value, key) => {
          capturedHeaders[key] = value
        })

        return new Response(
          JSON.stringify({
            data: {
              taskId: 'a3c91f23-60ba-47a9-af6f-23c001c27a6d',
              createdAt: '2026-02-15T00:00:00.000Z',
              durationSeconds: 60,
              billedStandardSeconds: 60,
              chargedCredits: '1',
            },
            meta: {},
          }),
          { status: 201 }
        )
      },
    })

    await client.exports.create({
      editorState: {},
      ratio: '9:16',
      scale: 0.6,
      fps: 30,
      format: 'mp4',
    })

    expect(called).toBe(true)
    expect(capturedHeaders['idempotency-key']).toBeUndefined()
  })
})
