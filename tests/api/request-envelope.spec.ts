import { describe, expect, it } from 'vitest'
import { IndreamClient } from '../../src/client'
import { getIndreamApiUrl, getMockApiKey } from '../utils/env'

const apiKey = getMockApiKey()
const baseURL = getIndreamApiUrl()

describe('request envelope handling', () => {
  it('retries and throws SyntaxError when response is non-JSON body', async () => {
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

    await expect(client.exports.list()).rejects.toBeInstanceOf(SyntaxError)
    expect(callCount).toBe(2)
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
})
