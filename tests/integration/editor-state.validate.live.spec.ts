import { describe, expect, it } from 'vitest'

const RUN_LIVE_INTEGRATION = process.env.INDREAM_RUN_LIVE_TESTS === '1'
const describeLive = RUN_LIVE_INTEGRATION ? describe : describe.skip

import { ValidationError } from '../../src/errors'
import { IndreamClient } from '../../src/client'
import type { TEditorStateV1 } from '../../src/types'
import { getIndreamApiKey, getIndreamApiUrl } from '../utils/env'
const createLiveClient = () => {
  return new IndreamClient({
    apiKey: getIndreamApiKey(),
    baseURL: getIndreamApiUrl(),
    timeout: 120_000,
    pollIntervalMs: 3_000,
  })
}

const staticTrack = (value: number) => ({ value, keyframes: [] })

const LIVE_VIDEO_REMOTE_URL =
  'https://r.indream.ai/system/presets/6aa4631a-10ea-4f33-afa4-a72d05094407.mp4'

const buildImageTransitionState = (): TEditorStateV1 => {
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
        top: staticTrack(0),
        left: staticTrack(0),
        width: staticTrack(1280),
        height: staticTrack(720),
        scaleX: staticTrack(1),
        scaleY: staticTrack(1),
        opacity: staticTrack(1),
        isDraggingInTimeline: false,
        keepAspectRatio: true,
        borderRadius: staticTrack(0),
        rotation: staticTrack(0),
      },
      'item-solid-1': {
        id: 'item-solid-1',
        type: 'solid',
        color: '#111827',
        shape: 'rectangle',
        startTicks: 120,
        durationTicks: 120,
        top: staticTrack(0),
        left: staticTrack(0),
        width: staticTrack(1280),
        height: staticTrack(720),
        scaleX: staticTrack(1),
        scaleY: staticTrack(1),
        opacity: staticTrack(1),
        isDraggingInTimeline: false,
        keepAspectRatio: false,
        borderRadius: staticTrack(0),
        rotation: staticTrack(0),
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

const buildVideoState = (): TEditorStateV1 => {
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
        items: ['item-video-1'],
      },
    ],
    assets: {
      'asset-video-1': {
        id: 'asset-video-1',
        type: 'video',
        filename: 'clip.mp4',
        size: 4096,
        remoteUrl: LIVE_VIDEO_REMOTE_URL,
        remoteKey: 'system/presets/6aa4631a-10ea-4f33-afa4-a72d05094407.mp4',
        mimeType: 'video/mp4',
        durationInSeconds: 4,
        hasAudioTrack: false,
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
        top: staticTrack(0),
        left: staticTrack(0),
        width: staticTrack(1280),
        height: staticTrack(720),
        scaleX: staticTrack(1),
        scaleY: staticTrack(1),
        opacity: staticTrack(1),
        isDraggingInTimeline: false,
        keepAspectRatio: true,
        borderRadius: staticTrack(0),
        rotation: staticTrack(0),
        cropLeft: staticTrack(0),
        cropTop: staticTrack(0),
        cropRight: staticTrack(0),
        cropBottom: staticTrack(0),
        videoStartFromInSeconds: 0,
        decibelAdjustment: staticTrack(0),
        playbackRate: 1,
        audioFadeInDurationInSeconds: 0,
        audioFadeOutDurationInSeconds: 0,
      },
    },
    transitions: {},
    globalBackground: {
      type: 'none',
    },
    brandRuntime: {
      brandId: null,
      logoX: 50,
      logoY: 50,
      managedItemIds: [],
      managedAssetIds: [],
      introShiftInFrames: 0,
      overlayTrackId: null,
      underlayTrackId: null,
    },
    deletedAssets: [],
  }
}

const buildInvalidEffectState = () => {
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
        items: ['item-effect-1'],
      },
    ],
    assets: {},
    items: {
      'item-effect-1': {
        id: 'item-effect-1',
        type: 'effect',
        effectType: 'UnknownEffect',
        intensity: 1,
        startTicks: 0,
        durationTicks: 30,
        isDraggingInTimeline: false,
      },
    },
    transitions: {},
    globalBackground: {
      type: 'none',
    },
    brandRuntime: {
      brandId: null,
      logoX: 50,
      logoY: 50,
      managedItemIds: [],
      managedAssetIds: [],
      introShiftInFrames: 0,
      overlayTrackId: null,
      underlayTrackId: null,
    },
    deletedAssets: [],
  }
}

const buildTextTemplateState = (): TEditorStateV1 => {
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
        items: ['item-template-1'],
      },
    ],
    assets: {},
    items: {
      'item-template-1': {
        id: 'item-template-1',
        type: 'text-template',
        schemaVersion: 2,
        templateId: '22222222-2222-4222-8222-222222222222',
        templateCategory: 'default',
        nodes: [
          {
            id: 'template-node-image-1',
            type: 'image',
            imageType: 'svg',
            imageComponentId: null,
            imageLottieJson: null,
            x: 0,
            y: 0,
            width: 1280,
            height: 720,
            opacity: 1,
          },
          {
            id: 'template-node-text-1',
            type: 'text',
            x: 160,
            y: 180,
            width: 960,
            height: 180,
            text: 'Launch title',
            color: '#ffffff',
            align: 'left',
            fontFamily: 'TikTok Sans',
            fontStyle: {
              variant: 'normal',
              weight: '600',
            },
            fontSize: 72,
            lineHeight: 1.1,
            letterSpacing: 0,
            direction: 'ltr',
            strokeWidth: 0,
            strokeColor: '#000000',
            background: null,
          },
        ],
        startTicks: 0,
        durationTicks: 120,
        top: staticTrack(0),
        left: staticTrack(0),
        width: staticTrack(1280),
        height: staticTrack(720),
        scaleX: staticTrack(1),
        scaleY: staticTrack(1),
        opacity: staticTrack(1),
        isDraggingInTimeline: false,
        rotation: staticTrack(0),
      },
    },
    transitions: {},
    globalBackground: {
      type: 'none',
    },
    brandRuntime: {
      brandId: null,
      logoX: 50,
      logoY: 50,
      managedItemIds: [],
      managedAssetIds: [],
      introShiftInFrames: 0,
      overlayTrackId: null,
      underlayTrackId: null,
    },
    deletedAssets: [],
  }
}

describeLive('live editor-state validation scenarios', () => {
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
      const result = await client.editor.validate(
        buildInvalidEffectState() as unknown as TEditorStateV1
      )
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError)
    }
  }, 120_000)
})
