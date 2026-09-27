import type { components } from './generated/openapi'

type TSchemas = components['schemas']
export type TEditorStateV1 = TSchemas['editor-state.v1.schema']
export type TExportRatio = TSchemas['CreateExportRequest']['ratio']
export type TExportFormat = TSchemas['CreateExportRequest']['format']
export type TTaskStatus = TSchemas['ExportTask']['status']
export type TExportPhase = NonNullable<TSchemas['ExportTask']['exportPhase']>
export type TExportWebhookEventType = 'EXPORT_STARTED' | 'EXPORT_COMPLETED' | 'EXPORT_FAILED'
export type IApiProblem = TSchemas['Problem']
export type ICreateExportRequest = TSchemas['CreateExportRequest']
export type ICreateExportResponse = TSchemas['CreateExportResponseData']
export type IExportTask = TSchemas['ExportTask']
export type IEditorCapabilities = TSchemas['EditorCapabilities']
export type ICaptionAnimationPresetGroups = IEditorCapabilities['captionAnimations']
export type ICaptionAnimationPresetItem = ICaptionAnimationPresetGroups['in'][number]
export type IEditorValidationError = TSchemas['EditorValidationError']
export type IEditorValidationResult = TSchemas['EditorValidationResult']
export type IProjectSummary = TSchemas['ProjectSummary']
export type IProjectDetail = TSchemas['ProjectDetail']
export type ICreateProjectRequest = TSchemas['CreateProjectRequest']
export type IUpdateProjectRequest = TSchemas['PatchProjectRequest']
export type ISyncProjectRequest = TSchemas['SyncProjectRequest']
export type IProjectMetadataResponse = TSchemas['ProjectMetadata']
export type IProjectSyncResponse = TSchemas['SyncProjectResponseData']
export type IDeleteProjectResponse = TSchemas['DeleteProjectEnvelope']['data']
export type IAsset = TSchemas['Asset']
export type IProjectAssetBindingResponse = TSchemas['ProjectAssetBindingEnvelope']['data']
export type IDeleteProjectAssetResponse = TSchemas['DeleteProjectAssetEnvelope']['data']
export type IDeleteAssetResponse = TSchemas['DeleteAssetEnvelope']['data']
export type ICreateProjectExportRequest = TSchemas['CreateProjectExportRequest']

export interface IApiEnvelope<T> {
  data: T
  meta: Record<string, unknown>
}

export interface IListExportsResponse {
  items: IExportTask[]
  nextPageCursor: string | null
}

export interface IExportWebhookEvent {
  eventType: TExportWebhookEventType
  occurredAt: string
  task: IExportTask
}

export interface IListProjectsResponse {
  items: IProjectSummary[]
  nextPageCursor: string | null
}

export interface IListAssetsResponse {
  items: IAsset[]
  nextPageCursor: string | null
}

export interface IClientOptions {
  apiKey: string
  baseURL?: string
  timeout?: number
  maxRetries?: number
  pollIntervalMs?: number
  fetch?: typeof fetch
}

export interface IRequestOptions {
  signal?: AbortSignal
}

export interface ICreateRequestOptions extends IRequestOptions {
  idempotencyKey?: string
}

export interface IWaitOptions {
  timeoutMs?: number
  pollIntervalMs?: number
  signal?: AbortSignal
}

export type TUploadBody = Blob | ArrayBuffer | ArrayBufferView | ReadableStream<Uint8Array>

export interface IUploadOptions extends IRequestOptions {
  filename?: string
  contentType?: string
  projectId?: string
  /** Exact byte size. Required for streams; inferred for buffers and blobs. */
  contentLength?: number
}
