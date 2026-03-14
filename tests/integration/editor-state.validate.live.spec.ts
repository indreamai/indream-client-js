import { describe, expect, it } from 'vitest'
import { ValidationError } from '../../src/errors'
import { IndreamClient } from '../../src/client'
import { getIndreamApiKey, getIndreamApiUrl } from '../utils/env'
import { editorStateExamples } from '../editor-state/fixtures/examples'

const createLiveClient = () => {
  return new IndreamClient({
    apiKey: getIndreamApiKey(),
    baseURL: getIndreamApiUrl(),
    timeout: 120_000,
    pollIntervalMs: 3_000,
  })
}

const buildImageTransitionState = (): Record<string, unknown> => {
  return {
    compositionWidth: 1280,
    compositionHeight: 720,
    timebaseTicksPerSecond: 240000,
    outputRatio: '16:9',
    tracks: [
      {
        id: 'track-1',
        hidden: false,
        muted: false,
        items: ['item-image-1', 'item-solid-1'],
      },
    ],
    assets: {
      'asset-image-1': {
        id: 'asset-image-1',
        type: 'image',
        filename: 'cover.png',
        size: 1024,
        remoteUrl: 'https://example.com/cover.png',
        remoteKey: 'cover.png',
        mimeType: 'image/png',
        width: 1280,
        height: 720,
      },
    },
    items: {
      'item-image-1': {
        id: 'item-image-1',
        type: 'image',
        assetId: 'asset-image-1',
        startTicks: 0,
        durationTicks: 120,
        top: 0,
        left: 0,
        width: 1280,
        height: 720,
        opacity: 1,
        isDraggingInTimeline: false,
        keepAspectRatio: true,
        borderRadius: 0,
        rotation: 0,
      },
      'item-solid-1': {
        id: 'item-solid-1',
        type: 'solid',
        color: '#111827',
        shape: 'rectangle',
        startTicks: 120,
        durationTicks: 120,
        top: 0,
        left: 0,
        width: 1280,
        height: 720,
        opacity: 1,
        isDraggingInTimeline: false,
        keepAspectRatio: false,
        borderRadius: 0,
        rotation: 0,
      },
    },
    transitions: {
      'transition-1': {
        id: 'transition-1',
        trackId: 'track-1',
        fromClipId: 'item-image-1',
        toClipId: 'item-solid-1',
        type: 'fade',
        durationTicks: 15,
        easing: 'ease-in-out',
      },
    },
    globalBackground: {
      type: 'color',
      color: '#111827',
      gradient: null,
    },
  }
}

const buildVideoState = (): Record<string, unknown> => {
  return {
    compositionWidth: 1280,
    compositionHeight: 720,
    timebaseTicksPerSecond: 240000,
    tracks: [
      {
        id: 'track-1',
        hidden: false,
        muted: false,
        items: ['item-video-1'],
      },
    ],
    assets: {
      'asset-video-1': {
        id: 'asset-video-1',
        type: 'video',
        filename: 'clip.mp4',
        size: 4096,
        remoteUrl: 'https://example.com/clip.mp4',
        remoteKey: 'clip.mp4',
        mimeType: 'video/mp4',
        durationInSeconds: 4,
        hasAudioTrack: true,
        width: 1280,
        height: 720,
      },
    },
    items: {
      'item-video-1': {
        id: 'item-video-1',
        type: 'video',
        assetId: 'asset-video-1',
        startTicks: 0,
        durationTicks: 240,
        top: 0,
        left: 0,
        width: 1280,
        height: 720,
        opacity: 1,
        isDraggingInTimeline: false,
        keepAspectRatio: true,
        borderRadius: 0,
        rotation: 0,
        videoStartFromInSeconds: 0,
        decibelAdjustment: 0,
        playbackRate: 1,
        audioFadeInDurationInSeconds: 0,
        audioFadeOutDurationInSeconds: 0,
      },
    },
    transitions: {},
  }
}

const buildTextTemplateState = (): Record<string, unknown> => {
  return {
    compositionWidth: 1280,
    compositionHeight: 720,
    timebaseTicksPerSecond: 240000,
    tracks: [
      {
        id: 'track-1',
        hidden: false,
        muted: false,
        items: ['item-template-1'],
      },
    ],
    assets: {},
    items: {
      'item-template-1': {
        id: 'item-template-1',
        type: 'text-template',
        schemaVersion: 2,
        templateId: 'template-1',
        templateCategory: 'cover',
        nodes: [
          {
            type: 'image',
            key: 'hero',
          },
          {
            type: 'text',
            key: 'title',
            text: 'hello',
          },
        ],
        startTicks: 0,
        durationTicks: 120,
        top: 0,
        left: 0,
        width: 1280,
        height: 720,
        opacity: 1,
        isDraggingInTimeline: false,
      },
    },
    transitions: {},
    brandRuntime: {
      brandId: 'brand-1',
      logoX: 50,
      logoY: 20,
      managedItemIds: ['item-template-1'],
      managedAssetIds: [],
      introShiftInFrames: 0,
      overlayTrackId: null,
      underlayTrackId: null,
    },
  }
}

describe('live editor-state validation scenarios', () => {
  it('validates image + transition + color background state', async () => {
    const client = createLiveClient()
    const result = await client.editor.validate(buildImageTransitionState())

    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  }, 120_000)

  it('validates media playback state', async () => {
    const client = createLiveClient()
    const result = await client.editor.validate(buildVideoState())

    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  }, 120_000)

  it('validates text-template state', async () => {
    const client = createLiveClient()
    const result = await client.editor.validate(buildTextTemplateState())

    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  }, 120_000)

  it('rejects invalid effect example', async () => {
    const client = createLiveClient()

    try {
      const result = await client.editor.validate(editorStateExamples.invalidEffect)
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError)
    }
  }, 120_000)
})
