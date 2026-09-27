import { createApiError } from './errors'
import type { IApiEnvelope } from './types'

export const readPage = <T>(
  envelope: IApiEnvelope<T[]>
): {
  items: T[]
  nextPageCursor: string | null
} => {
  const cursor = envelope.meta.nextPageCursor
  if (
    !Array.isArray(envelope.data) ||
    (cursor !== undefined && cursor !== null && typeof cursor !== 'string')
  ) {
    throw createApiError(200, null)
  }
  return { items: envelope.data, nextPageCursor: cursor ?? null }
}
