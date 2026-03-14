import Ajv from 'ajv'
import type { ErrorObject } from 'ajv'
import { editorStateSchema } from './schema-loader'

const ajv = new Ajv({
  allErrors: true,
  strict: false,
})

const validate = ajv.compile(editorStateSchema)

const formatSchemaErrors = (errors: ErrorObject[] | null | undefined): string => {
  if (!errors || errors.length === 0) {
    return 'unknown schema validation error'
  }

  return errors
    .map((item) => {
      const path = item.instancePath || '/'
      return `${path} ${item.message || item.keyword}`
    })
    .join('; ')
}

export const validateEditorStateSchema = (state: Record<string, unknown>) => {
  const valid = validate(state)
  return {
    valid,
    errors: validate.errors,
  }
}

export const assertValidState = (state: Record<string, unknown>): void => {
  const result = validateEditorStateSchema(state)
  if (!result.valid) {
    throw new Error(`expected valid editor state, got: ${formatSchemaErrors(result.errors)}`)
  }
}

export const assertInvalidState = (
  state: Record<string, unknown>,
  expectedPathIncludes?: string
): void => {
  const result = validateEditorStateSchema(state)
  if (result.valid) {
    throw new Error('expected invalid editor state, but schema validation passed')
  }

  if (!expectedPathIncludes) {
    return
  }

  const matchesExpectedPath = (result.errors || []).some((item) => {
    return (item.instancePath || '').includes(expectedPathIncludes)
  })

  if (!matchesExpectedPath) {
    throw new Error(
      `expected error path to include \"${expectedPathIncludes}\", got: ${formatSchemaErrors(result.errors)}`
    )
  }
}
