import { describe, expect, it } from 'vitest'
import { IndreamClient } from '../../src/client'
import { getIndreamApiUrl, getMockApiKey } from '../utils/env'

const apiKey = getMockApiKey()
const baseURL = getIndreamApiUrl()

describe('illustrations.search', () => {
  it('calls /v1/illustrations with q when provided', async () => {
    let capturedUrl = ''

    const client = new IndreamClient({
      apiKey,
      baseURL,
      fetch: async (input) => {
        capturedUrl = String(input)
        return new Response(JSON.stringify({ data: ['ICreativeThinking'], meta: {} }), {
          status: 200,
        })
      },
    })

    const items = await client.illustrations.search('creative')

    expect(capturedUrl).toContain('/v1/illustrations?q=creative')
    expect(items).toEqual(['ICreativeThinking'])
  })

  it('calls /v1/illustrations without q when omitted', async () => {
    let capturedUrl = ''

    const client = new IndreamClient({
      apiKey,
      baseURL,
      fetch: async (input) => {
        capturedUrl = String(input)
        return new Response(
          JSON.stringify({ data: ['ICreativeThinking', 'IMegaphone'], meta: {} }),
          { status: 200 }
        )
      },
    })

    const items = await client.illustrations.search()

    expect(capturedUrl.endsWith('/v1/illustrations')).toBe(true)
    expect(items).toEqual(['ICreativeThinking', 'IMegaphone'])
  })
})
