import type { IndreamClient } from '../client'
import type { IAsset, IUploadOptions, TUploadBody } from '../types'

const resolveFilename = (body: TUploadBody, options: IUploadOptions) => {
  if (options.filename?.trim()) {
    return options.filename.trim()
  }

  if (
    typeof File !== 'undefined' &&
    body instanceof File &&
    typeof body.name === 'string' &&
    body.name.trim()
  ) {
    return body.name.trim()
  }

  throw new Error('filename is required for uploads.upload(...)')
}

const resolveContentType = (body: TUploadBody, options: IUploadOptions) => {
  if (options.contentType?.trim()) {
    return options.contentType.trim()
  }

  if (typeof Blob !== 'undefined' && body instanceof Blob && body.type.trim()) {
    return body.type.trim()
  }

  throw new Error('contentType is required for uploads.upload(...)')
}

const resolveContentLength = (body: TUploadBody, options: IUploadOptions): number => {
  const inferred =
    typeof Blob !== 'undefined' && body instanceof Blob
      ? body.size
      : body instanceof ArrayBuffer || ArrayBuffer.isView(body)
        ? body.byteLength
        : undefined
  const length = options.contentLength ?? inferred
  if (length === undefined || !Number.isSafeInteger(length) || length <= 0) {
    throw new RangeError(
      'contentLength must be a positive integer; streams require an explicit byte size'
    )
  }
  if (inferred !== undefined && inferred !== length) {
    throw new RangeError('contentLength must match the upload body byte size')
  }
  return length
}

export class UploadsResource {
  private readonly client: IndreamClient

  constructor(client: IndreamClient) {
    this.client = client
  }

  async upload(body: TUploadBody, options: IUploadOptions = {}): Promise<IAsset> {
    const headers: Record<string, string> = {
      'x-file-name': resolveFilename(body, options),
      'Content-Type': resolveContentType(body, options),
      'Content-Length': String(resolveContentLength(body, options)),
    }

    if (options.projectId?.trim()) {
      headers['x-project-id'] = options.projectId.trim()
    }

    return await this.client.request<IAsset>('/v1/uploads', {
      method: 'POST',
      body,
      headers,
      signal: options.signal,
      skipRetry: true,
    })
  }
}
