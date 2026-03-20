export type TAssetType = 'image' | 'video' | 'gif' | 'audio' | 'caption' | 'lottie'

export type TItemType =
  | 'image'
  | 'video'
  | 'gif'
  | 'lottie'
  | 'audio'
  | 'text'
  | 'text-template'
  | 'captions'
  | 'solid'
  | 'illustration'
  | 'effect'
  | 'filter'
  | 'chart'

export interface IBuildEditorStateOptions {
  outputRatio?: string
  globalBackground?: Record<string, unknown>
  brandRuntime?: Record<string, unknown> | null
  deletedAssets?: Array<Record<string, unknown>>
}

export const deepClone = <T>(value: T): T => {
  return JSON.parse(JSON.stringify(value)) as T
}

const staticTrack = (value: number): Record<string, unknown> => ({
  value,
  keyframes: [],
})

const baseTrack = () => ({
  id: 'track-1',
  hidden: false,
  muted: false,
  items: [] as string[],
})

const baseItem = (id: string, type: string): Record<string, unknown> => ({
  id,
  type,
  startTicks: 0,
  durationTicks: 120,
  top: staticTrack(0),
  left: staticTrack(0),
  width: staticTrack(320),
  height: staticTrack(180),
  scaleX: staticTrack(1),
  scaleY: staticTrack(1),
  opacity: staticTrack(1),
  isDraggingInTimeline: false,
})

const baseAsset = (id: string, type: string): Record<string, unknown> => ({
  id,
  type,
  filename: `${id}.bin`,
  size: 1024,
  remoteUrl: `https://example.com/${id}`,
  remoteKey: `${id}.key`,
  mimeType: 'application/octet-stream',
})

export const createAssetByType = (
  type: TAssetType,
  id = `asset-${type}-1`
): Record<string, unknown> => {
  if (type === 'image') {
    return {
      ...baseAsset(id, type),
      filename: `${id}.png`,
      mimeType: 'image/png',
      width: 1280,
      height: 720,
    }
  }

  if (type === 'video') {
    return {
      ...baseAsset(id, type),
      filename: `${id}.mp4`,
      mimeType: 'video/mp4',
      durationInSeconds: 2,
      hasAudioTrack: true,
      width: 1280,
      height: 720,
    }
  }

  if (type === 'gif') {
    return {
      ...baseAsset(id, type),
      filename: `${id}.gif`,
      mimeType: 'image/gif',
      durationInSeconds: 2,
      width: 720,
      height: 720,
      loopBehavior: 'loop',
    }
  }

  if (type === 'audio') {
    return {
      ...baseAsset(id, type),
      filename: `${id}.mp3`,
      mimeType: 'audio/mpeg',
      durationInSeconds: 2,
    }
  }

  if (type === 'caption') {
    return {
      ...baseAsset(id, type),
      filename: `${id}.json`,
      mimeType: 'application/json',
      timingGranularity: 'line',
      captions: [
        {
          startInSeconds: 0,
          endInSeconds: 1,
          text: 'hello world',
        },
      ],
    }
  }

  return {
    ...baseAsset(id, 'lottie'),
    filename: `${id}.json`,
    mimeType: 'application/json',
    durationInSeconds: 2,
    width: 512,
    height: 512,
    resourceType: 'lottie',
    resourceJson: {
      fr: 30,
      w: 512,
      h: 512,
      ip: 0,
      op: 60,
    },
  }
}

