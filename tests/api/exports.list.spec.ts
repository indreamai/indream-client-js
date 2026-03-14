import { describe, expect, it } from 'vitest'
import { IndreamClient } from '../../src/client'
import { getIndreamApiUrl, getMockApiKey } from '../utils/env'

const apiKey = getMockApiKey()
const baseURL = getIndreamApiUrl()

describe('exports.list', () => {
  it('passes pagination and creator-key filters with nextPageCursor', async () => {
    let capturedUrl = ''

    const client = new IndreamClient({
      apiKey,
      baseURL,
      fetch: async (input) => {
        capturedUrl = String(input)
        return new Response(
          JSON.stringify({
            data: [
              {
                taskId: '8c1d9ff0-4212-43f5-9258-6eb42a05b56e',
                createdByApiKeyId: '30edf957-a26b-4591-9df2-22976ea1416a',
                clientTaskId: null,
                status: 'PENDING',
                progress: 0,
                error: null,
                outputUrl: null,
                durationSeconds: 0,
                billedStandardSeconds: 0,
                chargedCredits: '0',
                callbackUrl: null,
                createdAt: '2026-02-15T00:00:00.000Z',
                completedAt: null,
              },
            ],
            meta: {
              nextPageCursor: 'cursor-next',
            },
          }),
          { status: 200 }
        )
      },
    })

    const result = await client.exports.list({
      pageSize: 10,
      pageCursor: 'cursor-1',
      createdByApiKeyId: '30edf957-a26b-4591-9df2-22976ea1416a',
    })

    expect(capturedUrl).toBe(
      `${baseURL}/v1/exports?pageSize=10&pageCursor=cursor-1&createdByApiKeyId=30edf957-a26b-4591-9df2-22976ea1416a`
    )
    expect(result.items).toHaveLength(1)
    expect(result.items[0]?.createdByApiKeyId).toBe('30edf957-a26b-4591-9df2-22976ea1416a')
    expect(result.items[0]?.durationSeconds).toBe(0)
    expect(result.items[0]?.billedStandardSeconds).toBe(0)
    expect(result.nextPageCursor).toBe('cursor-next')
  })
})
