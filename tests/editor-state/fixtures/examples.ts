import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { deepClone } from './builders'

const readEditorStateExample = (filename: string): Record<string, unknown> => {
  const filePath = resolve(process.cwd(), `openapi/examples/${filename}`)
  return JSON.parse(readFileSync(filePath, 'utf8')) as Record<string, unknown>
}

const examples = {
  valid: readEditorStateExample('editor-state.valid.json'),
  invalidEffect: readEditorStateExample('editor-state.invalid.effect.json'),
  invalidFilter: readEditorStateExample('editor-state.invalid.filter.json'),
  invalidTransition: readEditorStateExample('editor-state.invalid.transition.json'),
}

export const editorStateExamples = {
  get valid() {
    return deepClone(examples.valid)
  },
  get invalidEffect() {
    return deepClone(examples.invalidEffect)
  },
  get invalidFilter() {
    return deepClone(examples.invalidFilter)
  },
  get invalidTransition() {
    return deepClone(examples.invalidTransition)
  },
}
