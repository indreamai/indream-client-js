import type { IEditorCapabilities, IEditorValidationResult, IRequestOptions } from '../types'
import type { IndreamClient } from '../client'

export class EditorResource {
  private readonly client: IndreamClient

  constructor(client: IndreamClient) {
    this.client = client
  }

  async capabilities(options: IRequestOptions = {}): Promise<IEditorCapabilities> {
    return await this.client.request<IEditorCapabilities>('/v1/editor/capabilities', {
      method: 'GET',
      signal: options.signal,
    })
  }

  async validate(
    editorState: Record<string, unknown>,
    options: IRequestOptions = {}
  ): Promise<IEditorValidationResult> {
    return await this.client.request<IEditorValidationResult>('/v1/editor/validate', {
      method: 'POST',
      body: {
        editorState,
      },
      signal: options.signal,
      skipRetry: true,
    })
  }
}
