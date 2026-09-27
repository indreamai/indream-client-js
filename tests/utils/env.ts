const MOCK_API_KEY = 'sk_indream_mock'

export const getMockApiKey = (): string => {
  return MOCK_API_KEY
}

export const getRequiredEnv = (key: string): string => {
  const value = process.env[key]?.trim()
  if (!value) {
    throw new Error(
      `Missing required environment variable ${key}. Supply it explicitly when running live tests.`
    )
  }
  return value
}

export const getIndreamApiKey = (): string => {
  return getRequiredEnv('INDREAM_API_KEY')
}

export const getIndreamApiUrl = (): string => {
  return getRequiredEnv('INDREAM_API_URL').replace(/\/$/, '')
}
