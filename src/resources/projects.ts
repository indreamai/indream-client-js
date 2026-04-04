import type {
  ICreateProjectExportRequest,
  ICreateProjectRequest,
  ICreateRequestOptions,
  ICreateExportResponse,
  IDeleteProjectAssetResponse,
  IDeleteProjectResponse,
  IListAssetsResponse,
  IListProjectsResponse,
  IProjectAssetBindingResponse,
  IProjectDetail,
  IProjectMetadataResponse,
  IProjectSyncResponse,
  IProjectSummary,
  IRequestOptions,
  ISyncProjectRequest,
  IUpdateProjectRequest,
} from '../types'
import type { IndreamClient } from '../client'

export class ProjectsResource {
  private readonly client: IndreamClient

  constructor(client: IndreamClient) {
    this.client = client
  }

  async create(
    payload: ICreateProjectRequest,
    options: ICreateRequestOptions = {}
  ): Promise<IProjectSummary> {
    return await this.client.request<IProjectSummary>('/v1/projects', {
      method: 'POST',
      body: payload,
      idempotencyKey: options.idempotencyKey?.trim() || undefined,
      signal: options.signal,
    })
  }

  async list(params?: {
    pageSize?: number
    pageCursor?: string
    signal?: AbortSignal
  }): Promise<IListProjectsResponse> {
    const search = new URLSearchParams()
    if (params?.pageSize) {
      search.set('pageSize', String(params.pageSize))
    }
    if (params?.pageCursor) {
      search.set('pageCursor', params.pageCursor)
    }

    const query = search.toString()
    const envelope = await this.client.requestEnvelope<IProjectSummary[]>(
      `/v1/projects${query ? `?${query}` : ''}`,
      {
        method: 'GET',
        signal: params?.signal,
      }
    )

    return {
      items: envelope.data || [],
      nextPageCursor:
        typeof envelope.meta?.nextPageCursor === 'string' ? envelope.meta.nextPageCursor : null,
    }
  }

  async get(projectId: string, options: IRequestOptions = {}): Promise<IProjectDetail> {
    return await this.client.request<IProjectDetail>(`/v1/projects/${projectId}`, {
      method: 'GET',
      signal: options.signal,
    })
  }

  async update(
    projectId: string,
    payload: IUpdateProjectRequest,
    options: IRequestOptions = {}
  ): Promise<IProjectMetadataResponse> {
    return await this.client.request<IProjectMetadataResponse>(`/v1/projects/${projectId}`, {
      method: 'PATCH',
      body: payload,
      signal: options.signal,
    })
  }

  async sync(
    projectId: string,
    payload: ISyncProjectRequest,
    options: IRequestOptions = {}
  ): Promise<IProjectSyncResponse> {
    return await this.client.request<IProjectSyncResponse>(`/v1/projects/${projectId}/sync`, {
      method: 'POST',
      body: payload,
      signal: options.signal,
    })
  }

  async delete(projectId: string, options: IRequestOptions = {}): Promise<IDeleteProjectResponse> {
    return await this.client.request<IDeleteProjectResponse>(`/v1/projects/${projectId}`, {
      method: 'DELETE',
      signal: options.signal,
    })
  }

  async listAssets(params: {
    projectId: string
    pageSize?: number
    pageCursor?: string
    signal?: AbortSignal
  }): Promise<IListAssetsResponse> {
    const search = new URLSearchParams()
    if (params.pageSize) {
      search.set('pageSize', String(params.pageSize))
    }
    if (params.pageCursor) {
      search.set('pageCursor', params.pageCursor)
    }

    const query = search.toString()
    const envelope = await this.client.requestEnvelope<IListAssetsResponse['items']>(
      `/v1/projects/${params.projectId}/assets${query ? `?${query}` : ''}`,
      {
        method: 'GET',
        signal: params.signal,
      }
    )

    return {
      items: envelope.data || [],
      nextPageCursor:
        typeof envelope.meta?.nextPageCursor === 'string' ? envelope.meta.nextPageCursor : null,
    }
  }

  async addAsset(
    projectId: string,
    assetId: string,
    options: IRequestOptions = {}
  ): Promise<IProjectAssetBindingResponse> {
    return await this.client.request<IProjectAssetBindingResponse>(
      `/v1/projects/${projectId}/assets`,
      {
        method: 'POST',
        body: { assetId },
        signal: options.signal,
      }
    )
  }

  async removeAsset(
    projectId: string,
    assetId: string,
    options: IRequestOptions = {}
  ): Promise<IDeleteProjectAssetResponse> {
    return await this.client.request<IDeleteProjectAssetResponse>(
      `/v1/projects/${projectId}/assets/${assetId}`,
      {
        method: 'DELETE',
        signal: options.signal,
      }
    )
  }

  async createExport(
    projectId: string,
    payload: ICreateProjectExportRequest,
    options: ICreateRequestOptions = {}
  ): Promise<ICreateExportResponse> {
    return await this.client.request<ICreateExportResponse>(`/v1/projects/${projectId}/exports`, {
      method: 'POST',
      body: payload,
      idempotencyKey: options.idempotencyKey?.trim() || undefined,
      signal: options.signal,
    })
  }
}
