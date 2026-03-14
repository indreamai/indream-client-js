export interface TEditorStateFixtureCase {
  name: string
  build: () => Record<string, unknown>
}

export interface TEditorStateInvalidCase extends TEditorStateFixtureCase {
  expectedPathIncludes?: string
}
