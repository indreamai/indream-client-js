import { describe, expect, it } from 'vitest'
import {
  assetInvalidCases,
  assetInvalidConstraintCases,
  assetValidCases,
  itemInvalidCases,
  itemInvalidConstraintCases,
  itemValidCases,
} from '../fixtures/matrix'
import { assertInvalidState, assertValidState } from '../utils/schema-validator'

describe('editor-state full matrix - assets and items', () => {
  it.each(assetValidCases)('$name', ({ build }) => {
    expect(() => assertValidState(build())).not.toThrow()
  })

  it.each(assetInvalidCases)('$name', ({ build, expectedPathIncludes }) => {
    expect(() => assertInvalidState(build(), expectedPathIncludes)).not.toThrow()
  })

  it.each(assetInvalidConstraintCases)('$name', ({ build, expectedPathIncludes }) => {
    expect(() => assertInvalidState(build(), expectedPathIncludes)).not.toThrow()
  })

  it.each(itemValidCases)('$name', ({ build }) => {
    expect(() => assertValidState(build())).not.toThrow()
  })

  it.each(itemInvalidCases)('$name', ({ build, expectedPathIncludes }) => {
    expect(() => assertInvalidState(build(), expectedPathIncludes)).not.toThrow()
  })

  it.each(itemInvalidConstraintCases)('$name', ({ build, expectedPathIncludes }) => {
    expect(() => assertInvalidState(build(), expectedPathIncludes)).not.toThrow()
  })
})
