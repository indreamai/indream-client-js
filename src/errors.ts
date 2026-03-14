import type { IApiProblem } from './types'

export class APIError extends Error {
  readonly status: number
  readonly type: string
  readonly detail: string
  readonly errorCode?: string

  constructor(problem: IApiProblem) {
    super(problem.detail || problem.title)
    this.name = 'APIError'
    this.status = problem.status
    this.type = problem.type
    this.detail = problem.detail
    this.errorCode = problem.errorCode
  }
}

export class AuthError extends APIError {
  constructor(problem: IApiProblem) {
    super(problem)
    this.name = 'AuthError'
  }
}

export class ValidationError extends APIError {
  constructor(problem: IApiProblem) {
    super(problem)
    this.name = 'ValidationError'
  }
}

export class RateLimitError extends APIError {
  constructor(problem: IApiProblem) {
    super(problem)
    this.name = 'RateLimitError'
  }
}

export const toApiProblem = (status: number, payload: unknown): IApiProblem => {
  if (payload && typeof payload === 'object') {
    const problem = payload as Partial<IApiProblem>
    if (typeof problem.type === 'string' && typeof problem.title === 'string') {
      return {
        type: problem.type,
        title: problem.title,
        status: Number(problem.status || status),
        detail: String(problem.detail || problem.title),
        errorCode: problem.errorCode,
      }
    }
  }

  return {
    type: 'INTERNAL_ERROR',
    title: 'Internal server error',
    status,
    detail: 'Unexpected API response',
    errorCode: 'SDK_UNEXPECTED_RESPONSE',
  }
}

export const createApiError = (status: number, payload: unknown): APIError => {
  const problem = toApiProblem(status, payload)

  if (status === 401 || status === 403) {
    return new AuthError(problem)
  }

  if (status === 422 || status === 400) {
    return new ValidationError(problem)
  }

  if (status === 429) {
    return new RateLimitError(problem)
  }

  return new APIError(problem)
}
