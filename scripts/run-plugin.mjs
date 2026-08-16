import { cpSync, existsSync, lstatSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const pluginRoot = join(root, 'examples/fde-cursor-plugin')
const localDir = join(homedir(), '.cursor/plugins/local')
const linkPath = join(localDir, 'fde-cursor-efficiency')
const statusPath = join(root, 'public/plugin-status.json')
const serve = process.argv.includes('--serve')

function isLink(path) {
  try {
    return lstatSync(path).isSymbolicLink()
  } catch {
    return false
  }
}

function installLocalPlugin() {
  if (!existsSync(join(pluginRoot, '.cursor-plugin/plugin.json'))) {
    throw new Error(`plugin missing at ${pluginRoot}`)
  }

  mkdirSync(localDir, { recursive: true })
  if (existsSync(linkPath) || isLink(linkPath)) {
    rmSync(linkPath, { recursive: true, force: true })
  }
  symlinkSync(pluginRoot, linkPath)
}

function syncWorkspace() {
  const mapping = [
    ['skills', '.cursor/skills'],
    ['commands', '.cursor/commands'],
    ['agents', '.cursor/agents']
  ]

  for (const [from, to] of mapping) {
    const source = join(pluginRoot, from)
    const target = join(root, to)
    mkdirSync(dirname(target), { recursive: true })
    rmSync(target, { recursive: true, force: true })
    cpSync(source, target, { recursive: true })
  }
}

function writeStatus() {
  const manifest = JSON.parse(
    readFileSync(join(pluginRoot, '.cursor-plugin/plugin.json'), 'utf8')
  )
  const status = {
    name: manifest.name,
    version: manifest.version,
    running: true,
    installedAt: new Date().toISOString(),
    localLink: linkPath,
    pluginRoot,
    workspace: {
      rules: ['.cursor/rules/vue-learning-site.mdc'],
      skills: ['.cursor/skills/add-learn-module', '.cursor/skills/review-lesson'],
      commands: ['.cursor/commands/new-lesson.md'],
      agents: ['.cursor/agents/lesson-writer.md']
    },
    lesson: '/#/learn?section=4-1'
  }

  mkdirSync(dirname(statusPath), { recursive: true })
  writeFileSync(statusPath, `${JSON.stringify(status, null, 2)}\n`)
  return status
}

function startSite() {
  const child = spawn(
    'npx',
    ['vite', '--host', '0.0.0.0', '--port', '5173', '--strictPort'],
    {
      cwd: root,
      stdio: 'inherit',
      env: process.env
    }
  )

  child.on('exit', (code) => {
    process.exit(code ?? 0)
  })
}

installLocalPlugin()
syncWorkspace()
const status = writeStatus()

console.log('fde-cursor-efficiency is running')
console.log(`local plugin: ${status.localLink}`)
console.log(`workspace skills: ${status.workspace.skills.join(', ')}`)
console.log(`status: ${statusPath}`)
console.log(`lesson: ${status.lesson}`)

if (serve) {
  startSite()
}
