/**
 * SDK Generator — reads openapi.json and generates typed resource classes and types.
 *
 * Usage:
 *   node generate.mjs [path/to/openapi.json]
 *
 * Default input: ../../apps/touristical-renting/src/lib/openapi.json
 * Output: src/generated/  (types.ts, *.resource.ts, index.ts)
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join, dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = join(__dirname, 'src', 'generated')

mkdirSync(outDir, { recursive: true })

// ─── Read spec ────────────────────────────────────────────────────────────────

const specPath = process.argv[2]
  ?? resolve(__dirname, '../../apps/touristical-renting/src/lib/openapi.json')

const spec = JSON.parse(readFileSync(specPath, 'utf8'))
const schemas = spec.components?.schemas ?? {}
const paths = spec.paths ?? {}

// ─── Type generator ───────────────────────────────────────────────────────────

function refToName(ref) {
  return ref.replace('#/components/schemas/', '')
}

function schemaToTs(schema, indent = '') {
  if (!schema) return 'unknown'
  if (schema.$ref) return refToName(schema.$ref)

  switch (schema.type) {
    case 'string':
      if (schema.enum) return schema.enum.map(v => `'${v}'`).join(' | ')
      return 'string'
    case 'integer':
    case 'number':
      return 'number'
    case 'boolean':
      return 'boolean'
    case 'array':
      return `Array<${schemaToTs(schema.items, indent)}>`
    case 'object': {
      if (schema.additionalProperties) {
        return `Record<string, ${schemaToTs(schema.additionalProperties, indent)}>`
      }
      const props = schema.properties ?? {}
      const required = new Set(schema.required ?? [])
      const lines = Object.entries(props).map(([key, val]) => {
        const optional = required.has(key) ? '' : '?'
        const nullable = val.nullable ? ' | null' : ''
        const comment = val.description ? `  /** ${val.description} */\n` : ''
        return `${comment}  ${indent}${key}${optional}: ${schemaToTs(val, indent + '  ')}${nullable}`
      })
      return lines.length ? `{\n${lines.join('\n')}\n${indent}}` : 'Record<string, unknown>'
    }
    default:
      if (schema.allOf) {
        return schema.allOf.map(s => schemaToTs(s, indent)).join(' & ')
      }
      if (schema.oneOf ?? schema.anyOf) {
        return (schema.oneOf ?? schema.anyOf).map(s => schemaToTs(s, indent)).join(' | ')
      }
      return 'unknown'
  }
}

function generateTypes() {
  const lines = [
    '// GENERATED — do not edit manually. Run: pnpm --filter @public-internet/touristical-renting-sdk generate',
    '',
  ]

  // Simple string enums first, then objects
  for (const [name, schema] of Object.entries(schemas)) {
    if (schema.description) lines.push(`/** ${schema.description} */`)

    if (schema.type === 'string' && schema.enum) {
      lines.push(`export type ${name} = ${schemaToTs(schema)}`)
    } else if (schema.allOf) {
      lines.push(`export type ${name} = ${schemaToTs(schema)}`)
    } else {
      lines.push(`export interface ${name} ${schemaToTs(schema)}`)
    }
    lines.push('')
  }

  return lines.join('\n')
}

// ─── Resource class generator ─────────────────────────────────────────────────

/**
 * Given a path like /api/listings/{id}, determines:
 * - resourceGroup: 'listings', 'bookings', 'host.listings', 'host.bookings'
 * - isCollection: true if path ends without a param segment
 */
function classifyPath(path) {
  // Strip leading /api/
  const stripped = path.replace(/^\/api\//, '')
  const segments = stripped.split('/').filter(Boolean)

  // Remove param segments like {id}
  const staticSegments = segments.filter(s => !s.startsWith('{'))
  const hasParam = segments.some(s => s.startsWith('{'))

  const group = staticSegments.join('.')
  return { group, isCollection: !hasParam }
}

/**
 * Maps HTTP method + isCollection to SDK method name.
 */
function methodName(httpMethod, isCollection) {
  switch (httpMethod.toLowerCase()) {
    case 'get':    return isCollection ? 'list' : 'get'
    case 'post':   return 'create'
    case 'patch':  return 'update'
    case 'put':    return 'update'
    case 'delete': return 'delete'
    default:       return httpMethod.toLowerCase()
  }
}

/**
 * Extract the response type name from an operation (200/201 success response).
 */
function responseType(operation) {
  const successCode = ['200', '201'].find(c => operation.responses?.[c])
  if (!successCode) return 'void'
  const schema = operation.responses[successCode]?.content?.['application/json']?.schema
  if (!schema) return 'void'
  // The envelope is { data: T } — unwrap if present
  if (schema.properties?.data) {
    const inner = schema.properties.data
    return inner.$ref ? refToName(inner.$ref) : schemaToTs(inner)
  }
  return schema.$ref ? refToName(schema.$ref) : 'unknown'
}

/**
 * Extract request body type from an operation.
 */
function requestBodyType(operation) {
  const schema = operation.requestBody?.content?.['application/json']?.schema
  if (!schema) return null
  return schema.$ref ? refToName(schema.$ref) : null
}

/**
 * Build a list of SDK methods from the OpenAPI paths.
 */
function buildResourceMethods() {
  const resources = {} // group → [method descriptors]

  for (const [path, pathItem] of Object.entries(paths)) {
    const { group, isCollection } = classifyPath(path)
    if (!resources[group]) resources[group] = []

    // Extract path parameter names (e.g. {id} → 'id')
    const pathParams = (path.match(/\{(\w+)\}/g) ?? []).map(p => p.slice(1, -1))

    for (const [httpMethod, operation] of Object.entries(pathItem)) {
      if (['get', 'post', 'patch', 'put', 'delete'].indexOf(httpMethod) === -1) continue
      const name = methodName(httpMethod, isCollection)
      const returnType = responseType(operation)
      const bodyType = requestBodyType(operation)
      const summary = operation.summary ?? ''
      const secure = !!operation.security?.length

      resources[group].push({ name, httpMethod, path, pathParams, isCollection, returnType, bodyType, summary, secure })
    }
  }

  return resources
}

/**
 * Generate the URL expression for a path, e.g. /api/listings/${id}
 */
function buildUrl(path, pathParams) {
  let url = path
  for (const param of pathParams) {
    url = url.replace(`{${param}}`, `\${${param}}`)
  }
  return pathParams.length > 0 ? `\`${url}\`` : `'${url}'`
}

