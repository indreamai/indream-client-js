import type { IndreamClient } from '../client'
import type { IAsset, IDeleteAssetResponse, IRequestOptions } from '../types'

export class AssetsResource {
  private readonly client: IndreamClient

  constructor(client: IndreamClient) {
    this.client = client
  }

  async get(assetId: string, options: IRequestOptions = {}): Promise<IAsset> {
    return await this.client.request<IAsset>(`/v1/assets/${assetId}`, {
      method: 'GET',
      signal: options.signal,
    })
  }

  async delete(assetId: string, options: IRequestOptions = {}): Promise<IDeleteAssetResponse> {
    return await this.client.request<IDeleteAssetResponse>(`/v1/assets/${assetId}`, {
      method: 'DELETE',
      signal: options.signal,
    })
  }
}
