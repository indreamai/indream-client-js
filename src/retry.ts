export interface IRetryOptions {
  maxRetries: number
  shouldRetry: (error: unknown) => boolean
  retryAfterMs?: (error: unknown) => number | undefined
  signal?: AbortSignal
}

export const shouldRetryStatus = (status: number, errorCode?: string): boolean =>
  errorCode !== 'OPEN_API_EXPORT_STANDARD_SECOND_LIMIT_EXCEEDED' &&
  (status === 429 || [408, 500, 502, 503, 504].includes(status))

export const computeRetryDelay = (attempt: number, baseDelayMs = 300, maxDelayMs = 3000): number =>
  Math.min(maxDelayMs, baseDelayMs * 2 ** attempt) + Math.floor(Math.random() * 100)

export const parseRetryAfter = (value: string | null): number | undefined => {
  if (!value?.trim()) return undefined
  const seconds = Number(value)
  const delay = Number.isFinite(seconds) ? seconds * 1000 : Date.parse(value) - Date.now()
  return Number.isFinite(delay) && delay >= 0 ? Math.min(delay, 60_000) : undefined
}

export const sleep = async (ms: number, signal?: AbortSignal): Promise<void> => {
  signal?.throwIfAborted()
  await new Promise<void>((resolve, reject) => {
    const onAbort = () => {
      clearTimeout(timer)
      reject(signal?.reason ?? new DOMException('Request aborted', 'AbortError'))
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

export const withRetry = async <T>(
  execute: (attempt: number) => Promise<T>,
  options: IRetryOptions
): Promise<T> => {
  for (let attempt = 0; ; attempt += 1) {
    options.signal?.throwIfAborted()
    try {
      return await execute(attempt)
    } catch (error) {
      if (options.signal?.aborted || attempt >= options.maxRetries || !options.shouldRetry(error)) {
        throw error
      }
      await sleep(options.retryAfterMs?.(error) ?? computeRetryDelay(attempt), options.signal)
    }
  }
}
