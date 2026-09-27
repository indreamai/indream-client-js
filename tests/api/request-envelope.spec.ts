import { describe, expect, it } from 'vitest'
import { IndreamClient } from '../../src/client'
import { getIndreamApiUrl, getMockApiKey } from '../utils/mock'

const apiKey = getMockApiKey()
const baseURL = getIndreamApiUrl()

describe('request envelope handling', () => {
  it('reports malformed JSON without retrying', async () => {
    let callCount = 0

    const client = new IndreamClient({
      apiKey,
      baseURL,
      maxRetries: 1,
      fetch: async () => {
        callCount += 1
        return new Response('<html>not-json</html>', {
          status: 200,
          headers: {
            'content-type': 'text/html',
          },
        })
      },
    })

    await expect(client.exports.list()).rejects.toMatchObject({
      errorCode: 'SDK_UNEXPECTED_RESPONSE',
    })
    expect(callCount).toBe(1)
  })

  it('throws APIError when response body is missing data envelope', async () => {
    const client = new IndreamClient({
      apiKey,
      baseURL,
      fetch: async () =>
        new Response(
          JSON.stringify({
            meta: {},
          }),
          {
            status: 200,
          }
        ),
    })

    await expect(client.exports.list()).rejects.toMatchObject({
      name: 'APIError',
      status: 200,
      errorCode: 'SDK_UNEXPECTED_RESPONSE',
    })
  })
  it.each([
    { data: [], meta: null },
    { data: [], meta: [] },
    { data: {}, meta: {} },
    { data: [], meta: { nextPageCursor: 1 } },
  ])('rejects malformed list envelopes without retrying %#', async (payload) => {
    let calls = 0
    const client = new IndreamClient({
      apiKey,
      baseURL,
      fetch: async () => {
        calls += 1
        return Response.json(payload)
      },
    })
    await expect(client.exports.list()).rejects.toMatchObject({
      errorCode: 'SDK_UNEXPECTED_RESPONSE',
    })
    expect(calls).toBe(1)
  })

  it('uses the actual HTTP status for problem errors', async () => {
    const client = new IndreamClient({
      apiKey,
      baseURL,
      fetch: async () =>
        Response.json(
          {
            type: 'AUTH_ERROR',
            title: 'Unauthorized',
            status: 500,
            detail: 'Invalid key',
            errorCode: 'OPEN_API_KEY_INVALID',
          },
          { status: 401 }
        ),
    })
    await expect(client.exports.list()).rejects.toMatchObject({ status: 401, name: 'AuthError' })
  })
})
