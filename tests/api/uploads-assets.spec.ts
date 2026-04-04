import { describe, expect, it } from 'vitest'
import { IndreamClient } from '../../src/client'
import { getIndreamApiUrl, getMockApiKey } from '../utils/env'

const apiKey = getMockApiKey()
const baseURL = getIndreamApiUrl()

describe('uploads and assets resources', () => {
  it('uploads a raw file body with upload headers and returns asset fields', async () => {
    const capturedHeaders: Record<string, string> = {}
    const file = new Blob(['demo'], { type: 'image/png' })

    const client = new IndreamClient({
      apiKey,
      baseURL,
      fetch: async (_input, init) => {
        const headers = new Headers(init?.headers)
        headers.forEach((value, key) => {
          capturedHeaders[key] = value
        })

        expect(init?.method).toBe('POST')
        expect(init?.body).toBe(file)

        return new Response(
          JSON.stringify({
            data: {
              assetId: '0dff5af3-1477-4cda-8406-df04285e060e',
              type: 'IMAGE',
              source: 'UPLOAD',
              filename: 'demo.png',
              mimetype: 'image/png',
              size: 1024,
              fileUrl: 'https://cdn.example.com/uploads/demo.png',
              fileKey: 'uploads/demo.png',
              width: 1920,
              height: 1080,
              duration: null,
            },
            meta: {},
          }),
          { status: 201 }
        )
      },
    })

    const asset = await client.uploads.upload(file, {
      filename: 'demo.png',
      projectId: 'ea517bbd-d6ad-4db8-aa71-8228f39d1820',
    })

    expect(capturedHeaders['content-type']).toBe('image/png')
    expect(capturedHeaders['x-file-name']).toBe('demo.png')
    expect(capturedHeaders['x-project-id']).toBe('ea517bbd-d6ad-4db8-aa71-8228f39d1820')
    expect(asset.fileKey).toBe('uploads/demo.png')
  })

  it('gets and deletes asset with dedicated resource', async () => {
    const calls: string[] = []
    const client = new IndreamClient({
      apiKey,
      baseURL,
      fetch: async (input, init) => {
        calls.push(`${init?.method}:${String(input)}`)

        if (init?.method === 'GET') {
          return new Response(
            JSON.stringify({
              data: {
                assetId: '0dff5af3-1477-4cda-8406-df04285e060e',
                type: 'IMAGE',
                source: 'UPLOAD',
                filename: 'demo.png',
                mimetype: 'image/png',
                size: 1024,
                fileUrl: 'https://cdn.example.com/uploads/demo.png',
                fileKey: 'uploads/demo.png',
                width: 1920,
                height: 1080,
                duration: null,
              },
              meta: {},
            }),
            { status: 200 }
          )
        }

        return new Response(
          JSON.stringify({
            data: {
              assetId: '0dff5af3-1477-4cda-8406-df04285e060e',
              deleted: true,
            },
            meta: {},
          }),
          { status: 200 }
        )
      },
    })

    const asset = await client.assets.get('0dff5af3-1477-4cda-8406-df04285e060e')
    const deleted = await client.assets.delete('0dff5af3-1477-4cda-8406-df04285e060e')

    expect(asset.assetId).toBe('0dff5af3-1477-4cda-8406-df04285e060e')
    expect(deleted.deleted).toBe(true)
    expect(calls).toEqual([
      `GET:${baseURL}/v1/assets/0dff5af3-1477-4cda-8406-df04285e060e`,
      `DELETE:${baseURL}/v1/assets/0dff5af3-1477-4cda-8406-df04285e060e`,
    ])
  })
})
