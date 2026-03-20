import { describe, expect, it } from 'vitest'
import { editorStateExamples } from '../fixtures/examples'
import { assertInvalidState, assertValidState } from '../utils/schema-validator'

describe('editor-state examples contract', () => {
  it('keyframe track with timeTicks points passes schema validation', () => {
    const valid = editorStateExamples.valid
    const image = (valid.items as Record<string, any>)['item-image-1']

    image.left = {
      value: 0,
      keyframes: [
        { timeTicks: 0, value: 0 },
        { timeTicks: 120000, value: 480 },
      ],
    }
    image.top = {
      value: 0,
      keyframes: [
        { timeTicks: 0, value: 0 },
        { timeTicks: 120000, value: 120 },
      ],
    }
    image.opacity = {
      value: 1,
      keyframes: [
        { timeTicks: 0, value: 1 },
        { timeTicks: 120000, value: 0.6 },
      ],
    }

    expect(() => assertValidState(valid)).not.toThrow()
  })

  it('valid example passes schema validation', () => {
    const valid = editorStateExamples.valid
    expect(() => assertValidState(valid)).not.toThrow()
  })

  it('invalid effect example fails schema validation', () => {
    const invalid = editorStateExamples.invalidEffect
    expect(() => assertInvalidState(invalid, '/items')).not.toThrow()
  })

  it('invalid filter example fails schema validation', () => {
    const invalid = editorStateExamples.invalidFilter
    expect(() => assertInvalidState(invalid, '/items')).not.toThrow()
  })

  it('invalid transition example fails schema validation', () => {
    const invalid = editorStateExamples.invalidTransition
    expect(() => assertInvalidState(invalid, '/transitions')).not.toThrow()
  })
})
