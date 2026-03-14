import { describe, expect, it } from 'vitest'
import { IndreamClient } from '../../src/client'
import { APIError } from '../../src/errors'
import { getIndreamApiUrl, getMockApiKey } from '../utils/env'

const apiKey = getMockApiKey()
const baseURL = getIndreamApiUrl()

describe('exports.wait', () => {
  it('polls until task completed', async () => {
    let callCount = 0

    const client = new IndreamClient({
      apiKey,
      baseURL,
      pollIntervalMs: 5,
      fetch: async () => {
        callCount += 1

        const status = callCount < 3 ? 'PROCESSING' : 'COMPLETED'
        return new Response(
          JSON.stringify({
            data: {
              taskId: '4aa67b9c-acd0-446c-9c8e-4ea5d2ed584d',
              clientTaskId: null,
              status,
              progress: status === 'COMPLETED' ? 100 : 50,
              error: null,
              outputUrl: status === 'COMPLETED' ? 'https://example.com/video.mp4' : null,
              durationSeconds: 120,
              billedStandardSeconds: 120,
              chargedCredits: '10.000000000000',
              callbackUrl: null,
              createdAt: '2026-02-15T00:00:00.000Z',
              completedAt: status === 'COMPLETED' ? '2026-02-15T00:03:00.000Z' : null,
            },
            meta: {},
          }),
          { status: 200 }
        )
      },
    })

    const task = await client.exports.wait('4aa67b9c-acd0-446c-9c8e-4ea5d2ed584d', {
      timeoutMs: 200,
      pollIntervalMs: 5,
    })

    expect(task.status).toBe('COMPLETED')
    expect(task.durationSeconds).toBe(120)
    expect(task.billedStandardSeconds).toBe(120)
    expect(callCount).toBeGreaterThanOrEqual(3)
  })

  it('throws APIError when task reaches failed terminal status', async () => {
    const client = new IndreamClient({
      apiKey,
      baseURL,
      pollIntervalMs: 5,
      fetch: async () =>
        new Response(
          JSON.stringify({
            data: {
              taskId: '4e01bff5-0a5f-4326-b6ce-4c811f0b6f6f',
              clientTaskId: null,
              status: 'FAILED',
              progress: 100,
              error: 'render crashed',
              outputUrl: null,
              durationSeconds: 0,
              billedStandardSeconds: 0,
              chargedCredits: '0',
              callbackUrl: null,
              createdAt: '2026-02-15T00:00:00.000Z',
              completedAt: '2026-02-15T00:01:00.000Z',
            },
            meta: {},
          }),
          { status: 200 }
        ),
    })

    await expect(
      client.exports.wait('4e01bff5-0a5f-4326-b6ce-4c811f0b6f6f')
    ).rejects.toBeInstanceOf(APIError)
  })
})
