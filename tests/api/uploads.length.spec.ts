import { describe, expect, it } from 'vitest'
import { IndreamClient } from '../../src/client'
import type { TUploadBody } from '../../src/types'

const uploadOptions = { filename: 'clip.mp4', contentType: 'video/mp4' }

describe('upload byte size', () => {
  it.each([
    ['blob', () => new Blob(['demo']), 4],
    ['buffer', () => new ArrayBuffer(8), 8],
    ['view', () => new Uint8Array(new ArrayBuffer(16), 3, 5), 5],
  ] as const)('calculates Content-Length for %s', async (_name, body, expected) => {
    const client = new IndreamClient({
      apiKey: 'sk_indream_test',
      fetch: async (_url, init) => {
        expect(new Headers(init?.headers).get('Content-Length')).toBe(String(expected))
        return Response.json({
          data: {
            assetId: 'asset-1',
            type: 'IMAGE',
            source: 'UPLOAD',
            filename: 'demo.png',
            mimetype: 'image/png',
            size: 4,
            fileUrl: 'https://assets.example.com/demo.png',
            fileKey: 'demo.png',
            width: 10,
            height: 10,
            duration: null,
          },
          meta: {},
        })
      },
    })
    await client.uploads.upload(body(), uploadOptions)
  })

  it('requires an exact declared stream size and keeps streaming enabled', async () => {
    const stream = new ReadableStream<Uint8Array>()
    const client = new IndreamClient({
      apiKey: 'sk_indream_test',
      fetch: async (_url, init) => {
        expect(init?.body).toBe(stream)
        expect(new Headers(init?.headers).get('Content-Length')).toBe('8')
        expect((init as RequestInit & { duplex: string }).duplex).toBe('half')
        return Response.json({
          data: {
            assetId: 'asset-1',
            type: 'IMAGE',
            source: 'UPLOAD',
            filename: 'demo.png',
            mimetype: 'image/png',
            size: 4,
            fileUrl: 'https://assets.example.com/demo.png',
            fileKey: 'demo.png',
            width: 10,
            height: 10,
            duration: null,
          },
          meta: {},
        })
      },
    })
    await client.uploads.upload(stream, { ...uploadOptions, contentLength: 8 })
  })

  it.each([
    [() => new Blob([]), undefined],
    [() => new Blob(['demo']), 3],
    [() => new Blob(['demo']), 0],
    [() => new Blob(['demo']), 1.5],
    [() => new ReadableStream<Uint8Array>(), undefined],
    [() => new ReadableStream<Uint8Array>(), Number.NaN],
  ] satisfies Array<[() => TUploadBody, number | undefined]>)(
    'rejects invalid byte counts before dispatch %#',
    async (body, contentLength) => {
      let calls = 0
      const client = new IndreamClient({
        apiKey: 'sk_indream_test',
        fetch: async () => {
          calls += 1
          throw new Error('Unexpected dispatch')
        },
      })
      await expect(
        client.uploads.upload(body(), { ...uploadOptions, contentLength })
      ).rejects.toBeInstanceOf(RangeError)
      expect(calls).toBe(0)
    }
  )
})
