import {
  type IExportTask,
  type IExportWebhookEvent,
  type TExportWebhookEventType,
  type TTaskStatus,
} from './types'

const INDREAM_WEBHOOK_TIMESTAMP_HEADER = 'X-Indream-Timestamp'
const INDREAM_WEBHOOK_SIGNATURE_HEADER = 'X-Indream-Signature'
const DEFAULT_WEBHOOK_MAX_SKEW_SECONDS = 300

const EXPORT_WEBHOOK_EVENT_TYPES = new Set<TExportWebhookEventType>([
  'EXPORT_STARTED',
  'EXPORT_COMPLETED',
  'EXPORT_FAILED',
])

const TASK_STATUSES = new Set<TTaskStatus>([
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
  'PAUSED',
  'CANCELED',
])

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isNullableString = (value: unknown): value is string | null =>
  typeof value === 'string' || value === null

type TWebhookHeaderValue = string | string[] | null | undefined

export type TWebhookHeaders = Headers | Record<string, TWebhookHeaderValue>

export interface IVerifyExportWebhookSignatureParams {
  webhookSecret: string
  timestamp: string
  rawBody: string
  signature: string
}

export interface IVerifyExportWebhookRequestParams {
  webhookSecret: string
  rawBody: string
  headers: TWebhookHeaders
  maxSkewSeconds?: number
  nowTimestampSeconds?: number
}

const toArrayBuffer = (bytes: Uint8Array): ArrayBuffer => {
  const copy = new Uint8Array(bytes.byteLength)
  copy.set(bytes)
  return copy.buffer
}

const toUtf8ArrayBuffer = (value: string): ArrayBuffer =>
  toArrayBuffer(new TextEncoder().encode(value))

const parseHexToBytes = (value: string): Uint8Array | null => {
  const normalized = value.trim().toLowerCase()
  if (!/^[0-9a-f]+$/.test(normalized) || normalized.length % 2 !== 0) {
    return null
  }

  const bytes = new Uint8Array(normalized.length / 2)
  for (let index = 0; index < bytes.length; index += 1) {
    const start = index * 2
    bytes[index] = Number.parseInt(normalized.slice(start, start + 2), 16)
  }

  return bytes
}

const parseTimestampSeconds = (value: string): number | null => {
  if (!/^\d+$/.test(value)) {
    return null
  }

  const parsed = Number(value)
  if (!Number.isSafeInteger(parsed)) {
    return null
  }

  return parsed
}

const resolveHeaderValue = (headers: TWebhookHeaders, targetKey: string): string | null => {
  if (headers instanceof Headers) {
    const value = headers.get(targetKey)
    if (typeof value !== 'string') {
      return null
    }
    const trimmed = value.trim()
    return trimmed ? trimmed : null
  }

  const lowerKey = targetKey.toLowerCase()
  for (const [key, rawValue] of Object.entries(headers)) {
    if (key.toLowerCase() !== lowerKey) {
      continue
    }

    const value = Array.isArray(rawValue) ? rawValue[0] : rawValue
    if (typeof value !== 'string') {
      return null
    }

    const trimmed = value.trim()
    return trimmed ? trimmed : null
  }

  return null
}

export const isExportWebhookEventType = (value: unknown): value is TExportWebhookEventType =>
  typeof value === 'string' && EXPORT_WEBHOOK_EVENT_TYPES.has(value as TExportWebhookEventType)

export const isTaskStatus = (value: unknown): value is TTaskStatus =>
  typeof value === 'string' && TASK_STATUSES.has(value as TTaskStatus)

export const isExportTaskSnapshot = (value: unknown): value is IExportTask => {
  if (!isObject(value)) {
    return false
  }

  return (
    typeof value.taskId === 'string' &&
    isNullableString(value.createdByApiKeyId) &&
    isNullableString(value.clientTaskId) &&
    isTaskStatus(value.status) &&
    typeof value.progress === 'number' &&
    isNullableString(value.error) &&
    isNullableString(value.outputUrl) &&
    typeof value.durationSeconds === 'number' &&
    typeof value.billedStandardSeconds === 'number' &&
    typeof value.chargedCredits === 'string' &&
    isNullableString(value.callbackUrl) &&
    typeof value.createdAt === 'string' &&
    isNullableString(value.completedAt)
  )
}

export const isExportWebhookEvent = (value: unknown): value is IExportWebhookEvent => {
  if (!isObject(value)) {
    return false
  }

  return (
    isExportWebhookEventType(value.eventType) &&
    typeof value.occurredAt === 'string' &&
    isExportTaskSnapshot(value.task)
  )
}

export const parseExportWebhookEvent = (value: unknown): IExportWebhookEvent => {
  if (!isExportWebhookEvent(value)) {
    throw new TypeError('Invalid export webhook payload')
  }

  return value
}

export const verifyExportWebhookSignature = async ({
  webhookSecret,
  timestamp,
  rawBody,
  signature,
}: IVerifyExportWebhookSignatureParams): Promise<boolean> => {
  if (!webhookSecret || !timestamp || !signature) {
    return false
  }

  const signatureBytes = parseHexToBytes(signature)
  if (!signatureBytes) {
    return false
  }

  const subtle = globalThis.crypto?.subtle
  if (!subtle) {
    throw new Error('Web Crypto subtle API is not available in current runtime')
  }

  const key = await subtle.importKey(
    'raw',
    toUtf8ArrayBuffer(webhookSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  )

  return subtle.verify(
    'HMAC',
    key,
    toArrayBuffer(signatureBytes),
    toUtf8ArrayBuffer(`${timestamp}.${rawBody}`)
  )
}

export const verifyExportWebhookRequest = async ({
  webhookSecret,
  rawBody,
  headers,
  maxSkewSeconds = DEFAULT_WEBHOOK_MAX_SKEW_SECONDS,
  nowTimestampSeconds = Math.floor(Date.now() / 1000),
}: IVerifyExportWebhookRequestParams): Promise<boolean> => {
  const timestamp = resolveHeaderValue(headers, INDREAM_WEBHOOK_TIMESTAMP_HEADER)
  const signature = resolveHeaderValue(headers, INDREAM_WEBHOOK_SIGNATURE_HEADER)
  if (!timestamp || !signature) {
    return false
  }

  const parsedTimestamp = parseTimestampSeconds(timestamp)
  if (parsedTimestamp === null || !Number.isFinite(maxSkewSeconds) || maxSkewSeconds < 0) {
    return false
  }

  // Use a time window to limit the acceptable range of requests and prevent old webhooks from being replayed.
  if (Math.abs(nowTimestampSeconds - parsedTimestamp) > maxSkewSeconds) {
    return false
  }

  return verifyExportWebhookSignature({
    webhookSecret,
    timestamp,
    rawBody,
    signature,
  })
}
