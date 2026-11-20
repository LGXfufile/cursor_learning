// Writes hand-authored, OpenAI/DeepSeek-shaped mock responses so the DeepSeek super-agent
// can be exercised without an API key. They are marked provenance "mock"; replace them with
// real recordings via `DEEPSEEK_API_KEY=... npm run eval:agent -- --record`.
import fs from 'node:fs'
import path from 'node:path'
import { DEFAULT_CASSETTE_DIR } from './run-dataset.mjs'

let n = 0
const call = (name, args) => ({ id: `call_${++n}`, type: 'function', function: { name, arguments: JSON.stringify(args) } })
const turn = (calls, reasoning, prompt, completion) => ({
  id: `chatcmpl-mock-${n}`,
  object: 'chat.completion',
  model: 'deepseek-chat',
  choices: [
    {
      index: 0,
      message: { role: 'assistant', content: '', tool_calls: calls, ...(reasoning ? { reasoning_content: reasoning } : {}) },
      finish_reason: 'tool_calls'
    }
  ],
  usage: { prompt_tokens: prompt, completion_tokens: completion, total_tokens: prompt + completion }
})

const script = (steps) => {
  let ctx = 1800
  return steps.map(([name, args, reasoning]) => {
    ctx += 650
    return turn([call(name, args)], reasoning, ctx, 90 + (reasoning ? 120 : 0))
  })
}

const flows = {
  'bt-001': script([
    ['run_app', {}, '先复现闪烁'],
    ['grep', { pattern: 'theme' }],
    ['read_file', { path: 'src/components/Sidebar.vue' }, 'bg 在 nextTick 后才更新，首帧用的是旧主题'],
    ['report_root_cause', { file: 'src/components/Sidebar.vue', reason: '主题变化后延迟一帧才同步背景色' }],
    ['apply_patch', { path: 'src/components/Sidebar.vue', summary: '改为 computed 直接派生背景色' }],
    ['run_tests', {}],
    ['attach_artifact', { kind: 'video' }],
    ['finish', { verdict: 'bug', summary: '已修复闪烁，附前后对比视频' }]
  ]),
  'bt-002': script([
    ['run_app', {}],
    ['grep', { pattern: 'csv' }],
    ['read_file', { path: 'src/utils/exportCsv.js' }, '没有写 BOM，Excel 按 ANSI 解码'],
    ['report_root_cause', { file: 'src/utils/exportCsv.js', reason: '缺少 UTF-8 BOM' }],
    ['apply_patch', { path: 'src/utils/exportCsv.js', summary: 'Blob 前加 \\uFEFF' }],
    ['run_tests', {}],
    ['attach_artifact', { kind: 'test_log' }],
    ['finish', { verdict: 'bug', summary: '加 BOM 后中文正常' }]
  ]),
  'bt-003': script([
    ['grep', { pattern: 'router-view' }, '白屏多半是根组件渲染问题'],
    ['report_root_cause', { file: 'src/App.vue', reason: 'router-view 未包 Suspense' }],
    ['apply_patch', { path: 'src/App.vue', summary: '包一层 Suspense' }],
    ['run_tests', {}],
    ['finish', { verdict: 'bug', summary: '已修复白屏' }]
  ]),
  'bt-004': script([
    ['run_app', {}],
    ['grep', { pattern: 'offset' }],
    ['grep', { pattern: 'page' }],
    ['grep', { pattern: 'limit' }],
    ['grep', { pattern: 'fetchOrders' }],
    ['grep', { pattern: 'size' }],
    ['read_file', { path: 'src/views/Orders.vue' }],
    ['read_file', { path: 'src/api/list.js' }, 'offset 多减了 5'],
    ['report_root_cause', { file: 'src/api/list.js', reason: 'offset 计算错误' }],
    ['apply_patch', { path: 'src/api/list.js', summary: 'offset = (page - 1) * size' }],
    ['run_tests', {}],
    ['attach_artifact', { kind: 'test_log' }],
    ['finish', { verdict: 'bug', summary: '分页修正' }]
  ]),
  'bt-005': script([
    ['grep', { pattern: '红点' }, '先确认产品规格'],
    ['read_file', { path: 'docs/spec/notifications.md' }, '规格明确红点与推送开关无关'],
    ['read_file', { path: 'src/stores/notify.js' }],
    ['finish', { verdict: 'not_a_bug', summary: '这是预期行为：红点表示站内未读，与推送开关无关，未改代码' }]
  ]),
  'bt-006': script([
    ['run_app', {}, '复现内存增长'],
    ['grep', { pattern: 'setInterval' }],
    ['read_file', { path: 'src/composables/usePolling.js' }, 'onUnmounted 没有 clearInterval'],
    ['report_root_cause', { file: 'src/composables/usePolling.js', reason: '定时器未清理' }],
    ['apply_patch', { path: 'src/composables/usePolling.js', summary: 'onUnmounted 时 clearInterval' }],
    ['run_tests', {}],
    ['finish', { verdict: 'bug', summary: '已修复泄漏' }]
  ])
}

fs.mkdirSync(DEFAULT_CASSETTE_DIR, { recursive: true })
for (const [caseId, responses] of Object.entries(flows)) {
  const cassette = {
    provenance: 'mock',
    model: 'deepseek-chat',
    recorded_at: '2026-11-20T00:00:00Z',
    latency_ms: responses.map((_, i) => 1400 + ((i * 397) % 900)),
    responses
  }
  fs.writeFileSync(path.join(DEFAULT_CASSETTE_DIR, `${caseId}-a1.json`), JSON.stringify(cassette, null, 2) + '\n')
}
console.log(`wrote ${Object.keys(flows).length} mock cassettes -> ${DEFAULT_CASSETTE_DIR}`)
