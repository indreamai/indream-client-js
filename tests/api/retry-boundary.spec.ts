import { describe, expect, it } from 'vitest'
import { IndreamClient } from '../../src/client'
import { RateLimitError } from '../../src/errors'
import { getIndreamApiUrl, getMockApiKey } from '../utils/env'

const apiKey = getMockApiKey()
const baseURL = getIndreamApiUrl()

describe('retry boundary', () => {
  it('stops after maxRetries for 429 responses', async () => {
    let callCount = 0

    const client = new IndreamClient({
      apiKey,
      baseURL,
      maxRetries: 1,
      fetch: async () => {
        callCount += 1
        return new Response(
          JSON.stringify({
            type: 'RATE_LIMITED',
            title: 'Too many requests',
            status: 429,
            detail: 'retry later',
            errorCode: 'OPEN_API_REQUEST_LIMIT_EXCEEDED',
          }),
          { status: 429 }
        )
      },
    })

    await expect(client.editor.capabilities()).rejects.toBeInstanceOf(RateLimitError)
    expect(callCount).toBe(2)
  })

  it('retries 500 and returns successful payload', async () => {
    let callCount = 0

    const client = new IndreamClient({
      apiKey,
      baseURL,
      maxRetries: 2,
      fetch: async () => {
        callCount += 1

        if (callCount < 3) {
          return new Response(
            JSON.stringify({
              type: 'INTERNAL_ERROR',
              title: 'Internal server error',
              status: 500,
              detail: 'temporary upstream error',
              errorCode: 'INTERNAL_ERROR',
            }),
            { status: 500 }
          )
        }

        return new Response(
          JSON.stringify({
            data: {
              version: 'v1',
              animations: [],
              captionAnimations: {
                in: [],
                out: [],
                loop: [],
              },
              transitions: [],
              transitionPresets: [],
              effects: [],
              effectPresets: [],
              filters: [],
              filterPresets: [],
              shapes: [],
              backgroundPresets: {
                colors: [],
                gradients: [],
                images: [],
                blurLevels: [],
              },
              illustrations: [],
            },
            meta: {},
          }),
          { status: 200 }
        )
      },
    })

    const result = await client.editor.capabilities()
    expect(result.version).toBe('v1')
    expect(callCount).toBe(3)
  })
})
