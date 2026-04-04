import { describe, expect, it } from 'vitest'
import { isExportWebhookEvent, parseExportWebhookEvent } from '../../src/webhooks'

describe('webhook payload contract', () => {
  it('accepts event envelope with task snapshot', () => {
    const payload = {
      eventType: 'EXPORT_COMPLETED',
      occurredAt: '2026-03-11T13:00:00.000Z',
      task: {
        taskId: '638ad4d9-51e5-42ec-bb50-0db761bba304',
        projectId: '93fb8aa8-c301-441d-bb8d-ea733cd72a7e',
        createdByApiKeyId: '36daa18d-1cfb-4828-bef4-309e27de4235',
        clientTaskId: 'client-1',
        status: 'COMPLETED',
        progress: 100,
        error: null,
        outputUrl: 'https://example.com/output.mp4',
        durationSeconds: 18.4,
        billedStandardSeconds: 32,
        chargedCredits: '1.6',
        callbackUrl: 'https://example.com/callback',
        createdAt: '2026-03-11T12:59:00.000Z',
        completedAt: '2026-03-11T13:00:00.000Z',
      },
    }

    expect(isExportWebhookEvent(payload)).toBe(true)

    const parsed = parseExportWebhookEvent(payload)
    expect(parsed.eventType).toBe('EXPORT_COMPLETED')
    expect(parsed.task.projectId).toBe('93fb8aa8-c301-441d-bb8d-ea733cd72a7e')
    expect(parsed.task.status).toBe('COMPLETED')
    expect(parsed.task.durationSeconds).toBe(18.4)
    expect(parsed.task.billedStandardSeconds).toBe(32)
  })

  it('rejects legacy data/meta shape', () => {
    const legacyPayload = {
      eventType: 'EXPORT_COMPLETED',
      occurredAt: '2026-03-11T13:00:00.000Z',
      data: {
        taskId: 'b310d6d5-3d53-423e-8417-d0878e5bd5f5',
      },
      meta: {},
    }

    expect(isExportWebhookEvent(legacyPayload)).toBe(false)
    expect(() => parseExportWebhookEvent(legacyPayload)).toThrow(/Invalid export webhook payload/)
  })

  it('rejects lowercase or unknown event types', () => {
    const invalidPayload = {
      eventType: 'export_completed',
      occurredAt: '2026-03-11T13:00:00.000Z',
      task: {
        taskId: 'f8353d52-c938-4949-a452-376e3d1c92eb',
        projectId: null,
        createdByApiKeyId: null,
        clientTaskId: null,
        status: 'COMPLETED',
        progress: 100,
        error: null,
        outputUrl: null,
        durationSeconds: 4.8,
        billedStandardSeconds: 10,
        chargedCredits: '0.5',
        callbackUrl: null,
        createdAt: '2026-03-11T12:59:00.000Z',
        completedAt: '2026-03-11T13:00:00.000Z',
      },
    }

    expect(isExportWebhookEvent(invalidPayload)).toBe(false)
  })
})
