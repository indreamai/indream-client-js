import { describe, expect, it } from 'vitest'
import { buildEditorStateWithSingleItem, buildMinimalValidEditorState } from '../fixtures/builders'
import { validateEditorStateSchema } from '../utils/schema-validator'

describe('canonical state constraints', () => {
  it('requires the v1 discriminator', () => {
    const state = buildMinimalValidEditorState()
    state.stateSchemaVersion = 'v2'
    expect(validateEditorStateSchema(state).valid).toBe(false)
  })

  it.each(['video', 'audio', 'gif', 'lottie'] as const)(
    'requires integer source ticks for %s',
    (type) => {
      const state = buildEditorStateWithSingleItem(type) as Record<string, any>
      state.items[`item-${type}-1`].sourceStartTicks = 0.5
      expect(validateEditorStateSchema(state).valid).toBe(false)
    }
  )

  it('validates caption tick offsets and template UUIDs', () => {
    const captions = buildEditorStateWithSingleItem('captions') as Record<string, any>
    captions.items['item-captions-1'].contentStartOffsetTicks = -1
    expect(validateEditorStateSchema(captions).valid).toBe(false)
    const template = buildEditorStateWithSingleItem('text-template') as Record<string, any>
    template.items['item-text-template-1'].templateId = 'invalid-id'
    expect(validateEditorStateSchema(template).valid).toBe(false)
  })

  it('validates motion graphics and rejects component identifiers', () => {
    const state = buildEditorStateWithSingleItem('motion-graphic') as Record<string, any>
    expect(validateEditorStateSchema(state).valid).toBe(true)
    state.items['item-motion-graphic-1'].componentId = 'unsupported'
    expect(validateEditorStateSchema(state).valid).toBe(false)
  })

  it('requires complete flash-to-black parameters', () => {
    const state = buildEditorStateWithSingleItem('effect') as Record<string, any>
    const effect = state.items['item-effect-1']
    effect.effectType = 'flash-to-black'
    effect.params = { brightTicks: 24000, darkTicks: 24000, tailDarkTicks: 24000, maxOpacity: 1 }
    expect(validateEditorStateSchema(state).valid).toBe(true)
    delete effect.params.brightTicks
    expect(validateEditorStateSchema(state).valid).toBe(false)
  })

  it('supports linked items and locked tracks', () => {
    const state = buildMinimalValidEditorState() as Record<string, any>
    state.tracks[0].syncLocked = true
    state.items['item-solid-1'].linkGroupId = 'linked-clips'
    expect(validateEditorStateSchema(state).valid).toBe(true)
  })
})
