import fs from 'node:fs'
import path from 'node:path'
import { LAKE_ROOT } from '../lib/paths.mjs'

// Environments live beside (not inside) the immutable dataset version. `fix_file` is the
// simulator's hidden ground truth and is never shown to the agent.
export function loadEnv(datasetRef, caseId) {
  const [name, version] = datasetRef.split('@')
  const file = path.join(LAKE_ROOT, 'envs', name, version, `${caseId}.json`)
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

export const TOOL_SPECS = [
  ['run_app', '启动应用并按用户描述的路径操作，返回观察到的现象', {}],
  ['read_file', '读取仓库中的文件', { path: { type: 'string' } }],
  ['grep', '在仓库中搜索文本', { pattern: { type: 'string' } }],
  ['report_root_cause', '记录你确认的根因所在文件与理由', { file: { type: 'string' }, reason: { type: 'string' } }],
  ['apply_patch', '修改文件', { path: { type: 'string' }, summary: { type: 'string' } }],
  ['run_tests', '运行项目测试', {}],
  ['attach_artifact', '附上证据：screenshot / video / test_log / heap_snapshot', { kind: { type: 'string' } }],
  ['finish', '结束任务。verdict 为 bug 或 not_a_bug', { verdict: { type: 'string', enum: ['bug', 'not_a_bug'] }, summary: { type: 'string' } }]
].map(([name, description, properties]) => ({
  type: 'function',
  function: { name, description, parameters: { type: 'object', properties, required: Object.keys(properties) } }
}))

export function createSandbox(env) {
  const state = { diff_files: [], tests_pass: false, root_cause_file: null, verdict: null }
  const tools = {
    run_app: () => ({ observed: env.repro }),
    read_file: ({ path: p }) => (p in env.files ? { content: env.files[p] } : { error: `not found: ${p}` }),
    grep: ({ pattern }) => ({
      matches: Object.entries(env.files)
        .filter(([, content]) => content.toLowerCase().includes(String(pattern).toLowerCase()))
        .map(([p]) => p)
    }),
    report_root_cause: ({ file }) => {
      state.root_cause_file = file
      return { recorded: file }
    },
    apply_patch: ({ path: p }) => {
      if (!(p in env.files)) return { error: `not found: ${p}` }
      if (!state.diff_files.includes(p)) state.diff_files.push(p)
      return { patched: p }
    },
    run_tests: () => {
      state.tests_pass = env.fix_file ? state.diff_files.includes(env.fix_file) : state.diff_files.length === 0
      return { passed: state.tests_pass, summary: state.tests_pass ? 'all passed' : '2 failed' }
    },
    attach_artifact: ({ kind }) => ({ uri: `artifacts/${env.case_id}/${kind}` }),
    finish: ({ verdict }) => {
      state.verdict = verdict
      return { done: true }
    }
  }
  return {
    has: (name) => name in tools,
    call: (name, args) => tools[name](args ?? {}),
    state: () => structuredClone(state)
  }
}
