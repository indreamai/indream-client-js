import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { deepClone } from './builders'

type TEditorStateExampleFixture = {
  filename: string
  state: Record<string, unknown>
}

const examplesDir = resolve(process.cwd(), 'openapi/examples')

const readEditorStateExample = (filename: string): Record<string, unknown> => {
  const filePath = resolve(examplesDir, filename)
  return JSON.parse(readFileSync(filePath, 'utf8')) as Record<string, unknown>
}

const readExampleFixtures = (pattern: RegExp): TEditorStateExampleFixture[] => {
  return readdirSync(examplesDir)
    .filter((filename) => pattern.test(filename))
    .sort()
    .map((filename) => ({
      filename,
      state: readEditorStateExample(filename),
    }))
}

const validFixtures = readExampleFixtures(/^editor-state\.valid(?:\..+)?\.json$/u)
const invalidFixtures = readExampleFixtures(/^editor-state\.invalid(?:\..+)?\.json$/u)
const fixtureMap = new Map(
  [...validFixtures, ...invalidFixtures].map((fixture) => [fixture.filename, fixture.state])
)

const cloneFixture = (fixture: TEditorStateExampleFixture): TEditorStateExampleFixture => ({
  filename: fixture.filename,
  state: deepClone(fixture.state),
})

const getRequiredFixture = (filename: string): Record<string, unknown> => {
  const fixture = fixtureMap.get(filename)
  if (!fixture) {
    throw new Error(`Missing editor-state example fixture: ${filename}`)
  }
  return fixture
}

export const editorStateExamples = {
  get valid() {
    return deepClone(getRequiredFixture('editor-state.valid.json'))
  },
  get invalidEffect() {
    return deepClone(getRequiredFixture('editor-state.invalid.effect.json'))
  },
  get invalidFilter() {
    return deepClone(getRequiredFixture('editor-state.invalid.filter.json'))
  },
  get invalidTransition() {
    return deepClone(getRequiredFixture('editor-state.invalid.transition.json'))
  },
  get allValid() {
    return validFixtures.map(cloneFixture)
  },
  get allInvalid() {
    return invalidFixtures.map(cloneFixture)
  },
}
