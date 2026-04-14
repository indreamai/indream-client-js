import type { IRequestOptions } from '../types'
import type { IndreamClient } from '../client'

export class IllustrationsResource {
  private readonly client: IndreamClient

  constructor(client: IndreamClient) {
    this.client = client
  }

  async search(q?: string, options: IRequestOptions = {}): Promise<string[]> {
    const query = typeof q === 'string' && q.trim() ? '?q=' + encodeURIComponent(q.trim()) : ''
    return await this.client.request<string[]>('/v1/illustrations' + query, {
      method: 'GET',
      signal: options.signal,
    })
  }
}
