import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const schemaPath = resolve(process.cwd(), 'openapi/schemas/editor-state.v1.schema.json')

export const editorStateSchema = JSON.parse(readFileSync(schemaPath, 'utf8')) as Record<string, any>

const definitions = editorStateSchema.definitions as Record<string, any>

const readEnum = (target: any): string[] => {
  return Array.isArray(target?.enum) ? [...target.enum] : []
}

export const ROOT_REQUIRED_FIELDS = [...(editorStateSchema.required as string[])]
export const OUTPUT_RATIO_ENUM = readEnum(editorStateSchema.properties?.outputRatio)

export const ITEM_SCHEMA_KEYS = (
  editorStateSchema.properties?.items?.additionalProperties?.oneOf || []
).map((item: any) => String(item.$ref).replace('#/definitions/', ''))

export const ITEM_TYPES = ITEM_SCHEMA_KEYS.map((key: string) => {
  return String(definitions?.[key]?.allOf?.[1]?.properties?.type?.const ?? '')
}).filter(Boolean)

export const ASSET_SCHEMA_KEYS = (
  editorStateSchema.properties?.assets?.additionalProperties?.oneOf || []
).map((item: any) => String(item.$ref).replace('#/definitions/', ''))

export const ASSET_TYPES = ASSET_SCHEMA_KEYS.map((key: string) => {
  return String(definitions?.[key]?.allOf?.[1]?.properties?.type?.const ?? '')
}).filter(Boolean)

export const ANIMATION_TYPES = readEnum(definitions?.animationSpec?.properties?.type)
export const ANIMATION_EASINGS = readEnum(definitions?.animationSpec?.properties?.easing)

export const TRANSITION_TYPES = readEnum(definitions?.transition?.properties?.type)
export const TRANSITION_EASINGS = readEnum(definitions?.transition?.properties?.easing)

export const EFFECT_TYPES = readEnum(definitions?.effectItem?.allOf?.[1]?.properties?.effectType)
export const FILTER_TYPES = readEnum(definitions?.filterItem?.allOf?.[1]?.properties?.filterType)

const globalBackgroundSchema = definitions?.globalBackground?.oneOf || []
export const GLOBAL_BACKGROUND_TYPES = globalBackgroundSchema
  .map((item: any) => String(item?.properties?.type?.const ?? ''))
  .filter(Boolean)

const blurBackgroundSchema = globalBackgroundSchema.find(
  (item: any) => item?.properties?.type?.const === 'blur'
)
export const GLOBAL_BACKGROUND_BLUR_LEVELS = Array.isArray(
  blurBackgroundSchema?.properties?.level?.enum
)
  ? [...blurBackgroundSchema.properties.level.enum]
  : []
