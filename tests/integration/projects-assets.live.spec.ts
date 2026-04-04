import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import { IndreamClient } from '../../src/client'
import { APIError } from '../../src/errors'
import type { IAsset, TEditorStateV1 } from '../../src/types'
import { getIndreamApiKey, getIndreamApiUrl } from '../utils/env'

const staticTrack = (value: number) => ({ value, keyframes: [] })

const buildLiveProjectState = (params?: { color?: string }): TEditorStateV1 => {
  return {
    timebaseTicksPerSecond: 240000,
    compositionWidth: 1280,
    compositionHeight: 720,
    outputRatio: '16:9',
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
        color: params?.color || '#158dff',
        shape: 'rectangle',
        startTicks: 0,
        durationTicks: 240000,
        top: staticTrack(100),
        left: staticTrack(100),
        width: staticTrack(320),
        height: staticTrack(320),
        scaleX: staticTrack(1),
        scaleY: staticTrack(1),
        opacity: staticTrack(1),
        isDraggingInTimeline: false,
        borderRadius: staticTrack(24),
        rotation: staticTrack(0),
        keepAspectRatio: false,
      },
    },
    transitions: {},
    globalBackground: {
      type: 'color',
      color: '#111827',
      gradient: null,
    },
    deletedAssets: [],
  }
}

const createLiveClient = () => {
  return new IndreamClient({
    apiKey: getIndreamApiKey(),
    baseURL: getIndreamApiUrl(),
    timeout: 120_000,
    pollIntervalMs: 3_000,
  })
}

const loadFixtureImage = async (): Promise<Buffer> => {
  return await readFile(
    new URL('../fixtures/live-assets/pexels-landscape-18686684.jpg', import.meta.url)
  )
}

const sleep = async (ms: number) => await new Promise((resolve) => setTimeout(resolve, ms))

const waitForProjectAsset = async (params: {
  client: IndreamClient
  projectId: string
  assetId: string
}): Promise<IAsset> => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    let pageCursor: string | undefined

    do {
      const page = await params.client.projects.listAssets({
        projectId: params.projectId,
        pageSize: 100,
        pageCursor,
      })
      const matched = page.items.find((item) => item.assetId === params.assetId)
      if (matched) {
        return matched
      }
      pageCursor = page.nextPageCursor || undefined
    } while (pageCursor)

    await sleep(1_000)
  }

  throw new Error(`Asset ${params.assetId} did not appear in project ${params.projectId}`)
}

describe('live projects and assets flow', () => {
  it(
    'creates a project, uploads an asset, exports from the project, and cleans up',
    async () => {
      const client = createLiveClient()
      const suffix = randomUUID().slice(0, 8)
      const fixture = await loadFixtureImage()

      let projectId: string | null = null
      let assetId: string | null = null
      let assetBoundToProject = false

      try {
        const createdProject = await client.projects.create(
          {
            title: `Live SDK Project ${suffix}`,
            description: 'Real environment project/assets integration test',
            editorState: buildLiveProjectState(),
          },
          {
            idempotencyKey: `live-project-${suffix}`,
          }
        )

        projectId = createdProject.projectId
        expect(projectId).toBeTruthy()

        const fetchedProject = await client.projects.get(projectId)
        expect(fetchedProject.projectId).toBe(projectId)
        expect(fetchedProject.editorState.compositionWidth).toBe(1280)

        const updatedProject = await client.projects.update(projectId, {
          title: `Live SDK Project ${suffix} Updated`,
          description: 'Updated during live integration test',
        })
        expect(updatedProject.projectId).toBe(projectId)
        expect(updatedProject.title).toContain('Updated')

        const syncedProject = await client.projects.sync(projectId, {
          editorState: buildLiveProjectState({ color: '#22c55e' }),
        })
        expect(syncedProject.projectId).toBe(projectId)

        const reloadedProject = await client.projects.get(projectId)
        expect(reloadedProject.editorState.items['item-solid-1']?.type).toBe('solid')
        expect(
          (reloadedProject.editorState.items['item-solid-1'] as { color?: string }).color
        ).toBe('#22c55e')

        const createdExport = await client.projects.createExport(
          projectId,
          {
            ratio: '16:9',
            scale: 0.6,
            fps: 30,
            format: 'mp4',
          },
          {
            idempotencyKey: `live-project-export-${suffix}`,
          }
        )
        expect(createdExport.taskId).toBeTruthy()
        expect(createdExport.projectId).toBe(projectId)

        const completedExport = await client.exports.wait(createdExport.taskId, {
          timeoutMs: 20 * 60 * 1000,
          pollIntervalMs: 3_000,
        })
        expect(completedExport.taskId).toBe(createdExport.taskId)
        expect(completedExport.projectId).toBe(projectId)
        expect(completedExport.status).toBe('COMPLETED')
        expect(completedExport.outputUrl).toBeTruthy()

        let uploadedAsset
        try {
          uploadedAsset = await client.uploads.upload(fixture, {
            filename: 'pexels-landscape-18686684.jpg',
            contentType: 'image/jpeg',
          })
        } catch (error) {
          if (error instanceof APIError) {
            throw new Error(
              `Upload failed with ${error.status} ${error.errorCode || 'UNKNOWN_ERROR'}: ${error.detail}`
            )
          }
          throw error
        }
        assetId = uploadedAsset.assetId
        expect(assetId).toBeTruthy()
        expect(uploadedAsset.fileUrl).toContain('http')

        const fetchedAsset = await client.assets.get(assetId)
        expect(fetchedAsset.assetId).toBe(assetId)
        expect(fetchedAsset.filename).toBe('pexels-landscape-18686684.jpg')

        const binding = await client.projects.addAsset(projectId, assetId)
        assetBoundToProject = true
        expect(binding.projectId).toBe(projectId)
        expect(binding.assetId).toBe(assetId)

        const listedAsset = await waitForProjectAsset({
          client,
          projectId,
          assetId,
        })
        expect(listedAsset.assetId).toBe(assetId)
        expect(listedAsset.fileKey).toBe(fetchedAsset.fileKey)

        const removedBinding = await client.projects.removeAsset(projectId, assetId)
        assetBoundToProject = false
        expect(removedBinding.deleted).toBe(true)
        expect(removedBinding.assetId).toBe(assetId)

        const deletedAsset = await client.assets.delete(assetId)
        assetId = null
        expect(deletedAsset.deleted).toBe(true)

        const deletedProject = await client.projects.delete(projectId)
        projectId = null
        expect(deletedProject.deleted).toBe(true)
      } finally {
        if (assetBoundToProject && projectId && assetId) {
          try {
            await client.projects.removeAsset(projectId, assetId)
          } catch {
            // Best-effort cleanup to avoid leaving references behind after a test failure.
          }
        }

        if (projectId) {
          try {
            await client.projects.delete(projectId)
          } catch {
            // Ignore cleanup failures so the first business assertion remains the primary error.
          }
        }

        if (assetId) {
          try {
            await client.assets.delete(assetId)
          } catch {
            // Ignore cleanup failures to avoid masking the original live API error.
          }
        }
      }
    },
    25 * 60 * 1000
  )
})
