import { readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const pluginRoot = join(root, 'examples/fde-cursor-plugin')
const errors = []

function mustExist(relativePath) {
  const full = join(pluginRoot, relativePath)
  if (!existsSync(full)) {
    errors.push(`missing ${relativePath}`)
  }
}

mustExist('.cursor-plugin/plugin.json')
mustExist('README.md')
mustExist('rules/vue-element-plus.mdc')
mustExist('rules/learn-module.mdc')
mustExist('skills/add-learn-module/SKILL.md')
mustExist('skills/review-lesson/SKILL.md')
mustExist('commands/new-lesson.md')
mustExist('agents/lesson-writer.md')

const manifestPath = join(pluginRoot, '.cursor-plugin/plugin.json')
if (existsSync(manifestPath)) {
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  for (const field of ['name', 'version', 'description']) {
    if (!manifest[field]) {
      errors.push(`plugin.json missing ${field}`)
    }
  }
  if (manifest.name !== 'fde-cursor-efficiency') {
    errors.push(`unexpected plugin name: ${manifest.name}`)
  }
}

const catalogPath = join(root, 'src/data/pluginCatalog.js')
const catalog = readFileSync(catalogPath, 'utf8')
for (const token of [
  'pluginComponents',
  'recommendedPlugins',
  'installSteps',
  'localPluginTree',
  'fde-cursor-efficiency'
]) {
  if (!catalog.includes(token)) {
    errors.push(`pluginCatalog.js missing ${token}`)
  }
}

if (errors.length) {
  console.error('plugin validation failed:')
  for (const error of errors) {
    console.error(`- ${error}`)
  }
  process.exit(1)
}

console.log('plugin validation passed')
