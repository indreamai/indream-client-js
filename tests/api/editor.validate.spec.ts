import { describe, expect, it } from 'vitest'
import { IndreamClient } from '../../src/client'
import { RateLimitError } from '../../src/errors'
import { getIndreamApiUrl, getMockApiKey } from '../utils/env'

const apiKey = getMockApiKey()
const baseURL = getIndreamApiUrl()

describe('editor.validate', () => {
  it('sends wrapped editorState payload and content-type header', async () => {
    let capturedBody = ''
    let capturedContentType = ''

    const client = new IndreamClient({
      apiKey,
      baseURL,
      fetch: async (_input, init) => {
        capturedBody = String(init?.body || '')
        capturedContentType = new Headers(init?.headers).get('content-type') || ''

        return new Response(
          JSON.stringify({
            data: {
              valid: true,
              errors: [],
            },
            meta: {},
          }),
          { status: 200 }
        )
      },
    })

    await client.editor.validate({ foo: 'bar' })

    expect(capturedContentType).toContain('application/json')
    expect(JSON.parse(capturedBody)).toEqual({
      editorState: {
        foo: 'bar',
      },
    })
  })

  it('uses skipRetry and does not retry on 429', async () => {
    let callCount = 0

    const client = new IndreamClient({
      apiKey,
      baseURL,
      maxRetries: 3,
      fetch: async () => {
        callCount += 1
        return new Response(
          JSON.stringify({
            type: 'RATE_LIMITED',
            title: 'Too many requests',
            status: 429,
            detail: 'limit exceeded',
            errorCode: 'OPEN_API_REQUEST_LIMIT_EXCEEDED',
          }),
          { status: 429 }
        )
      },
    })

    await expect(client.editor.validate({})).rejects.toBeInstanceOf(RateLimitError)
    expect(callCount).toBe(1)
  })
})
