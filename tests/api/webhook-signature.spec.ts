import { describe, expect, it } from 'vitest'
import { verifyExportWebhookRequest, verifyExportWebhookSignature } from '../../src/webhooks'

const WEBHOOK_SECRET = 'whs_indream_test_secret'
const RAW_BODY =
  '{"eventType":"EXPORT_COMPLETED","task":{"taskId":"638ad4d9-51e5-42ec-bb50-0db761bba304"}}'
const TIMESTAMP = '1710307200'
const VALID_SIGNATURE = '0967e30ab5a11ccd298ad131166419d2384b54f38390e6ab52db71a01ad6161a'

describe('webhook signature verification', () => {
  it('verifies signature with timestamp + raw body payload', async () => {
    const valid = await verifyExportWebhookSignature({
      webhookSecret: WEBHOOK_SECRET,
      timestamp: TIMESTAMP,
      rawBody: RAW_BODY,
      signature: VALID_SIGNATURE,
    })

    expect(valid).toBe(true)
  })

  it('rejects wrong signature', async () => {
    const valid = await verifyExportWebhookSignature({
      webhookSecret: WEBHOOK_SECRET,
      timestamp: TIMESTAMP,
      rawBody: RAW_BODY,
      signature: '0'.repeat(64),
    })

    expect(valid).toBe(false)
  })

  it('verifies request signature from Headers object', async () => {
    const valid = await verifyExportWebhookRequest({
      webhookSecret: WEBHOOK_SECRET,
      rawBody: RAW_BODY,
      headers: new Headers({
        'X-Indream-Timestamp': TIMESTAMP,
        'X-Indream-Signature': VALID_SIGNATURE,
      }),
      nowTimestampSeconds: Number(TIMESTAMP),
      maxSkewSeconds: 300,
    })

    expect(valid).toBe(true)
  })

  it('verifies request signature from plain object headers', async () => {
    const valid = await verifyExportWebhookRequest({
      webhookSecret: WEBHOOK_SECRET,
      rawBody: RAW_BODY,
      headers: {
        'x-indream-timestamp': TIMESTAMP,
        'x-indream-signature': VALID_SIGNATURE,
      },
      nowTimestampSeconds: Number(TIMESTAMP),
      maxSkewSeconds: 300,
    })

    expect(valid).toBe(true)
  })

  it('rejects request when headers are missing', async () => {
    const valid = await verifyExportWebhookRequest({
      webhookSecret: WEBHOOK_SECRET,
      rawBody: RAW_BODY,
      headers: {},
      nowTimestampSeconds: Number(TIMESTAMP),
    })

    expect(valid).toBe(false)
  })

  it('rejects request when timestamp exceeds skew window', async () => {
    const valid = await verifyExportWebhookRequest({
      webhookSecret: WEBHOOK_SECRET,
      rawBody: RAW_BODY,
      headers: {
        'x-indream-timestamp': TIMESTAMP,
        'x-indream-signature': VALID_SIGNATURE,
      },
      nowTimestampSeconds: Number(TIMESTAMP) + 301,
      maxSkewSeconds: 300,
    })

    expect(valid).toBe(false)
  })
})
