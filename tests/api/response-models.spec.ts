import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { IndreamClient } from '../../src/client'
import contracts from '../../src/generated/response-contracts.json'

const fixture = JSON.parse(
  readFileSync(new URL('../../openapi/fixtures/sdk-contract.json', import.meta.url), 'utf8')
)
const editorState = JSON.parse(
  readFileSync(new URL('../../openapi/examples/editor-state.valid.json', import.meta.url), 'utf8')
)

describe('response model validation', () => {
  it.each(contracts.routes)(
    'rejects invalid data from $method $path before returning it',
    async ({ method, path }) => {
      let calls = 0
      const client = new IndreamClient({
        apiKey: 'test',
        fetch: async () => {
          calls += 1
          return Response.json({ data: null, meta: {} })
        },
      })
      await expect(
        client.requestEnvelope(path.replace(/\{[^}]+\}/g, 'test-id'), {
          method: method as 'GET' | 'POST' | 'DELETE' | 'PATCH',
        })
      ).rejects.toMatchObject({ status: 200, errorCode: 'SDK_UNEXPECTED_RESPONSE' })
      expect(calls).toBe(1)
    }
  )

  it.each([
    { ...fixture.taskResponse.data, status: 'UNKNOWN' },
    { ...fixture.taskResponse.data, exportPhase: null },
    { ...fixture.taskResponse.data, progress: '100' },
    {},
  ])('stops polling immediately on a malformed task', async (task) => {
    let calls = 0
    const client = new IndreamClient({
      apiKey: 'test',
      fetch: async () => {
        calls += 1
        return Response.json({ data: task, meta: {} })
      },
    })
    await expect(client.exports.wait('test-id')).rejects.toMatchObject({
      errorCode: 'SDK_UNEXPECTED_RESPONSE',
    })
    expect(calls).toBe(1)
  })

  it('accepts a full canonical project response without a State Engine dependency', async () => {
    const data = {
      projectId: 'project-1',
      title: 'First video',
      description: null,
      createdAt: '2026-09-25T00:00:00Z',
      updatedAt: '2026-09-25T00:00:00Z',
      stateSchemaVersion: 'v1',
      editorState,
    }
    const client = new IndreamClient({
      apiKey: 'test',
      fetch: async () => Response.json({ data, meta: {} }),
    })
    expect(await client.projects.get('project-1')).toEqual(data)
  })
})
