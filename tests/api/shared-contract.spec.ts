import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { IndreamClient } from '../../src/client'
import type { ICreateExportRequest, TEditorStateV1 } from '../../src/types'

const fixture = JSON.parse(
  readFileSync(new URL('../../openapi/fixtures/sdk-contract.json', import.meta.url), 'utf8')
)
const editorState = JSON.parse(
  readFileSync(new URL('../../openapi/examples/editor-state.valid.json', import.meta.url), 'utf8')
) as TEditorStateV1

describe('shared SDK wire contract', () => {
  it('creates, reads, and cancels the same export contract as Python', async () => {
    const request = { ...fixture.exportRequest, editorState } as ICreateExportRequest
    const calls: string[] = []
    const client = new IndreamClient({
      apiKey: fixture.apiKey,
      fetch: async (_input, init) => {
        const method = init?.method ?? 'GET'
        calls.push(method)
        expect(new Headers(init?.headers).get('authorization')).toBe(`Bearer ${fixture.apiKey}`)
        if (method === 'POST') expect(JSON.parse(String(init?.body))).toEqual(request)
        const response =
          method === 'POST'
            ? fixture.createResponse
            : method === 'DELETE'
              ? fixture.cancelResponse
              : fixture.taskResponse
        return new Response(JSON.stringify(response), { status: method === 'POST' ? 201 : 200 })
      },
    })
    expect(await client.exports.create(request)).toEqual(fixture.createResponse.data)
    expect(await client.exports.get(fixture.taskResponse.data.taskId)).toEqual(
      fixture.taskResponse.data
    )
    expect(await client.exports.cancel(fixture.taskResponse.data.taskId)).toEqual(
      fixture.cancelResponse.data
    )
    expect(calls).toEqual(['POST', 'GET', 'DELETE'])
  })

  it('preserves the shared quota Problem without retrying', async () => {
    let calls = 0
    const client = new IndreamClient({
      apiKey: fixture.apiKey,
      fetch: async () => {
        calls += 1
        return new Response(JSON.stringify(fixture.quotaProblem), { status: 429 })
      },
    })
    await expect(client.exports.get(fixture.taskResponse.data.taskId)).rejects.toMatchObject({
      status: 429,
      errorCode: fixture.quotaProblem.errorCode,
    })
    expect(calls).toBe(1)
  })
})

it('encodes task identifiers for get and wait and still validates the response model', async () => {
  const taskId = 'task/?# +'
  const paths: string[] = []
  const client = new IndreamClient({
    apiKey: fixture.apiKey,
    fetch: async (url) => {
      paths.push(new URL(String(url)).pathname)
      return Response.json(fixture.taskResponse)
    },
  })
  await client.exports.get(taskId)
  await client.exports.wait(taskId)
  expect(paths).toEqual(['/v1/exports/task%2F%3F%23%20%2B', '/v1/exports/task%2F%3F%23%20%2B'])
  const invalid = new IndreamClient({
    apiKey: fixture.apiKey,
    fetch: async () => Response.json({ data: {}, meta: {} }),
  })
  await expect(invalid.exports.get(taskId)).rejects.toMatchObject({
    errorCode: 'SDK_UNEXPECTED_RESPONSE',
  })
})

it('encodes project identifiers separately from asset-list cursors', async () => {
  let requested: URL | undefined
  const client = new IndreamClient({
    apiKey: fixture.apiKey,
    fetch: async (url) => {
      requested = new URL(String(url))
      return Response.json({ data: [], meta: { nextPageCursor: null } })
    },
  })
  await client.projects.listAssets({ projectId: 'project/?# +', pageCursor: 'a+/=&?#中文' })
  expect(requested?.pathname).toBe('/v1/projects/project%2F%3F%23%20%2B/assets')
  expect(requested?.searchParams.get('pageCursor')).toBe('a+/=&?#中文')
})
