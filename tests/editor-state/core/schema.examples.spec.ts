import { describe, expect, it } from 'vitest'
import { editorStateExamples } from '../fixtures/examples'
import { assertInvalidState, assertValidState } from '../utils/schema-validator'

describe('editor-state examples contract', () => {
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
