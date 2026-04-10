import type { TEditorStateFixtureCase, TEditorStateInvalidCase } from './types'
import {
  buildEditorStateWithAsset,
  buildEditorStateWithSingleItem,
  buildEditorStateWithTransition,
  buildMinimalValidEditorState,
  deepClone,
} from './builders'
import {
  ANIMATION_EASINGS,
  ANIMATION_TYPES,
  ASSET_TYPES,
  EFFECT_TYPES,
  FILTER_TYPES,
  GLOBAL_BACKGROUND_BLUR_LEVELS,
  GLOBAL_BACKGROUND_TYPES,
  ITEM_TYPES,
  OUTPUT_RATIO_ENUM,
  ROOT_REQUIRED_FIELDS,
  TRANSITION_EASINGS,
  TRANSITION_TYPES,
} from '../utils/schema-loader'

const removeRootField = (fieldName: string): Record<string, unknown> => {
  const state = buildMinimalValidEditorState()
  delete (state as Record<string, unknown>)[fieldName]
  return state
}

const itemMissingFieldMapping: Record<string, string> = {
  image: 'assetId',
  video: 'videoStartFromInSeconds',
  gif: 'gifStartFromInSeconds',
  lottie: 'lottieStartFromInSeconds',
  audio: 'audioStartFromInSeconds',
  text: 'fontFamily',
  'text-template': 'templateId',
  captions: 'source',
  solid: 'shape',
  illustration: 'illustrationName',
  effect: 'effectType',
  filter: 'filterType',
  chart: 'chartType',
}

const assetMissingFieldMapping: Record<string, string> = {
  image: 'width',
  video: 'durationInSeconds',
  gif: 'loopBehavior',
  audio: 'durationInSeconds',
  caption: 'timingGranularity',
  lottie: 'resourceType',
}

const getSingleItemId = (itemType: string): string => {
  return `item-${itemType}-1`
}

const getSingleAssetId = (assetType: string): string => {
  return `asset-${assetType}-1`
}

export const rootRequiredInvalidCases: TEditorStateInvalidCase[] = ROOT_REQUIRED_FIELDS.map(
  (field) => {
    return {
      name: `missing root field \"${field}\"`,
      build: () => removeRootField(field),
      expectedPathIncludes: '',
    }
  }
)

export const rootBoundaryValidCases: TEditorStateFixtureCase[] = [
  {
    name: 'composition width uses lower bound 50',
    build: () => {
      const state = buildMinimalValidEditorState()
      ;(state as any).compositionWidth = 50
      return state
    },
  },
  {
    name: 'composition height uses upper bound 1920',
    build: () => {
      const state = buildMinimalValidEditorState()
      ;(state as any).compositionHeight = 1920
      return state
    },
  },
]

export const rootBoundaryInvalidCases: TEditorStateInvalidCase[] = [
  {
    name: 'composition width below lower bound is rejected',
    build: () => {
      const state = buildMinimalValidEditorState()
      ;(state as any).compositionWidth = 49
      return state
    },
    expectedPathIncludes: '/compositionWidth',
  },
  {
    name: 'composition height above upper bound is rejected',
    build: () => {
      const state = buildMinimalValidEditorState()
      ;(state as any).compositionHeight = 1921
      return state
    },
    expectedPathIncludes: '/compositionHeight',
  },
  {
    name: 'timebaseTicksPerSecond must be 240000',
    build: () => {
      const state = buildMinimalValidEditorState()
      ;(state as any).timebaseTicksPerSecond = 240001
      return state
    },
    expectedPathIncludes: '/timebaseTicksPerSecond',
  },
]

export const outputRatioValidCases: TEditorStateFixtureCase[] = OUTPUT_RATIO_ENUM.map(
  (outputRatio) => {
    return {
      name: `outputRatio supports \"${outputRatio}\"`,
      build: () => buildMinimalValidEditorState({ outputRatio }),
    }
  }
)