export const createItemByType = (
  type: TItemType,
  id = `item-${type}-1`,
  assetId?: string
): Record<string, unknown> => {
  if (type === 'image') {
    return {
      ...baseItem(id, type),
      assetId,
      keepAspectRatio: true,
      borderRadius: staticTrack(0),
      rotation: staticTrack(0),
      cropLeft: staticTrack(0),
      cropTop: staticTrack(0),
      cropRight: staticTrack(0),
      cropBottom: staticTrack(0),
    }
  }

  if (type === 'video') {
    return {
      ...baseItem(id, type),
      assetId,
      keepAspectRatio: true,
      borderRadius: staticTrack(0),
      rotation: staticTrack(0),
      videoStartFromInSeconds: 0,
      decibelAdjustment: staticTrack(0),
      playbackRate: 1,
      audioFadeInDurationInSeconds: 0,
      audioFadeOutDurationInSeconds: 0,
      cropLeft: staticTrack(0),
      cropTop: staticTrack(0),
      cropRight: staticTrack(0),
      cropBottom: staticTrack(0),
    }
  }

  if (type === 'gif') {
    return {
      ...baseItem(id, type),
      assetId,
      keepAspectRatio: true,
      borderRadius: staticTrack(0),
      rotation: staticTrack(0),
      gifStartFromInSeconds: 0,
      playbackRate: 1,
      cropLeft: staticTrack(0),
      cropTop: staticTrack(0),
      cropRight: staticTrack(0),
      cropBottom: staticTrack(0),
    }
  }

  if (type === 'lottie') {
    return {
      ...baseItem(id, type),
      assetId,
      keepAspectRatio: true,
      rotation: staticTrack(0),
      lottieStartFromInSeconds: 0,
      playbackRate: 1,
    }
  }

  if (type === 'audio') {
    return {
      ...baseItem(id, type),
      assetId,
      audioStartFromInSeconds: 0,
      decibelAdjustment: staticTrack(0),
      playbackRate: 1,
      audioFadeInDurationInSeconds: 0,
      audioFadeOutDurationInSeconds: 0,
    }
  }

  if (type === 'text') {
    return {
      ...baseItem(id, type),
      text: 'hello world',
      color: '#ffffff',
      align: 'left',
      fontFamily: 'Inter',
      fontStyle: {
        variant: 'normal',
        weight: '400',
      },
      fontSize: 20,
      lineHeight: 1.2,
      letterSpacing: 0,
      resizeOnEdit: true,
      direction: 'ltr',
      strokeWidth: 0,
      strokeColor: '#000000',
      background: null,
      rotation: staticTrack(0),
    }
  }

  if (type === 'text-template') {
    return {
      ...baseItem(id, type),
      schemaVersion: 2,
      templateId: 'tpl-1',
      templateCategory: 'cover',
      nodes: [
        {
          type: 'image',
          key: 'image-1',
        },
        {
          type: 'text',
          key: 'text-1',
          text: 'template title',
        },
      ],
      rotation: staticTrack(0),
    }
  }

  if (type === 'captions') {
    return {
      ...baseItem(id, type),
      assetId,
      fontFamily: 'Inter',
      fontStyle: {
        variant: 'normal',
        weight: '500',
      },
      lineHeight: 1.2,
      letterSpacing: 0,
      fontSize: 24,
      align: 'center',
      color: '#ffffff',
      highlightColor: '#22c55e',
      strokeWidth: 0,
      strokeColor: '#000000',
      direction: 'ltr',
      pageDurationInMilliseconds: 1000,
      captionStartInSeconds: 0,
      maxLines: 2,
      source: 'manual',
      captionGroupId: null,
      background: {
        color: '#00000088',
        horizontalPadding: 12,
        borderRadius: 8,
      },
      rotation: staticTrack(0),
    }
  }

  if (type === 'solid') {
    return {
      ...baseItem(id, type),
      color: '#111827',
      shape: 'rectangle',
      keepAspectRatio: false,
      borderRadius: staticTrack(0),
      rotation: staticTrack(0),
    }
  }

  if (type === 'illustration') {
    return {
      ...baseItem(id, type),
      illustrationName: 'illustration-1',
      color: '#22d3ee',
      keepAspectRatio: true,
      rotation: staticTrack(0),
    }
  }

  if (type === 'effect') {
    return {
      ...baseItem(id, type),
      effectType: 'blur',
      intensity: 1,
      params: {
        blend: 0.5,
      },
    }
  }

  if (type === 'filter') {
    return {
      ...baseItem(id, type),
      filterType: 'cyberpunk-neon',
      intensity: 1,
      params: {
        blend: 0.65,
      },
    }
  }

  return {
    ...baseItem(id, 'chart'),
    chartType: 'bar',
    themeColor: '#3b82f6',
    data: {
      series: [
        {
          label: 'A',
          value: 42,
        },
      ],
    },
    animationDurationTicks: 12,
    keepAspectRatio: true,
    rotation: staticTrack(0),
  }
}

export const buildMinimalValidEditorState = (
  options: IBuildEditorStateOptions = {}
): Record<string, unknown> => {
  const itemId = 'item-solid-1'
  const state: Record<string, any> = {
    compositionWidth: 1920,
    compositionHeight: 1080,
    timebaseTicksPerSecond: 240000,
    tracks: [baseTrack()],
    assets: {},
    items: {
      [itemId]: createItemByType('solid', itemId),
    },
    transitions: {},
  }

  state.tracks[0].items = [itemId]

  if (options.outputRatio) {
    state.outputRatio = options.outputRatio
  }

  if (options.globalBackground !== undefined) {
    state.globalBackground = options.globalBackground
  }

  if (options.brandRuntime !== undefined) {
    state.brandRuntime = options.brandRuntime
  }

  if (options.deletedAssets !== undefined) {
    state.deletedAssets = options.deletedAssets
  }

  return state
}

const itemAssetMapping: Partial<Record<TItemType, TAssetType>> = {
  image: 'image',
  video: 'video',
  gif: 'gif',
  lottie: 'lottie',
  audio: 'audio',
  captions: 'caption',
}

export const buildEditorStateWithSingleItem = (itemType: TItemType): Record<string, unknown> => {
  const state = buildMinimalValidEditorState()
  const itemId = `item-${itemType}-1`
  const assets = (state.assets || {}) as Record<string, unknown>
  const items = (state.items || {}) as Record<string, unknown>
  const tracks = state.tracks as Array<Record<string, unknown>>

  const requiredAssetType = itemAssetMapping[itemType]
  const assetId = requiredAssetType ? `asset-${requiredAssetType}-1` : undefined
  if (requiredAssetType && assetId) {
    assets[assetId] = createAssetByType(requiredAssetType, assetId)
  }

  items[itemId] = createItemByType(itemType, itemId, assetId)
  tracks[0].items = [itemId]

  return state
}

export const buildEditorStateWithAsset = (assetType: TAssetType): Record<string, unknown> => {
  const state = buildMinimalValidEditorState()
  const assets = state.assets as Record<string, unknown>
  const assetId = `asset-${assetType}-1`
  assets[assetId] = createAssetByType(assetType, assetId)
  return state
}

export const buildEditorStateWithTransition = (
  transitionType = 'fade'
): Record<string, unknown> => {
  const state = buildMinimalValidEditorState()
  const assets = state.assets as Record<string, unknown>
  const items = state.items as Record<string, unknown>
  const tracks = state.tracks as Array<Record<string, unknown>>

  assets['asset-image-1'] = createAssetByType('image', 'asset-image-1')
  items['item-image-1'] = createItemByType('image', 'item-image-1', 'asset-image-1')
  items['item-solid-1'] = createItemByType('solid', 'item-solid-1')
  tracks[0].items = ['item-image-1', 'item-solid-1']

  state.transitions = {
    'transition-1': {
      id: 'transition-1',
      trackId: 'track-1',
      fromClipId: 'item-image-1',
      toClipId: 'item-solid-1',
      type: transitionType,
      durationTicks: 15,
      easing: 'ease-in-out',
    },
  }

  return state
}
