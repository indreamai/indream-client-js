import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const LIVE_ENV_KEYS = new Set(['INDREAM_RUN_LIVE_TESTS', 'INDREAM_API_KEY', 'INDREAM_API_URL'])

const unwrap = (value: string): string => {
  const first = value.at(0)
  const last = value.at(-1)
  if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
    return value.slice(1, -1)
  }
  return value
}

const loadLiveEnv = (): void => {
  const envPath = resolve(process.cwd(), '.env.local')
  if (!existsSync(envPath)) return

  for (const rawLine of readFileSync(envPath, 'utf8').split(/\r?\n/u)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue

    const normalized = line.startsWith('export ') ? line.slice(7).trim() : line
    const separatorIndex = normalized.indexOf('=')
    if (separatorIndex <= 0) continue

    const key = normalized.slice(0, separatorIndex).trim()
    if (!LIVE_ENV_KEYS.has(key) || process.env[key] !== undefined) continue

    process.env[key] = unwrap(normalized.slice(separatorIndex + 1).trim())
  }
}

loadLiveEnv()
