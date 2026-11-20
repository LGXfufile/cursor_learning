// Regenerates the synthetic sample lake under eval-lake/. Real projects ingest trials from
// their agent harness instead; this only exists so the MVP has reproducible demo data.
import fs from 'node:fs'
import path from 'node:path'
import { LAKE_ROOT } from './lib/paths.mjs'
import { sha256, writeJsonl } from './lib/lake.mjs'

const DATASET = 'bug-triage'
const VERSION = 'v1'
const REF = `${DATASET}@${VERSION}`

const bugGraders = (budget) => [
  { name: 'tests_pass', type: 'rule', check: 'outcome_equals', path: 'outcome.tests_pass', value_from: 'expected.tests_pass' },
  { name: 'root_cause_correct', type: 'rule', check: 'outcome_equals', path: 'outcome.root_cause_file', value_from: 'expected.root_cause_file' },
  { name: 'read_before_claim', type: 'rule', check: 'read_before_claim' },
  { name: 'evidence_artifact', type: 'rule', check: 'artifact_present', kinds: ['screenshot', 'video', 'test_log', 'heap_snapshot'] },
  { name: 'tool_budget', type: 'rule', check: 'max_tool_calls', max: budget },
  {
    name: 'rubric_judge',
    type: 'judge',
    threshold: 0.6,
    rubric: ['先复现再下结论', '根因有源码证据支撑', '修复最小且可验证', '交付物可供人复核（测试/截图/视频）']
  }
]

const cases = [
  {
    case_id: 'bt-001', title: '切换主题后侧边栏闪烁', split: 'dev', tags: ['ui', 'regression'], source: 'production_trace',
    input: { prompt: '设置里切换深色主题时侧边栏会闪一下，帮我看看怎么回事', context: { app_version: '2.3.1' } },
    expected: { tests_pass: true, root_cause_file: 'src/components/Sidebar.vue' }, graders: bugGraders(12)
  },
  {
    case_id: 'bt-002', title: '导出 CSV 中文乱码', split: 'dev', tags: ['data', 'i18n'], source: 'handwritten',
    input: { prompt: '导出的 CSV 用 Excel 打开中文全是乱码' },
    expected: { tests_pass: true, root_cause_file: 'src/utils/exportCsv.js' }, graders: bugGraders(10)
  },
  {
    case_id: 'bt-003', title: '登录后偶发白屏', split: 'holdout', tags: ['routing', 'flaky'], source: 'production_trace',
    input: { prompt: '有用户反馈登录完偶尔是白屏，刷新就好了' },
    expected: { tests_pass: true, root_cause_file: 'src/router.js' }, graders: bugGraders(14)
  },
  {
    case_id: 'bt-004', title: '列表第二页出现重复数据', split: 'dev', tags: ['data', 'api'], source: 'handwritten',
    input: { prompt: '订单列表翻到第二页，前几条和第一页一样' },
    expected: { tests_pass: true, root_cause_file: 'src/api/list.js' }, graders: bugGraders(12)
  },
  {
    case_id: 'bt-005', title: '关闭通知后仍有红点（预期行为）', split: 'holdout', tags: ['not-a-bug', 'stop-the-line'], source: 'production_trace',
    input: { prompt: '我把通知关了为什么还有红点？是不是 bug' },
    expected: { verdict: 'not_a_bug', diff_files: [] },
    graders: [
      { name: 'verdict_correct', type: 'rule', check: 'outcome_equals', path: 'outcome.verdict', value_from: 'expected.verdict' },
      { name: 'no_code_change', type: 'rule', check: 'outcome_equals', path: 'outcome.diff_files', value_from: 'expected.diff_files' },
      {
        name: 'rubric_judge', type: 'judge', threshold: 0.6,
        rubric: ['查阅产品规格或代码确认预期行为', '明确给出“非 bug”结论并停止流水线', '给用户可执行的解释']
      }
    ]
  },
  {
    case_id: 'bt-006', title: '切换标签页内存持续上涨', split: 'holdout', tags: ['perf', 'memory'], source: 'handwritten',
    input: { prompt: '页面开久了很卡，来回切标签页内存一直涨' },
    expected: { tests_pass: true, root_cause_file: 'src/composables/usePolling.js' }, graders: bugGraders(14)
  }
]

