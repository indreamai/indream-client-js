import { describe, expect, it } from 'vitest'
import {
  optionalFieldInvalidCases,
  optionalFieldValidCases,
  outputRatioValidCases,
  rootBoundaryInvalidCases,
  rootBoundaryValidCases,
  rootRequiredInvalidCases,
} from '../fixtures/matrix'
import { assertInvalidState, assertValidState } from '../utils/schema-validator'

describe('editor-state core schema matrix', () => {
  it.each(rootRequiredInvalidCases)('$name', ({ build, expectedPathIncludes }) => {
    expect(() => assertInvalidState(build(), expectedPathIncludes)).not.toThrow()
  })

  it.each(rootBoundaryValidCases)('$name', ({ build }) => {
    expect(() => assertValidState(build())).not.toThrow()
  })

  it.each(rootBoundaryInvalidCases)('$name', ({ build, expectedPathIncludes }) => {
    expect(() => assertInvalidState(build(), expectedPathIncludes)).not.toThrow()
  })

  it.each(outputRatioValidCases)('$name', ({ build }) => {
    expect(() => assertValidState(build())).not.toThrow()
  })

  it.each(optionalFieldValidCases)('$name', ({ build }) => {
    expect(() => assertValidState(build())).not.toThrow()
  })

  it.each(optionalFieldInvalidCases)('$name', ({ build, expectedPathIncludes }) => {
    expect(() => assertInvalidState(build(), expectedPathIncludes)).not.toThrow()
  })
})
