/**
 * SDK Generator — reads openapi.json and generates typed resource classes and types.
 *
 * Usage:
 *   node generate.mjs [path/to/openapi.json]
 *
 * Default input: ../../apps/eats/src/lib/openapi.json
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
  ?? resolve(__dirname, '../../apps/eats/src/lib/openapi.json')

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
    '// GENERATED — do not edit manually. Run: pnpm --filter @public-internet/eats-sdk generate',
    '',
  ]

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

function classifyPath(path) {
  const stripped = path.replace(/^\/api\//, '')
  const segments = stripped.split('/').filter(Boolean)
  const staticSegments = segments.filter(s => !s.startsWith('{'))
  const hasParam = segments.some(s => s.startsWith('{'))
  const group = staticSegments.join('.')
  return { group, isCollection: !hasParam }
}

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

function responseType(operation) {
  const successCode = ['200', '201'].find(c => operation.responses?.[c])
  if (!successCode) return 'void'
  const schema = operation.responses[successCode]?.content?.['application/json']?.schema
  if (!schema) return 'void'
  if (schema.properties?.data) {
    const inner = schema.properties.data
    return inner.$ref ? refToName(inner.$ref) : schemaToTs(inner)
  }
  return schema.$ref ? refToName(schema.$ref) : 'unknown'
}

function requestBodyType(operation) {
  const schema = operation.requestBody?.content?.['application/json']?.schema
  if (!schema) return null
  return schema.$ref ? refToName(schema.$ref) : null
}

function buildResourceMethods() {
  const resources = {}

  for (const [path, pathItem] of Object.entries(paths)) {
    const { group, isCollection } = classifyPath(path)
    if (!resources[group]) resources[group] = []

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

function buildUrl(path, pathParams) {
  let url = path
  for (const param of pathParams) {
    url = url.replace(`{${param}}`, `\${${param}}`)
  }
  return pathParams.length > 0 ? `\`${url}\`` : `'${url}'`
}

function generateResourceClass(group, methods) {
  const className = group
    .split('.')
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .join('') + 'Resource'

  const usedTypes = new Set()
  const BUILT_INS = new Set(['Array', 'Record', 'Promise', 'Partial', 'Required', 'Readonly', 'Pick', 'Omit', 'Set', 'Map', 'Date', 'Error'])
  function extractBaseTypes(typeStr) {
    if (!typeStr || typeStr === 'void' || typeStr === 'unknown') return
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
    '// GENERATED — do not edit manually. Run: pnpm --filter @public-internet/eats-sdk generate',
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

function generateSdkClass(resourceMap) {
  const lines = [
    '// GENERATED — do not edit manually. Run: pnpm --filter @public-internet/eats-sdk generate',
    "import type { ApiClient } from '../client.js'",
  ]

  const imports = []
  const topLevelFields = []
  const nestedFields = {} // key: namespace, value: [{key, className}]

  for (const [group, { className, fileName }] of Object.entries(resourceMap)) {
    imports.push(`import { ${className} } from './${fileName}.js'`)
    const parts = group.split('.')
    if (parts.length === 1) {
      topLevelFields.push({ key: group, className })
    } else {
      const ns = parts[0]
      const subKey = parts.slice(1).join('.')
      if (!nestedFields[ns]) nestedFields[ns] = []
      nestedFields[ns].push({ key: subKey, className })
    }
  }

  lines.push(...imports)
  lines.push('')
  lines.push('export class EatsSDK {')

  for (const { key, className } of topLevelFields) {
    lines.push(`  readonly ${key}: ${className}`)
  }
  for (const [ns, fields] of Object.entries(nestedFields)) {
    lines.push(`  readonly ${ns}: {`)
    for (const { key, className } of fields) {
      lines.push(`    ${key}: ${className}`)
    }
    lines.push(`  }`)
  }
  lines.push('')
  lines.push('  constructor(client: ApiClient) {')

  for (const { key, className } of topLevelFields) {
    lines.push(`    this.${key} = new ${className}(client)`)
  }
  for (const [ns, fields] of Object.entries(nestedFields)) {
    lines.push(`    this.${ns} = {`)
    for (const { key, className } of fields) {
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

const sdkContent = generateSdkClass(resourceMap)
writeFileSync(join(outDir, 'sdk.ts'), sdkContent, 'utf8')
console.log('✓ src/generated/sdk.ts')

const indexLines = [
  '// GENERATED — do not edit manually.',
  "export * from './types.js'",
]
for (const { fileName, className } of Object.values(resourceMap)) {
  indexLines.push(`export { ${className} } from './${fileName}.js'`)
}
indexLines.push("export { EatsSDK } from './sdk.js'")
indexLines.push('')

writeFileSync(join(outDir, 'index.ts'), indexLines.join('\n'), 'utf8')
console.log('✓ src/generated/index.ts')

console.log(`\n✓ SDK generated from ${Object.keys(paths).length} paths → ${Object.keys(resources).length} resources`)
