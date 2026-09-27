import { describe, expect, it } from 'vitest'
import { IndreamClient } from '../../src/client'
import type { IExportTask } from '../../src/types'
import { parseExportWebhookEvent } from '../../src/webhooks'

const task: IExportTask = {
  taskId: 'task-1',
  projectId: null,
  createdByApiKeyId: null,
  clientTaskId: null,
  status: 'CANCELED',
  progress: 0,
  error: null,
  outputUrl: null,
  filename: 'demo.mp4',
  durationSeconds: 5,
  billedStandardSeconds: 5,
  chargedCredits: '0',
  callbackUrl: null,
  createdAt: '2026-09-25T00:00:00Z',
  completedAt: '2026-09-25T00:00:01Z',
}

describe('export cancellation and progress fields', () => {
  it('returns the task snapshot for repeated cancellation', async () => {
    const client = new IndreamClient({
      apiKey: 'sk_indream_test',
      fetch: async (url, init) => {
        expect(String(url)).toBe('https://api.indream.ai/v1/exports/task-1')
        expect(init?.method).toBe('DELETE')
        return Response.json({ data: task, meta: {} })
      },
    })
    expect(await client.exports.cancel('task-1')).toEqual(task)
    expect(await client.exports.cancel('task-1')).toEqual(task)
  })

  it('preserves cancellation conflicts without retrying', async () => {
    let calls = 0
    const client = new IndreamClient({
      apiKey: 'sk_indream_test',
      fetch: async () => {
        calls += 1
        return Response.json(
          {
            type: 'CONFLICT',
            title: 'Conflict',
            status: 409,
            detail: 'Task has completed',
            errorCode: 'TASK_ALREADY_TERMINAL',
          },
          { status: 409 }
        )
      },
    })
    await expect(client.exports.cancel('task-1')).rejects.toMatchObject({
      status: 409,
      errorCode: 'TASK_ALREADY_TERMINAL',
    })
    expect(calls).toBe(1)
  })

  it('ends wait when canceled and preserves filename and exportPhase in webhooks', async () => {
    const client = new IndreamClient({
      apiKey: 'sk_indream_test',
      fetch: async () => Response.json({ data: task, meta: {} }),
    })
    await expect(client.exports.wait('task-1')).rejects.toMatchObject({
      errorCode: 'TASK_TERMINAL_FAILURE',
    })
    const event = parseExportWebhookEvent({
      eventType: 'EXPORT_STARTED',
      occurredAt: task.createdAt,
      task: { ...task, status: 'PROCESSING', exportPhase: 'saving' },
    })
    expect(event.task.filename).toBe('demo.mp4')
    expect(event.task.exportPhase).toBe('saving')
    expect(() =>
      parseExportWebhookEvent({ ...event, task: { ...event.task, exportPhase: 'unknown' } })
    ).toThrow(TypeError)
  })
})