export const optionalFieldValidCases: TEditorStateFixtureCase[] = [
  {
    name: 'globalBackground none variant is valid',
    build: () => buildMinimalValidEditorState({ globalBackground: { type: 'none' } }),
  },
  {
    name: 'globalBackground color variant is valid',
    build: () =>
      buildMinimalValidEditorState({
        globalBackground: {
          type: 'color',
          color: '#111827',
          gradient: null,
        },
      }),
  },
  {
    name: 'globalBackground blur variant is valid',
    build: () =>
      buildMinimalValidEditorState({
        globalBackground: {
          type: 'blur',
          level: GLOBAL_BACKGROUND_BLUR_LEVELS[0] ?? 0,
        },
      }),
  },
  {
    name: 'globalBackground image variant is valid',
    build: () =>
      buildMinimalValidEditorState({
        globalBackground: {
          type: 'image',
          imageAssetId: null,
          imageUrl: 'https://example.com/background.jpg',
          source: 'preset',
        },
      }),
  },
  {
    name: 'brandRuntime can be null',
    build: () => buildMinimalValidEditorState({ brandRuntime: null }),
  },
  {
    name: 'brandRuntime object structure is valid',
    build: () =>
      buildMinimalValidEditorState({
        brandRuntime: {
          brandId: 'brand-1',
          logoX: 100,
          logoY: 120,
          managedItemIds: ['item-solid-1'],
          managedAssetIds: [],
          introShiftInFrames: 3,
          overlayTrackId: 'track-1',
          underlayTrackId: null,
        },
      }),
  },
  {
    name: 'deletedAssets array is valid',
    build: () =>
      buildMinimalValidEditorState({
        deletedAssets: [
          {
            assetId: 'asset-old-1',
            remoteUrl: null,
            remoteKey: null,
            statusAtDeletion: {
              type: 'uploaded',
            },
          },
        ],
      }),
  },
]

export const optionalFieldInvalidCases: TEditorStateInvalidCase[] = [
  {
    name: 'globalBackground blur level rejects unsupported enum',
    build: () =>
      buildMinimalValidEditorState({
        globalBackground: {
          type: 'blur',
          level: 99,
        },
      }),
    expectedPathIncludes: '/globalBackground',
  },
  {
    name: 'globalBackground rejects legacy type',
    build: () =>
      buildMinimalValidEditorState({
        globalBackground: {
          type: 'COLOR',
          color: '#111827',
          gradient: null,
        },
      }),
    expectedPathIncludes: '/globalBackground',
  },
]

export const assetValidCases: TEditorStateFixtureCase[] = ASSET_TYPES.map((assetType: string) => {
  return {
    name: `asset type \"${assetType}\" is valid`,
    build: () => buildEditorStateWithAsset(assetType as any),
  }
})

export const assetInvalidCases: TEditorStateInvalidCase[] = ASSET_TYPES.map((assetType: string) => {
  const requiredField = assetMissingFieldMapping[assetType]
  return {
    name: `asset type \"${assetType}\" fails when required field \"${requiredField}\" is missing`,
    build: () => {
      const state = buildEditorStateWithAsset(assetType as any)
      const assetId = getSingleAssetId(assetType)
      delete ((state as any).assets[assetId] as Record<string, unknown>)[requiredField]
      return state
    },
    expectedPathIncludes: '/assets',
  }
})

export const assetInvalidConstraintCases: TEditorStateInvalidCase[] = [
  {
    name: 'gif asset loopBehavior rejects unsupported value',
    build: () => {
      const state = buildEditorStateWithAsset('gif')
      ;((state as any).assets['asset-gif-1'] as any).loopBehavior = 'infinite'
      return state
    },
    expectedPathIncludes: '/assets',
  },
  {
    name: 'lottie asset resourceType rejects unsupported value',
    build: () => {
      const state = buildEditorStateWithAsset('lottie')
      ;((state as any).assets['asset-lottie-1'] as any).resourceType = 'json'
      return state
    },
    expectedPathIncludes: '/assets',
  },
]