/**
 * Generate resource class content for a group.
 */
function toPascalCase(str) {
  // Handle dots and hyphens as word separators
  return str
    .split(/[.\-]/)
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .join('')
}

function generateResourceClass(group, methods) {
  const className = toPascalCase(group) + 'Resource'

  // Collect all base type names used (strip Array<...> wrappers)
  const usedTypes = new Set()
  const BUILT_INS = new Set(['Array', 'Record', 'Promise', 'Partial', 'Required', 'Readonly', 'Pick', 'Omit', 'Set', 'Map', 'Date', 'Error'])
  function extractBaseTypes(typeStr) {
    if (!typeStr || typeStr === 'void' || typeStr === 'unknown') return
    // Extract type names from Array<Foo>, Foo & Bar, Foo | Bar
    const names = typeStr.match(/\b[A-Z][A-Za-z0-9]*/g) ?? []
    for (const name of names) {
      if (!BUILT_INS.has(name)) usedTypes.add(name)
    }
  }
  for (const m of methods) {
    extractBaseTypes(m.returnType)
    if (m.bodyType) extractBaseTypes(m.bodyType)
  }

  const lines = [
    '// GENERATED — do not edit manually. Run: pnpm --filter @public-internet/touristical-renting-sdk generate',
    "import type { ApiClient } from '../client.js'",
  ]

  if (usedTypes.size > 0) {
    lines.push(`import type { ${[...usedTypes].join(', ')} } from './types.js'`)
  }
  lines.push('')
  lines.push(`export class ${className} {`)
  lines.push('  constructor(private readonly client: ApiClient) {}')
  lines.push('')

  for (const m of methods) {
    const { name, httpMethod, path, pathParams, isCollection, returnType, bodyType, summary, secure } = m

    const params = []
    for (const p of pathParams) params.push(`${p}: string`)

    if (httpMethod === 'get' && isCollection) {
      // list() — optional query params
      params.push('params?: Record<string, string | number | boolean | undefined>')
    }
    if (bodyType) {
      params.push(`body: ${bodyType}`)
    }

    const retType = returnType === 'void' ? 'Promise<void>' : `Promise<${returnType}>`
    const url = buildUrl(path, pathParams)

    const commentLines = []
    if (summary) commentLines.push(`   * ${summary}`)
    if (secure) commentLines.push(`   * Requires authentication.`)
    if (commentLines.length) {
      lines.push(`  /**`)
      for (const c of commentLines) lines.push(c)
      lines.push(`   */`)
    }

    let callArgs
    if (httpMethod === 'get' && isCollection) {
      callArgs = `${url}, params`
    } else if (httpMethod === 'get') {
      callArgs = url
    } else if (httpMethod === 'delete') {
      callArgs = url
    } else {
      callArgs = bodyType ? `${url}, body` : url
    }

    const clientMethod = httpMethod === 'patch' ? 'patch'
      : httpMethod === 'put' ? 'patch'
      : httpMethod === 'post' ? 'post'
      : httpMethod === 'delete' ? 'delete'
      : 'get'

    lines.push(`  ${name}(${params.join(', ')}): ${retType} {`)
    lines.push(`    return this.client.${clientMethod}(${callArgs})`)
    lines.push('  }')
    lines.push('')
  }

  lines.push('}')
  lines.push('')

  return { className, content: lines.join('\n') }
}

