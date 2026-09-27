import contracts from './generated/response-contracts.json'

type Schema =
  | boolean
  | {
      $ref?: string
      type?: string | string[]
      enum?: unknown[]
      const?: unknown
      required?: string[]
      properties?: Record<string, Schema>
      items?: Schema
      additionalProperties?: Schema
      allOf?: Schema[]
      anyOf?: Schema[]
      oneOf?: Schema[]
      minimum?: number
      maximum?: number
      minLength?: number
      maxLength?: number
      minItems?: number
      maxItems?: number
    }
const schemas = contracts.schemas as unknown as Record<string, Schema>
const routes = contracts.routes.map((route) => ({
  method: route.method,
  pattern: new RegExp(`^${route.path.replace(/\{[^}]+\}/g, '[^/]+')}$`),
  schema: route.schema as Schema,
}))

function matches(value: unknown, schema: Schema, depth = 0): boolean {
  if (typeof schema === 'boolean') return schema
  if (depth > 128) return false
  const check = (child: Schema) => matches(value, child, depth + 1)
  if (schema.$ref) {
    const target = schemas[schema.$ref.replace('#/components/schemas/', '')]
    if (!target || !check(target)) return false
  }
  if (schema.allOf && !schema.allOf.every(check)) return false
  if (schema.anyOf && !schema.anyOf.some(check)) return false
  if (schema.oneOf && schema.oneOf.filter(check).length !== 1) return false
  if ('const' in schema && value !== schema.const) return false
  if (schema.enum && !schema.enum.includes(value)) return false
  if (schema.type) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type]
    if (
      !types.some((type) => {
        if (type === 'null') return value === null
        if (type === 'array') return Array.isArray(value)
        if (type === 'object')
          return value !== null && typeof value === 'object' && !Array.isArray(value)
        if (type === 'integer') return typeof value === 'number' && Number.isInteger(value)
        return typeof value === type
      })
    )
      return false
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return false
    if (schema.minimum !== undefined && value < schema.minimum) return false
    if (schema.maximum !== undefined && value > schema.maximum) return false
  }
  if (typeof value === 'string') {
    if (schema.minLength !== undefined && Array.from(value).length < schema.minLength) return false
    if (schema.maxLength !== undefined && Array.from(value).length > schema.maxLength) return false
  }
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) return false
    if (schema.maxItems !== undefined && value.length > schema.maxItems) return false
    if (
      schema.items !== undefined &&
      !value.every((item) => matches(item, schema.items!, depth + 1))
    )
      return false
  } else if (value !== null && typeof value === 'object') {
    const object = value as Record<string, unknown>
    if (schema.required?.some((key) => !(key in object))) return false
    for (const [key, child] of Object.entries(object)) {
      const property = schema.properties?.[key]
      if (property !== undefined && !matches(child, property, depth + 1)) return false
      if (
        property === undefined &&
        schema.additionalProperties !== undefined &&
        !matches(child, schema.additionalProperties, depth + 1)
      )
        return false
    }
  }
  return true
}

export function isValidResponse(method: string, path: string, value: unknown): boolean {
  const pathname = path.split('?')[0]
  const route = routes.find(
    (candidate) => candidate.method === method && candidate.pattern.test(pathname)
  )
  return !route || matches(value, route.schema)
}
