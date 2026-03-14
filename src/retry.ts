export interface IRetryOptions {
  maxRetries: number
  baseDelayMs?: number
  maxDelayMs?: number
}

const sleep = async (ms: number) => {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

export const shouldRetryStatus = (status: number) => {
  return status === 429 || status >= 500
}

export const computeRetryDelay = (
  attempt: number,
  baseDelayMs = 300,
  maxDelayMs = 3000
): number => {
  const exponential = Math.min(maxDelayMs, baseDelayMs * 2 ** attempt)
  const jitter = Math.floor(Math.random() * 100)
  return exponential + jitter
}

export const withRetry = async <T>(
  execute: (attempt: number) => Promise<T>,
  options: IRetryOptions
): Promise<T> => {
  let attempt = 0

  while (true) {
    try {
      return await execute(attempt)
    } catch (error) {
      if (error && typeof error === 'object' && 'noRetry' in error) {
        throw error
      }

      if (attempt >= options.maxRetries) {
        throw error
      }

      // Apply exponential backoff with jitter to reduce retry spikes under shared throttling windows.
      const delay = computeRetryDelay(attempt, options.baseDelayMs, options.maxDelayMs)
      await sleep(delay)
      attempt += 1
    }
  }
}