// ─── SDK main class generator ─────────────────────────────────────────────────

/**
 * Convert a dot-separated group key to a safe camelCase property name.
 * "users.me.become-host" → "usersMeBecomeHost"
 */
function groupToPropertyKey(group) {
  return group
    .split(/[.\-]/)
    .map((s, i) => i === 0 ? s : s.charAt(0).toUpperCase() + s.slice(1))
    .join('')
}

function generateSdkClass(resourceMap) {
  const lines = [
    '// GENERATED — do not edit manually. Run: pnpm --filter @public-internet/touristical-renting-sdk generate',
    "import type { ApiClient } from '../client.js'",
  ]

  const imports = []

  // Classify groups:
  //   - single-segment plain names (e.g. "listings", "bookings") → top-level fields
  //   - "host.*" → nested under this.host
  //   - everything else → camelCase top-level field using full dotted path
  const topLevelFields = []   // { key: string, className: string }
  const hostFields = []       // { key: string, className: string }

  for (const [group, { className, fileName }] of Object.entries(resourceMap)) {
    imports.push(`import { ${className} } from './${fileName}.js'`)
    if (group.startsWith('host.')) {
      const subKey = group.replace(/^host\./, '')
      // sub-keys under host are single words (e.g. "listings", "bookings")
      hostFields.push({ key: subKey, className })
    } else {
      // Use camelCase for any group so we always produce a valid identifier
      const key = groupToPropertyKey(group)
      topLevelFields.push({ key, className })
    }
  }

  lines.push(...imports)
  lines.push('')
  lines.push('export class TouristicalRentingSDK {')

  for (const { key, className } of topLevelFields) {
    lines.push(`  readonly ${key}: ${className}`)
  }
  if (hostFields.length) {
    lines.push(`  readonly host: {`)
    for (const { key, className } of hostFields) {
      lines.push(`    ${key}: ${className}`)
    }
    lines.push(`  }`)
  }
  lines.push('')
  lines.push('  constructor(client: ApiClient) {')

  for (const { key, className } of topLevelFields) {
    lines.push(`    this.${key} = new ${className}(client)`)
  }
  if (hostFields.length) {
    lines.push(`    this.host = {`)
    for (const { key, className } of hostFields) {
      lines.push(`      ${key}: new ${className}(client),`)
    }
    lines.push(`    }`)
  }
  lines.push('  }')
  lines.push('}')
  lines.push('')

  return lines.join('\n')
}

// ─── Run generation ───────────────────────────────────────────────────────────

const typesContent = generateTypes()
writeFileSync(join(outDir, 'types.ts'), typesContent, 'utf8')
console.log('✓ src/generated/types.ts')

const resources = buildResourceMethods()
const resourceMap = {}

for (const [group, methods] of Object.entries(resources)) {
  const { className, content } = generateResourceClass(group, methods)
  const fileName = group.replace(/\./g, '-') + '.resource'
  resourceMap[group] = { className, fileName }
  writeFileSync(join(outDir, `${fileName}.ts`), content, 'utf8')
  console.log(`✓ src/generated/${fileName}.ts`)
}

// Generate SDK class
const sdkContent = generateSdkClass(resourceMap)
writeFileSync(join(outDir, 'sdk.ts'), sdkContent, 'utf8')
console.log('✓ src/generated/sdk.ts')

// Generate index barrel
const indexLines = [
  '// GENERATED — do not edit manually.',
  "export * from './types.js'",
]
for (const { fileName, className } of Object.values(resourceMap)) {
  indexLines.push(`export { ${className} } from './${fileName}.js'`)
}
indexLines.push("export { TouristicalRentingSDK } from './sdk.js'")
indexLines.push('')

writeFileSync(join(outDir, 'index.ts'), indexLines.join('\n'), 'utf8')
console.log('✓ src/generated/index.ts')

console.log(`\n✓ SDK generated from ${Object.keys(paths).length} paths → ${Object.keys(resources).length} resources`)
