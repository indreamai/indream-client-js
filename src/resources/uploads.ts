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

export class UploadsResource {
  private readonly client: IndreamClient

  constructor(client: IndreamClient) {
    this.client = client
  }

  async upload(body: TUploadBody, options: IUploadOptions = {}): Promise<IAsset> {
    const headers: Record<string, string> = {
      'x-file-name': resolveFilename(body, options),
      'Content-Type': resolveContentType(body, options),
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