// Behaviour spec per (variant, case, attempt). v1 often names a "smoking gun" without
// opening the file; v2 (the candidate skill) must read source and attach evidence.
const W = 'src/App.vue'
const spec = {
  v1: {
    'bt-001': [{ read: false, tests: true, artifacts: [], tools: 6 }, { read: true, tests: true, artifacts: ['screenshot'], tools: 8 }],
    'bt-002': [{ read: true, tests: true, artifacts: ['test_log'], tools: 7 }, { read: true, tests: true, artifacts: ['test_log'], tools: 6 }],
    'bt-003': [{ read: false, claim: W, tests: false, artifacts: [], tools: 5 }, { read: false, claim: W, tests: false, artifacts: ['screenshot'], tools: 6 }],
    'bt-004': [{ read: true, tests: true, artifacts: ['test_log'], tools: 8 }, { read: true, tests: true, artifacts: ['test_log'], tools: 9 }],
    'bt-005': [{ verdict: 'bug', diff: ['src/stores/notify.js'], tools: 6 }, { verdict: 'not_a_bug', diff: [], tools: 5 }],
    'bt-006': [{ read: false, claim: 'src/views/Tabs.vue', tests: false, artifacts: [], tools: 7 }, { read: true, tests: true, artifacts: [], tools: 10 }]
  },
  v2: {
    'bt-001': [{ read: true, tests: true, artifacts: ['screenshot', 'video'], tools: 9 }, { read: true, tests: true, artifacts: ['video'], tools: 10 }],
    'bt-002': [{ read: true, tests: true, artifacts: ['test_log'], tools: 8 }, { read: true, tests: true, artifacts: ['test_log'], tools: 8 }],
    'bt-003': [{ read: true, tests: true, artifacts: ['test_log', 'video'], tools: 12 }, { read: true, tests: true, artifacts: ['test_log'], tools: 13 }],
    'bt-004': [{ read: true, tests: true, artifacts: ['test_log'], tools: 11 }, { read: true, tests: true, artifacts: ['test_log'], tools: 15 }],
    'bt-005': [{ verdict: 'not_a_bug', diff: [], tools: 6 }, { verdict: 'not_a_bug', diff: [], tools: 7 }],
    'bt-006': [{ read: true, tests: true, artifacts: ['heap_snapshot'], tools: 13 }, { read: true, tests: true, artifacts: ['heap_snapshot', 'test_log'], tools: 12 }]
  }
}

const runs = {
  v1: { run_id: '2026-11-18-triage-v1', model: 'model-alpha', git_sha: 'a1b2c3d', start: Date.UTC(2026, 10, 18, 2) },
  v2: { run_id: '2026-11-20-triage-v2', model: 'model-alpha', git_sha: 'e4f5a6b', start: Date.UTC(2026, 10, 20, 2) }
}

function buildEvents(kase, s) {
  const events = [{ type: 'user_message', content: kase.input.prompt }]
  const root = kase.expected.root_cause_file
  if (kase.expected.verdict) {
    events.push({ type: 'thinking', content: '先确认这是不是预期行为' })
    if (s.verdict === 'not_a_bug') {
      events.push({ type: 'tool_call', tool: 'read_file', args: { path: 'docs/spec/notifications.md' }, result_summary: '规格：关闭推送不影响站内未读红点' })
    }
    while (events.filter((e) => e.type === 'tool_call').length < s.tools) {
      events.push({ type: 'tool_call', tool: 'grep', args: { pattern: 'badge' }, result_summary: '3 matches' })
    }
    events.push({
      type: 'assistant_message',
      content: s.verdict === 'not_a_bug' ? '这是预期行为：红点代表站内未读，与推送开关无关。不改代码。' : '找到原因了，已修改 notify store 让红点跟随推送开关。'
    })
    return events
  }
  const claimFile = s.claim ?? root
  events.push({ type: 'tool_call', tool: 'run_app', args: { scenario: kase.case_id }, result_summary: s.read ? '复现成功' : '跳过复现' })
  let tools = 1
  if (s.read) {
    events.push({ type: 'tool_call', tool: 'read_file', args: { path: claimFile }, result_summary: '定位到可疑代码' })
    tools++
  }
  events.push({ type: 'thinking', content: s.read ? '根据源码与复现结果形成假设' : '这里应该就是 smoking gun' })
  events.push({ type: 'claim', file: claimFile, content: `根因在 ${claimFile}` })
  while (tools < s.tools - 1) {
    events.push({ type: 'tool_call', tool: 'grep', args: { pattern: 'caller' }, result_summary: '追踪调用方' })
    tools++
  }
  events.push({ type: 'tool_call', tool: 'run_tests', args: {}, result_summary: s.tests ? 'all passed' : '2 failed' })
  for (const kind of s.artifacts) events.push({ type: 'artifact', kind, uri: `artifacts/${kase.case_id}/${kind}` })
  events.push({ type: 'assistant_message', content: s.tests ? '已修复，附验证结果。' : '已修复（未能通过全部测试）。' })
  return events
}

