import { describe, expect, it } from 'vitest'
import { IndreamClient } from '../../src/client'
import { RateLimitError } from '../../src/errors'
import type { TEditorStateV1 } from '../../src/types'
import { buildMinimalValidEditorState } from '../editor-state/fixtures/builders'
import { getIndreamApiUrl, getMockApiKey } from '../utils/env'

const apiKey = getMockApiKey()
const baseURL = getIndreamApiUrl()

describe('editor.validate', () => {
  const createEditorState = (): TEditorStateV1 => {
    return buildMinimalValidEditorState() as unknown as TEditorStateV1
  }

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

    const editorState = createEditorState()
    await client.editor.validate(editorState)

    expect(capturedContentType).toContain('application/json')
    expect(JSON.parse(capturedBody)).toEqual({
      editorState,
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

    await expect(client.editor.validate(createEditorState())).rejects.toBeInstanceOf(RateLimitError)
    expect(callCount).toBe(1)
  })
})