export const itemValidCases: TEditorStateFixtureCase[] = ITEM_TYPES.map((itemType: string) => {
  return {
    name: `item type \"${itemType}\" is valid`,
    build: () => buildEditorStateWithSingleItem(itemType as any),
  }
})

export const itemInvalidCases: TEditorStateInvalidCase[] = ITEM_TYPES.map((itemType: string) => {
  const requiredField = itemMissingFieldMapping[itemType]
  return {
    name: `item type \"${itemType}\" fails when required field \"${requiredField}\" is missing`,
    build: () => {
      const state = buildEditorStateWithSingleItem(itemType as any)
      const itemId = getSingleItemId(itemType)
      delete ((state as any).items[itemId] as Record<string, unknown>)[requiredField]
      return state
    },
    expectedPathIncludes: '/items',
  }
})

export const itemInvalidConstraintCases: TEditorStateInvalidCase[] = [
  {
    name: 'text-template item rejects schemaVersion != 2',
    build: () => {
      const state = buildEditorStateWithSingleItem('text-template')
      ;((state as any).items['item-text-template-1'] as any).schemaVersion = 1
      return state
    },
    expectedPathIncludes: '/items',
  },
  {
    name: 'text-template item requires at least 2 nodes',
    build: () => {
      const state = buildEditorStateWithSingleItem('text-template')
      ;((state as any).items['item-text-template-1'] as any).nodes = [{ type: 'text' }]
      return state
    },
    expectedPathIncludes: '/items',
  },
  {
    name: 'captions item rejects unsupported source enum',
    build: () => {
      const state = buildEditorStateWithSingleItem('captions')
      ;((state as any).items['item-captions-1'] as any).source = 'legacy'
      return state
    },
    expectedPathIncludes: '/items',
  },
  {
    name: 'chart item animationDurationTicks rejects negative value',
    build: () => {
      const state = buildEditorStateWithSingleItem('chart')
      ;((state as any).items['item-chart-1'] as any).animationDurationTicks = -1
      return state
    },
    expectedPathIncludes: '/items',
  },
]

const buildAnimationState = (animationType: string, easing: string): Record<string, unknown> => {
  const state = buildEditorStateWithSingleItem('image')
  const item = (state as any).items['item-image-1']
  item.animations = {
    in: {
      type: animationType,
      durationTicks: 10,
      easing,
    },
  }
  return state
}

export const animationTypeValidCases: TEditorStateFixtureCase[] = ANIMATION_TYPES.map(
  (animationType) => {
    return {
      name: `animation type \"${animationType}\" is valid`,
      build: () => buildAnimationState(animationType, ANIMATION_EASINGS[0] || 'linear'),
    }
  }
)

export const animationEasingValidCases: TEditorStateFixtureCase[] = ANIMATION_EASINGS.map(
  (easing) => {
    return {
      name: `animation easing \"${easing}\" is valid`,
      build: () => buildAnimationState(ANIMATION_TYPES[0] || 'fade', easing),
    }
  }
)

export const animationInvalidCases: TEditorStateInvalidCase[] = [
  {
    name: 'legacy animation type slideUp is rejected',
    build: () => buildAnimationState('slideUp', ANIMATION_EASINGS[0] || 'linear'),
    expectedPathIncludes: '/items',
  },
  {
    name: 'unsupported animation easing is rejected',
    build: () => buildAnimationState(ANIMATION_TYPES[0] || 'fade', 'easeInOut'),
    expectedPathIncludes: '/items',
  },
]

export const transitionTypeValidCases: TEditorStateFixtureCase[] = TRANSITION_TYPES.map(
  (transitionType) => {
    return {
      name: `transition type \"${transitionType}\" is valid`,
      build: () => buildEditorStateWithTransition(transitionType),
    }
  }
)

export const transitionEasingValidCases: TEditorStateFixtureCase[] = TRANSITION_EASINGS.map(
  (easing) => {
    return {
      name: `transition easing \"${easing}\" is valid`,
      build: () => {
        const state = buildEditorStateWithTransition(TRANSITION_TYPES[0] || 'fade')
        ;((state as any).transitions['transition-1'] as any).easing = easing
        return state
      },
    }
  }
)

