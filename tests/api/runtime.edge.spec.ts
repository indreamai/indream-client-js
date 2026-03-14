// @vitest-environment edge-runtime

import { afterEach, describe, expect, it, vi } from 'vitest'
import { IndreamClient } from '../../src/client'
import { getIndreamApiUrl, getMockApiKey } from '../utils/env'

const apiKey = getMockApiKey()
const baseURL = getIndreamApiUrl()

describe('edge runtime compatibility', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('uses global fetch without Node.js-specific APIs', async () => {
    const fetchMock = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          data: {
            taskId: 'd7b6f9a3-2eb3-4bcb-86a0-26fc4f0d8d5d',
            clientTaskId: null,
            status: 'COMPLETED',
            progress: 100,
            error: null,
            outputUrl: 'https://example.com/video.mp4',
            durationSeconds: 4.8,
            billedStandardSeconds: 10,
            chargedCredits: '1.000000000000',
            callbackUrl: null,
            createdAt: '2026-02-15T00:00:00.000Z',
            completedAt: '2026-02-15T00:01:00.000Z',
          },
          meta: {},
        }),
        { status: 200 }
      )
    })

    vi.stubGlobal('fetch', fetchMock as typeof fetch)

    const client = new IndreamClient({
      apiKey,
      baseURL,
    })

    const task = await client.exports.get('d7b6f9a3-2eb3-4bcb-86a0-26fc4f0d8d5d')

    expect(fetchMock).toHaveBeenCalledOnce()
    expect(task.taskId).toBe('d7b6f9a3-2eb3-4bcb-86a0-26fc4f0d8d5d')
  })

  it('keeps timeout handling when caller signal is provided', async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const signal = init?.signal
      return await new Promise<Response>((_resolve, reject) => {
        signal?.addEventListener(
          'abort',
          () => {
            reject(new DOMException('Aborted', 'AbortError'))
          },
          { once: true }
        )
      })
    })

    const externalController = new AbortController()
    const client = new IndreamClient({
      apiKey,
      baseURL,
      timeout: 20,
      fetch: fetchMock as typeof fetch,
    })

    await expect(
      client.exports.list({
        signal: externalController.signal,
      })
    ).rejects.toMatchObject({
      name: 'AbortError',
    })
  }, 1000)
})
