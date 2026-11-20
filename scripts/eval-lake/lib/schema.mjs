import fs from 'node:fs'
import path from 'node:path'
import { LAKE_ROOT } from './paths.mjs'

const schema = JSON.parse(
  fs.readFileSync(path.join(LAKE_ROOT, 'schema/eval-lake.schema.json'), 'utf8')
)

const typeOf = (v) => {
  if (Array.isArray(v)) return 'array'
  if (v === null) return 'null'
  if (typeof v === 'number') return Number.isInteger(v) ? 'integer' : 'number'
  return typeof v
}

// Supports the JSON Schema subset used by eval-lake.schema.json; no runtime dependency.
function check(node, value, at, errors) {
  if (node.$ref) {
    const name = node.$ref.replace('#/$defs/', '')
    return check(schema.$defs[name], value, at, errors)
  }
  if (node.type) {
    const t = typeOf(value)
    const ok = node.type === t || (node.type === 'number' && t === 'integer')
    if (!ok) {
      errors.push(`${at}: expected ${node.type}, got ${t}`)
      return
    }
  }
  if (node.enum && !node.enum.includes(value)) errors.push(`${at}: ${JSON.stringify(value)} not in enum`)
  if (node.pattern && !new RegExp(node.pattern).test(value)) errors.push(`${at}: does not match ${node.pattern}`)
  if (node.minimum !== undefined && value < node.minimum) errors.push(`${at}: < ${node.minimum}`)
  if (node.maximum !== undefined && value > node.maximum) errors.push(`${at}: > ${node.maximum}`)
  if (node.minItems !== undefined && value.length < node.minItems) errors.push(`${at}: needs >= ${node.minItems} items`)
  if (node.required) {
    for (const key of node.required) if (!(key in value)) errors.push(`${at}: missing "${key}"`)
  }
  if (node.properties) {
    for (const [key, sub] of Object.entries(node.properties)) {
      if (key in value) check(sub, value[key], `${at}.${key}`, errors)
    }
  }
  if (node.items) value.forEach((item, i) => check(node.items, item, `${at}[${i}]`, errors))
}

export function validate(defName, value, label = defName) {
  const errors = []
  check({ $ref: `#/$defs/${defName}` }, value, label, errors)
  return errors
}

export function assertValid(defName, records, label) {
  const errors = records.flatMap((r, i) => validate(defName, r, `${label}[${i}]`))
  if (errors.length) {
    throw new Error(`Schema validation failed (${defName}):\n  ${errors.slice(0, 20).join('\n  ')}`)
  }
}
