import { describe, expect, it } from 'vitest'
import { AuthError, RateLimitError, ValidationError } from '../../src/errors'
import { IndreamClient } from '../../src/client'
import type { TEditorStateV1 } from '../../src/types'
import { buildMinimalValidEditorState } from '../editor-state/fixtures/builders'
import { getIndreamApiUrl, getMockApiKey } from '../utils/env'

const apiKey = getMockApiKey()
const baseURL = getIndreamApiUrl()

describe('error mapping', () => {
  const createEditorState = (): TEditorStateV1 => {
    return buildMinimalValidEditorState() as unknown as TEditorStateV1
  }

  it('maps 401 to AuthError', async () => {
    const client = new IndreamClient({
      apiKey,
      baseURL,
      fetch: async () =>
        new Response(
          JSON.stringify({
            type: 'UNAUTHORIZED',
            title: 'Unauthorized',
            status: 401,
            detail: 'Invalid API key',
            errorCode: 'OPEN_API_KEY_INVALID',
          }),
          { status: 401 }
        ),
    })

    await expect(client.exports.list()).rejects.toBeInstanceOf(AuthError)
  })

  it('maps 422 to ValidationError', async () => {
    const client = new IndreamClient({
      apiKey,
      baseURL,
      fetch: async () =>
        new Response(
          JSON.stringify({
            type: 'UNPROCESSABLE_CONTENT',
            title: 'Unprocessable content',
            status: 422,
            detail: 'editorState is invalid',
            errorCode: 'EDITOR_SCHEMA_INVALID',
          }),
          { status: 422 }
        ),
    })

    await expect(client.editor.validate(createEditorState())).rejects.toBeInstanceOf(
      ValidationError
    )
  })

  it('maps 429 to RateLimitError', async () => {
    const client = new IndreamClient({
      apiKey,
      baseURL,
      fetch: async () =>
        new Response(
          JSON.stringify({
            type: 'RATE_LIMITED',
            title: 'Too many requests',
            status: 429,
            detail: 'limit exceeded',
            errorCode: 'OPEN_API_REQUEST_LIMIT_EXCEEDED',
          }),
          { status: 429 }
        ),
    })

    await expect(client.exports.list()).rejects.toBeInstanceOf(RateLimitError)
  })
})