export const transitionInvalidCases: TEditorStateInvalidCase[] = [
  {
    name: 'legacy transition type clockWipe is rejected',
    build: () => buildEditorStateWithTransition('clockWipe'),
    expectedPathIncludes: '/transitions',
  },
  {
    name: 'unsupported transition easing is rejected',
    build: () => {
      const state = buildEditorStateWithTransition(TRANSITION_TYPES[0] || 'fade')
      ;((state as any).transitions['transition-1'] as any).easing = 'easeInOut'
      return state
    },
    expectedPathIncludes: '/transitions',
  },
]

export const effectTypeValidCases: TEditorStateFixtureCase[] = EFFECT_TYPES.map((effectType) => {
  return {
    name: `effectType \"${effectType}\" is valid`,
    build: () => {
      const state = buildEditorStateWithSingleItem('effect')
      ;((state as any).items['item-effect-1'] as any).effectType = effectType
      return state
    },
  }
})

export const filterTypeValidCases: TEditorStateFixtureCase[] = FILTER_TYPES.map((filterType) => {
  return {
    name: `filterType \"${filterType}\" is valid`,
    build: () => {
      const state = buildEditorStateWithSingleItem('filter')
      ;((state as any).items['item-filter-1'] as any).filterType = filterType
      return state
    },
  }
})

export const effectFilterInvalidCases: TEditorStateInvalidCase[] = [
  {
    name: 'legacy effect value Blur is rejected',
    build: () => {
      const state = buildEditorStateWithSingleItem('effect')
      ;((state as any).items['item-effect-1'] as any).effectType = 'Blur'
      return state
    },
    expectedPathIncludes: '/items',
  },
  {
    name: 'legacy filter value cyberpunkNeon is rejected',
    build: () => {
      const state = buildEditorStateWithSingleItem('filter')
      ;((state as any).items['item-filter-1'] as any).filterType = 'cyberpunkNeon'
      return state
    },
    expectedPathIncludes: '/items',
  },
]

export const globalBackgroundTypeValidCases: TEditorStateFixtureCase[] =
  GLOBAL_BACKGROUND_TYPES.map((type: string) => {
    return {
      name: `globalBackground type \"${type}\" shape is valid`,
      build: () => {
        if (type === 'none') {
          return buildMinimalValidEditorState({ globalBackground: { type } })
        }
        if (type === 'color') {
          return buildMinimalValidEditorState({
            globalBackground: {
              type,
              color: '#111827',
              gradient: null,
            },
          })
        }
        if (type === 'blur') {
          return buildMinimalValidEditorState({
            globalBackground: {
              type,
              level: GLOBAL_BACKGROUND_BLUR_LEVELS[0] ?? 0,
            },
          })
        }
        return buildMinimalValidEditorState({
          globalBackground: {
            type,
            imageAssetId: null,
            imageUrl: 'https://example.com/background.jpg',
            source: 'custom',
          },
        })
      },
    }
  })

export const globalBackgroundBlurLevelValidCases: TEditorStateFixtureCase[] =
  GLOBAL_BACKGROUND_BLUR_LEVELS.map((level: number) => {
    return {
      name: `globalBackground blur level ${level} is valid`,
      build: () =>
        buildMinimalValidEditorState({
          globalBackground: {
            type: 'blur',
            level,
          },
        }),
    }
  })

export const semanticTransitionInvalidState = (): Record<string, unknown> => {
  const state = buildEditorStateWithTransition('fade')
  const cloned = deepClone(state) as any
  cloned.items['item-effect-1'] = {
    ...cloned.items['item-solid-1'],
    id: 'item-effect-1',
    type: 'effect',
    effectType: 'blur',
    intensity: 1,
  }
  cloned.tracks[0].items = ['item-image-1', 'item-solid-1', 'item-effect-1']
  cloned.transitions['transition-1'].toClipId = 'item-effect-1'
  return cloned
}
