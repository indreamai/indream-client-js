import type { components } from './generated/openapi'

export type TExportRatio = '16:9' | '9:16' | '1:1' | '4:3' | '3:4' | 'custom'
export type TExportFormat = 'mp4' | 'webm'
export type TTaskStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'PAUSED' | 'CANCELED'
export type TExportWebhookEventType = 'EXPORT_STARTED' | 'EXPORT_COMPLETED' | 'EXPORT_FAILED'
export type TEditorStateV1 = components['schemas']['editor-state.v1.schema']

export interface IApiProblem {
  type: string
  title: string
  status: number
  detail: string
  errorCode?: string
}

export interface IApiEnvelope<T> {
  data: T
  meta: Record<string, unknown>
}

export interface ICreateExportRequest {
  clientTaskId?: string
  editorState: TEditorStateV1
  stateVersion?: string
  fps: 30 | 60
  compositionWidth?: number
  compositionHeight?: number
  ratio: TExportRatio
  scale: number
  format: TExportFormat
  callbackUrl?: string
  callbackHeaders?: Record<string, string>
}

export interface ICreateExportResponse {
  taskId: string
  createdAt: string
  durationSeconds: number
  billedStandardSeconds: number
  chargedCredits: string
}

export interface IExportTask {
  taskId: string
  createdByApiKeyId: string | null
  clientTaskId: string | null
  status: TTaskStatus
  progress: number
  error: string | null
  outputUrl: string | null
  durationSeconds: number
  billedStandardSeconds: number
  chargedCredits: string
  callbackUrl: string | null
  createdAt: string
  completedAt: string | null
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

export interface ICaptionAnimationPresetItem {
  id: string
  type: string
  label: string
  preview: string
}

export interface ICaptionAnimationPresetGroups {
  in: ICaptionAnimationPresetItem[]
  out: ICaptionAnimationPresetItem[]
  loop: ICaptionAnimationPresetItem[]
}

export interface IEditorCapabilities {
  version: string
  animations: string[]
  captionAnimations: ICaptionAnimationPresetGroups
  transitions: string[]
  transitionPresets: Array<{
    id: string
    type: string
    label: string
    params?: Record<string, string | number | boolean>
  }>
  effects: string[]
  effectPresets: Array<{
    id: string
    type: string
    label: string
    defaultDurationInSeconds?: number
    defaultIntensity?: number
    params?: Record<string, string | number | boolean>
  }>
  filters: string[]
  filterPresets: Array<{
    id: string
    type: string
    label: string
    defaultDurationInSeconds?: number
    defaultIntensity?: number
    params?: Record<string, string | number | boolean>
  }>
  shapes: string[]
  backgroundPresets: {
    colors: string[]
    gradients: string[]
    images: string[]
    blurLevels: number[]
  }
  illustrations: string[]
}

export interface IEditorValidationError {
  code: string
  path: string
  message: string
}

export interface IEditorValidationResult {
  valid: boolean
  errors: IEditorValidationError[]
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
