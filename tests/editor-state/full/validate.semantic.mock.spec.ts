import { describe, expect, it } from 'vitest'
import type { ErrorObject } from 'ajv'
import { IndreamClient } from '../../../src/client'
import type { TEditorStateV1 } from '../../../src/types'
import { getIndreamApiUrl, getMockApiKey } from '../../utils/env'
import { editorStateExamples } from '../fixtures/examples'
import { semanticTransitionInvalidState } from '../fixtures/matrix'
import { validateEditorStateSchema } from '../utils/schema-validator'

const apiKey = getMockApiKey()
const baseURL = getIndreamApiUrl()

const mapSchemaErrorToValidationError = (error: ErrorObject) => {
  const path = error.instancePath || '/'

  if (path.includes('/effectType')) {
    return {
      code: 'EDITOR_EFFECT_TYPE_INVALID',
      path,
      message: error.message || 'invalid effect type',
    }
  }

  if (path.includes('/filterType')) {
    return {
      code: 'EDITOR_FILTER_TYPE_INVALID',
      path,
      message: error.message || 'invalid filter type',
    }
  }

  if (path.includes('/transitions')) {
    return {
      code: 'EDITOR_TRANSITION_TYPE_INVALID',
      path,
      message: error.message || 'invalid transition',
    }
  }

  return {
    code: 'EDITOR_SCHEMA_INVALID',
    path,
    message: error.message || 'invalid editor state',
  }
}

const validateTransitionAdjacency = (editorState: Record<string, any>) => {
  const tracks = Array.isArray(editorState.tracks) ? editorState.tracks : []
  const transitions = editorState.transitions || {}

  for (const transition of Object.values(transitions) as Array<Record<string, any>>) {
    const targetTrack = tracks.find((item) => item.id === transition.trackId)
    if (!targetTrack || !Array.isArray(targetTrack.items)) {
      continue
    }

    const fromIndex = targetTrack.items.indexOf(transition.fromClipId)
    const toIndex = targetTrack.items.indexOf(transition.toClipId)
    if (fromIndex === -1 || toIndex === -1) {
      continue
    }

    if (toIndex !== fromIndex + 1) {
      return {
        valid: false,
        errors: [
          {
            code: 'EDITOR_TRANSITION_CLIP_NOT_ADJACENT',
            path: '/transitions',
            message: 'transition clips must be adjacent in track timeline',
          },
        ],
      }
    }
  }

  return {
    valid: true,
    errors: [],
  }
}

const createMockValidateFetch = (): typeof fetch => {
  return (async (_input, init) => {
    const body = JSON.parse(String(init?.body || '{}')) as {
      editorState?: Record<string, unknown>
    }

    const editorState = body.editorState || {}
    const schemaResult = validateEditorStateSchema(editorState)

    if (!schemaResult.valid) {
      return new Response(
        JSON.stringify({
          data: {
            valid: false,
            errors: (schemaResult.errors || []).map(mapSchemaErrorToValidationError),
          },
          meta: {
            capabilitiesVersion: 'mock-v1',
          },
        }),
        { status: 200 }
      )
    }

    const semanticResult = validateTransitionAdjacency(editorState)
    return new Response(
      JSON.stringify({
        data: semanticResult,
        meta: {
          capabilitiesVersion: 'mock-v1',
        },
      }),
      { status: 200 }
    )
  }) as typeof fetch
}

describe('editor.validate semantic mock', () => {
  it('returns valid=true for valid editor state example', async () => {
    const client = new IndreamClient({
      apiKey,
      baseURL,
      fetch: createMockValidateFetch(),
    })

    const result = await client.editor.validate(
      editorStateExamples.valid as unknown as TEditorStateV1
    )
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('returns effect/filter/transition errors for invalid examples', async () => {
    const client = new IndreamClient({
      apiKey,
      baseURL,
      fetch: createMockValidateFetch(),
    })

    const effectResult = await client.editor.validate(
      editorStateExamples.invalidEffect as unknown as TEditorStateV1
    )
    expect(effectResult.valid).toBe(false)
    expect(effectResult.errors.some((item) => item.code === 'EDITOR_EFFECT_TYPE_INVALID')).toBe(
      true
    )

    const filterResult = await client.editor.validate(
      editorStateExamples.invalidFilter as unknown as TEditorStateV1
    )
    expect(filterResult.valid).toBe(false)
    expect(filterResult.errors.some((item) => item.code === 'EDITOR_FILTER_TYPE_INVALID')).toBe(
      true
    )

    const transitionResult = await client.editor.validate(
      editorStateExamples.invalidTransition as unknown as TEditorStateV1
    )
    expect(transitionResult.valid).toBe(false)
    expect(
      transitionResult.errors.some((item) => item.code === 'EDITOR_TRANSITION_TYPE_INVALID')
    ).toBe(true)
  })

  it('returns semantic transition adjacency error for non-adjacent clips', async () => {
    const client = new IndreamClient({
      apiKey,
      baseURL,
      fetch: createMockValidateFetch(),
    })

    const result = await client.editor.validate(
      semanticTransitionInvalidState() as unknown as TEditorStateV1
    )
    expect(result.valid).toBe(false)
    expect(result.errors.some((item) => item.code === 'EDITOR_TRANSITION_CLIP_NOT_ADJACENT')).toBe(
      true
    )
  })
})
