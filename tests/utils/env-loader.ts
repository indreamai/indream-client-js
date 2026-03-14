import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const DOT_ENV_LOCAL = '.env.local'
let hasLoadedDotEnvLocal = false

const trimWrappingQuotes = (value: string): string => {
  const first = value.at(0)
  const last = value.at(-1)
  if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
    return value.slice(1, -1)
  }
  return value
}

const parseEnvLine = (rawLine: string): [string, string] | null => {
  const line = rawLine.trim()
  if (!line || line.startsWith('#')) {
    return null
  }

  const normalized = line.startsWith('export ') ? line.slice(7).trim() : line
  const separatorIndex = normalized.indexOf('=')
  if (separatorIndex <= 0) {
    return null
  }

  const key = normalized.slice(0, separatorIndex).trim()
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
    return null
  }

  const rawValue = normalized.slice(separatorIndex + 1).trim()
  return [key, trimWrappingQuotes(rawValue)]
}

export const loadDotEnvLocal = (): void => {
  if (hasLoadedDotEnvLocal) {
    return
  }
  hasLoadedDotEnvLocal = true

  const envPath = resolve(process.cwd(), DOT_ENV_LOCAL)
  if (!existsSync(envPath)) {
    return
  }

  const fileContent = readFileSync(envPath, 'utf8')
  for (const line of fileContent.split(/\r?\n/u)) {
    const parsed = parseEnvLine(line)
    if (!parsed) {
      continue
    }

    const [key, value] = parsed
    if (process.env[key] === undefined) {
      process.env[key] = value
    }
  }
}
