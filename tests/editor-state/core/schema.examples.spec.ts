import { describe, expect, it } from 'vitest'
import { editorStateExamples } from '../fixtures/examples'
import { assertInvalidState, assertValidState } from '../utils/schema-validator'

const validExamples = editorStateExamples.allValid
const invalidExamples = editorStateExamples.allInvalid

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

  validExamples.forEach(({ filename, state }) => {
    it(`${filename} passes schema validation`, () => {
      expect(() => assertValidState(state)).not.toThrow()
    })
  })

  invalidExamples.forEach(({ filename, state }) => {
    it(`${filename} fails schema validation`, () => {
      expect(() => assertInvalidState(state)).not.toThrow()
    })
  })
})
