import { mkdir, writeFile } from 'node:fs/promises'
import { extname, resolve } from 'node:path'
import { randomUUID } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { IndreamClient } from '../../src/client'
import { getIndreamApiKey, getIndreamApiUrl } from '../utils/env'

const buildLiveEditorState = (): Record<string, unknown> => {
  return {
    timebaseTicksPerSecond: 240000,
    compositionWidth: 1280,
    compositionHeight: 720,
    tracks: [
      {
        id: 'track-main',
        hidden: false,
        muted: false,
        items: ['item-solid-1'],
      },
    ],
    assets: {},
    items: {
      'item-solid-1': {
        id: 'item-solid-1',
        type: 'solid',
        color: '#158dff',
        shape: 'rectangle',
        startTicks: 0,
        durationTicks: 240000,
        top: 100,
        left: 100,
        width: 200,
        height: 350,
        opacity: 1,
        isDraggingInTimeline: false,
        borderRadius: 0,
        rotation: 0,
        keepAspectRatio: false,
      },
    },
    transitions: {},
    globalBackground: {
      type: 'color',
      color: '#111827',
      gradient: null,
    },
  }
}

const guessOutputExtension = (url: string, contentType: string | null): string => {
  const pathnameExt = extname(new URL(url).pathname).toLowerCase()
  if (pathnameExt) {
    return pathnameExt
  }

  if (!contentType) {
    return '.mp4'
  }

  if (contentType.includes('video/webm')) {
    return '.webm'
  }

  return '.mp4'
}

const saveOutputArtifact = async (taskId: string, outputUrl: string): Promise<string> => {
  const response = await fetch(outputUrl)
  if (!response.ok) {
    throw new Error(`Failed to download output file. HTTP ${response.status}`)
  }

  const buffer = Buffer.from(await response.arrayBuffer())
  if (buffer.length === 0) {
    throw new Error('Downloaded output file is empty.')
  }

  const outputDir = resolve(process.cwd(), 'tests/artifacts')
  await mkdir(outputDir, { recursive: true })

  const extension = guessOutputExtension(outputUrl, response.headers.get('content-type'))
  const artifactPath = resolve(outputDir, `${taskId}${extension}`)
  await writeFile(artifactPath, buffer)
  return artifactPath
}

describe('live open api export flow', () => {
  it(
    'runs validate -> create -> wait -> get and saves output artifact',
    async () => {
      const client = new IndreamClient({
        apiKey: getIndreamApiKey(),
        baseURL: getIndreamApiUrl(),
        timeout: 120_000,
        pollIntervalMs: 3_000,
      })

      const editorState = buildLiveEditorState()
      const validation = await client.editor.validate(editorState)
      expect(validation.valid).toBe(true)
      expect(validation.errors).toHaveLength(0)

      const created = await client.exports.create(
        {
          editorState,
          ratio: '16:9',
          scale: 0.6,
          fps: 30,
          format: 'mp4',
        },
        {
          idempotencyKey: `live-${Date.now()}-${randomUUID()}`,
        }
      )

      expect(created.taskId.length).toBeGreaterThan(0)

      const completed = await client.exports.wait(created.taskId, {
        timeoutMs: 20 * 60 * 1000,
        pollIntervalMs: 3_000,
      })

      expect(completed.status).toBe('COMPLETED')
      expect(typeof completed.outputUrl).toBe('string')
      expect(completed.outputUrl).toBeTruthy()

      const task = await client.exports.get(created.taskId)
      expect(task.taskId).toBe(created.taskId)
      expect(task.status).toBe('COMPLETED')
      expect(typeof task.outputUrl).toBe('string')
      expect(task.outputUrl).toBeTruthy()

      const artifactPath = await saveOutputArtifact(created.taskId, task.outputUrl as string)
      expect(artifactPath).toContain('tests/artifacts/')
    },
    25 * 60 * 1000
  )
})