function buildTrial(variantKey, kase, s, attempt) {
  const run = runs[variantKey]
  const events = buildEvents(kase, s).map((e, seq) => ({ seq, ...e }))
  const outcome = kase.expected.verdict
    ? { verdict: s.verdict, diff_files: s.diff }
    : { tests_pass: s.tests, root_cause_file: s.claim ?? kase.expected.root_cause_file, diff_files: [s.claim ?? kase.expected.root_cause_file] }
  const input = 4000 + s.tools * 1800
  const output = 600 + s.tools * 150
  return {
    trial_id: `${run.run_id}/${kase.case_id}/a${attempt}`,
    run_id: run.run_id,
    case_id: kase.case_id,
    dataset: REF,
    variant: { name: 'triage-skill', version: variantKey, model: run.model, harness: 'cursor-agent', git_sha: run.git_sha },
    attempt,
    events,
    outcome,
    usage: {
      input_tokens: input,
      output_tokens: output,
      cost_usd: Number(((input * 3 + output * 15) / 1e6).toFixed(4)),
      duration_ms: 20000 + s.tools * 9000
    }
  }
}

function judgeFor(trial, kase, s) {
  const n = kase.graders.find((g) => g.type === 'judge').rubric.length
  let criteria
  let rationale
  if (kase.expected.verdict) {
    const ok = s.verdict === 'not_a_bug'
    criteria = ok ? [1, 1, 0.75] : [0.25, 0, 0.5]
    rationale = ok ? '查阅规格后给出非 bug 结论' : '未核对规格就改了代码'
  } else if (!s.read && s.tests) {
    // A confident, passing-looking answer fools the judge; humans catch it (see annotations).
    criteria = [0.5, 0.75, 0.75, 0.5]
    rationale = '结论明确、测试通过'
  } else {
    criteria = [s.read ? 1 : 0.25, s.read ? 1 : 0.25, s.tests ? 0.75 : 0.25, s.artifacts.length ? 1 : 0.25]
    rationale = s.read ? '复现与源码证据充分' : '缺少复现和源码证据'
  }
  return { trial_id: trial.trial_id, grader: 'rubric_judge', judge_model: 'judge-beta (different family)', criteria: criteria.slice(0, n), rationale }
}

const datasetDir = path.join(LAKE_ROOT, 'datasets', DATASET, VERSION)
writeJsonl(path.join(datasetDir, 'cases.jsonl'), cases)
fs.writeFileSync(
  path.join(datasetDir, 'manifest.json'),
  JSON.stringify(
    {
      dataset: DATASET,
      version: VERSION,
      created_at: '2026-11-17T00:00:00Z',
      description: '缺陷分诊/修复智能体的示例用例集（合成数据，用于 MVP 演示）',
      case_count: cases.length,
      cases_sha256: sha256(path.join(datasetDir, 'cases.jsonl'))
    },
    null,
    2
  ) + '\n'
)

for (const variantKey of Object.keys(spec)) {
  const trials = []
  const judge = []
  for (const kase of cases) {
    spec[variantKey][kase.case_id].forEach((s, i) => {
      const trial = buildTrial(variantKey, kase, s, i + 1)
      trials.push(trial)
      judge.push(judgeFor(trial, kase, s))
    })
  }
  const dir = path.join(LAKE_ROOT, 'runs', runs[variantKey].run_id)
  writeJsonl(path.join(dir, 'trials.jsonl'), trials)
  writeJsonl(path.join(dir, 'judge.jsonl'), judge)
}

writeJsonl(path.join(LAKE_ROOT, 'annotations/human-labels.jsonl'), [
  { trial_id: '2026-11-18-triage-v1/bt-001/a1', annotator: 'reviewer-a', label: 'fail', failure_tags: ['claimed-without-reading'], note: '没打开 Sidebar.vue 就断言根因，碰巧对了', created_at: '2026-11-18T09:00:00Z' },
  { trial_id: '2026-11-18-triage-v1/bt-003/a1', annotator: 'reviewer-a', label: 'fail', failure_tags: ['claimed-without-reading', 'no-repro'], note: '没复现就改 App.vue', created_at: '2026-11-18T09:05:00Z' },
  { trial_id: '2026-11-18-triage-v1/bt-005/a1', annotator: 'reviewer-b', label: 'fail', failure_tags: ['did-not-stop-the-line'], note: '把预期行为当 bug 修了', created_at: '2026-11-18T09:10:00Z' },
  { trial_id: '2026-11-18-triage-v1/bt-006/a2', annotator: 'reviewer-b', label: 'fail', failure_tags: ['no-evidence'], note: '修对了但没有 heap snapshot，无法复核', created_at: '2026-11-18T09:20:00Z' },
  { trial_id: '2026-11-20-triage-v2/bt-001/a1', annotator: 'reviewer-a', label: 'pass', note: '有前后对比视频', created_at: '2026-11-20T09:00:00Z' },
  { trial_id: '2026-11-20-triage-v2/bt-003/a2', annotator: 'reviewer-a', label: 'pass', note: '定位到路由守卫竞态，证据完整', created_at: '2026-11-20T09:05:00Z' },
  { trial_id: '2026-11-20-triage-v2/bt-005/a1', annotator: 'reviewer-b', label: 'pass', note: '正确停线', created_at: '2026-11-20T09:10:00Z' }
])

console.log(`seeded ${REF}: ${cases.length} cases, ${Object.keys(spec).length} runs`)
