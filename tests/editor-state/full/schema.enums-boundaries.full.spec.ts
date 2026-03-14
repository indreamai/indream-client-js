import { describe, expect, it } from 'vitest'
import {
  animationEasingValidCases,
  animationInvalidCases,
  animationTypeValidCases,
  effectFilterInvalidCases,
  effectTypeValidCases,
  filterTypeValidCases,
  globalBackgroundBlurLevelValidCases,
  globalBackgroundTypeValidCases,
  transitionEasingValidCases,
  transitionInvalidCases,
  transitionTypeValidCases,
} from '../fixtures/matrix'
import { assertInvalidState, assertValidState } from '../utils/schema-validator'

describe('editor-state full matrix - enums and boundaries', () => {
  it.each(animationTypeValidCases)('$name', ({ build }) => {
    expect(() => assertValidState(build())).not.toThrow()
  })

  it.each(animationEasingValidCases)('$name', ({ build }) => {
    expect(() => assertValidState(build())).not.toThrow()
  })

  it.each(animationInvalidCases)('$name', ({ build, expectedPathIncludes }) => {
    expect(() => assertInvalidState(build(), expectedPathIncludes)).not.toThrow()
  })

  it.each(transitionTypeValidCases)('$name', ({ build }) => {
    expect(() => assertValidState(build())).not.toThrow()
  })

  it.each(transitionEasingValidCases)('$name', ({ build }) => {
    expect(() => assertValidState(build())).not.toThrow()
  })

  it.each(transitionInvalidCases)('$name', ({ build, expectedPathIncludes }) => {
    expect(() => assertInvalidState(build(), expectedPathIncludes)).not.toThrow()
  })

  it.each(effectTypeValidCases)('$name', ({ build }) => {
    expect(() => assertValidState(build())).not.toThrow()
  })

  it.each(filterTypeValidCases)('$name', ({ build }) => {
    expect(() => assertValidState(build())).not.toThrow()
  })

  it.each(effectFilterInvalidCases)('$name', ({ build, expectedPathIncludes }) => {
    expect(() => assertInvalidState(build(), expectedPathIncludes)).not.toThrow()
  })

  it.each(globalBackgroundTypeValidCases)('$name', ({ build }) => {
    expect(() => assertValidState(build())).not.toThrow()
  })

  it.each(globalBackgroundBlurLevelValidCases)('$name', ({ build }) => {
    expect(() => assertValidState(build())).not.toThrow()
  })
})
