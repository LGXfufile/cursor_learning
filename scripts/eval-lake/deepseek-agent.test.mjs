import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { httpTransport, loadDeepSeekConfig, replayTransport } from './agents/deepseek.mjs'
import { buildPrompts, runSuperAgent } from './agents/super-agent.mjs'
import { createSandbox, loadEnv } from './agents/sandbox.mjs'
import { gradeTrial } from './lib/graders.mjs'
import { DEFAULT_CASSETTE_DIR, runDataset } from './agents/run-dataset.mjs'
import { loadDataset, loadRun } from './lib/lake.mjs'
import { validate } from './lib/schema.mjs'

const dataset = loadDataset('bug-triage@v1')
const caseById = (id) => dataset.cases.find((c) => c.case_id === id)

const toolCall = (id, name, args) => ({ id, type: 'function', function: { name, arguments: JSON.stringify(args) } })
const reply = (toolCalls, { content = '', reasoning, prompt = 100, completion = 20 } = {}) => ({
  choices: [
    {
      message: { role: 'assistant', content, tool_calls: toolCalls, ...(reasoning ? { reasoning_content: reasoning } : {}) },
      finish_reason: toolCalls?.length ? 'tool_calls' : 'stop'
    }
  ],
  usage: { prompt_tokens: prompt, completion_tokens: completion }
})

const goodCassette = [
  reply([toolCall('c1', 'run_app', {})], { reasoning: '先复现' }),
  reply([toolCall('c2', 'grep', { pattern: 'csv' })]),
  reply([toolCall('c3', 'read_file', { path: 'src/utils/exportCsv.js' })]),
  reply([toolCall('c4', 'report_root_cause', { file: 'src/utils/exportCsv.js', reason: '缺少 UTF-8 BOM' })]),
  reply([toolCall('c5', 'apply_patch', { path: 'src/utils/exportCsv.js', summary: '写入 BOM' })]),
  reply([toolCall('c6', 'run_tests', {})]),
  reply([toolCall('c7', 'attach_artifact', { kind: 'test_log' })]),
  reply([toolCall('c8', 'finish', { verdict: 'bug', summary: '已修复并附测试日志' })])
]

const agentOpts = (kase, transport, extra = {}) => ({
  kase,
  env: loadEnv(dataset.ref, kase.case_id),
  transport,
  runId: 'test-run',
  attempt: 1,
  variant: { name: 'deepseek-super-agent', version: 'v0', model: 'deepseek-chat', harness: 'eval-lake-super-agent' },
  clock: (() => {
    let t = 0
    return () => (t += 1000)
  })(),
  ...extra
})

test('config: missing DEEPSEEK_API_KEY falls back to replay mode without throwing', () => {
  const cfg = loadDeepSeekConfig({})
  assert.equal(cfg.mode, 'replay')
  assert.equal(cfg.apiKey, undefined)
  assert.equal(cfg.baseUrl, 'https://api.deepseek.com')
  assert.equal(cfg.model, 'deepseek-chat')
})

test('config: key, base url and model come from the environment', () => {
  const cfg = loadDeepSeekConfig({ DEEPSEEK_API_KEY: 'k', DEEPSEEK_BASE_URL: 'https://proxy.example/v1/', DEEPSEEK_MODEL: 'deepseek-reasoner' })
  assert.equal(cfg.mode, 'live')
  assert.equal(cfg.apiKey, 'k')
  assert.equal(cfg.baseUrl, 'https://proxy.example/v1')
  assert.equal(cfg.model, 'deepseek-reasoner')
})

test('httpTransport sends an OpenAI-compatible chat.completions request', async () => {
  let seen
  const fetchImpl = async (url, init) => {
    seen = { url, init }
    return { ok: true, status: 200, json: async () => reply([]) }
  }
  const send = httpTransport({ apiKey: 'secret-key', baseUrl: 'https://api.deepseek.com', model: 'deepseek-chat', fetchImpl })
  await send({ messages: [{ role: 'user', content: 'hi' }], tools: [{ type: 'function', function: { name: 'x' } }] })
  assert.equal(seen.url, 'https://api.deepseek.com/chat/completions')
  assert.equal(seen.init.method, 'POST')
  assert.equal(seen.init.headers.Authorization, 'Bearer secret-key')
  const body = JSON.parse(seen.init.body)
  assert.equal(body.model, 'deepseek-chat')
  assert.equal(body.messages[0].content, 'hi')
  assert.equal(body.tools[0].function.name, 'x')
})

test('httpTransport errors report the status but never leak the key', async () => {
  const fetchImpl = async () => ({ ok: false, status: 401, text: async () => 'invalid key secret-key' })
  const send = httpTransport({ apiKey: 'secret-key', baseUrl: 'https://api.deepseek.com', model: 'm', fetchImpl })
  await assert.rejects(send({ messages: [] }), (err) => {
    assert.match(err.message, /401/)
    assert.doesNotMatch(err.message, /secret-key/)
    return true
  })
})

test('replayTransport plays responses in order and fails loudly when exhausted', async () => {
  const send = replayTransport([reply([], { content: 'a' }), reply([], { content: 'b' })])
  assert.equal((await send({})).choices[0].message.content, 'a')
  assert.equal((await send({})).choices[0].message.content, 'b')
  await assert.rejects(send({}), /cassette exhausted/)
})

test('candidate prompts are blinded: no eval vocabulary leaks to the agent', () => {
  const { system, user } = buildPrompts(caseById('bt-002'))
  const banned = /\b(eval|evaluation|test case|judge|rubric|score|benchmark|candidate|experiment|arena|grader)\b/i
  assert.doesNotMatch(system, banned)
  assert.doesNotMatch(user, banned)
  assert.equal(user, caseById('bt-002').input.prompt)
})

test('sandbox hides expected answers and simulates tests from the agent’s edits', () => {
  const box = createSandbox(loadEnv(dataset.ref, 'bt-002'))
  assert.equal(box.call('run_tests', {}).passed, false)
  box.call('apply_patch', { path: 'src/utils/exportCsv.js', summary: 'BOM' })
  assert.equal(box.call('run_tests', {}).passed, true)
  assert.match(box.call('read_file', { path: 'src/utils/exportCsv.js' }).content, /join/)
  assert.match(box.call('read_file', { path: 'nope.js' }).error, /not found/)
})

test('super-agent run on a replayed cassette yields a schema-valid trial with a full trace', async () => {
  const kase = caseById('bt-002')
  const trial = await runSuperAgent(agentOpts(kase, replayTransport(goodCassette)))
  assert.deepEqual(validate('Trial', trial), [])
  assert.equal(trial.trial_id, 'test-run/bt-002/a1')
  assert.equal(trial.dataset, 'bug-triage@v1')
  const types = trial.events.map((e) => e.type)
  assert.equal(types[0], 'user_message')
  assert.ok(types.includes('thinking'))
  assert.ok(types.includes('claim'))
  assert.ok(types.includes('artifact'))
  assert.equal(types.at(-1), 'assistant_message')
  assert.deepEqual(trial.outcome, {
    verdict: 'bug',
    tests_pass: true,
    root_cause_file: 'src/utils/exportCsv.js',
    diff_files: ['src/utils/exportCsv.js']
  })
  assert.equal(trial.usage.input_tokens, 800)
  assert.equal(trial.usage.output_tokens, 160)
  assert.equal(trial.usage.duration_ms, 8000)
})

test('captured trial is graded by the lake: all rule graders pass for the good run', async () => {
  const kase = caseById('bt-002')
  const trial = await runSuperAgent(agentOpts(kase, replayTransport(goodCassette)))
  const g = gradeTrial(trial, kase, [], null)
  assert.deepEqual(g.scores.filter((s) => !s.passed).map((s) => s.grader), [])
  assert.equal(g.passed, true)
})

test('a run that claims a root cause without reading the file is caught by read_before_claim', async () => {
  const kase = caseById('bt-002')
  const sloppy = [
    reply([toolCall('c1', 'report_root_cause', { file: 'src/utils/exportCsv.js', reason: 'smoking gun' })]),
    reply([toolCall('c2', 'apply_patch', { path: 'src/utils/exportCsv.js' })]),
    reply([toolCall('c3', 'finish', { verdict: 'bug', summary: 'fixed' })])
  ]
  const trial = await runSuperAgent(agentOpts(kase, replayTransport(sloppy)))
  const failed = gradeTrial(trial, kase, [], null).scores.filter((s) => !s.passed).map((s) => s.grader)
  assert.deepEqual(failed.sort(), ['evidence_artifact', 'read_before_claim', 'tests_pass'])
})

test('max_steps stops a looping agent and still records a valid trial', async () => {
  const kase = caseById('bt-002')
  const looping = Array.from({ length: 10 }, (_, i) => reply([toolCall(`c${i}`, 'grep', { pattern: 'x' })]))
  const trial = await runSuperAgent(agentOpts(kase, replayTransport(looping), { maxSteps: 4 }))
  assert.deepEqual(validate('Trial', trial), [])
  assert.equal(trial.outcome.error, 'max_steps')
  assert.equal(trial.events.filter((e) => e.type === 'tool_call').length, 4)
})

test('runDataset in replay mode captures one schema-valid trial per case from cassettes', async () => {
  const { trials, mode } = await runDataset({ datasetRef: 'bug-triage@v1', runId: 'replay-check', env: {} })
  assert.equal(mode, 'replay')
  assert.equal(trials.length, dataset.cases.length)
  for (const t of trials) assert.deepEqual(validate('Trial', t), [], t.trial_id)
  assert.ok(trials.every((t) => t.variant.name === 'deepseek-super-agent'))
})

test('runDataset explains how to go live when a cassette is missing', async () => {
  await assert.rejects(
    runDataset({ datasetRef: 'bug-triage@v1', runId: 'x', env: {}, cassetteDir: '/nonexistent' }),
    /DEEPSEEK_API_KEY/
  )
})

test('live mode with --record calls the API via fetch and writes a replayable cassette', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cassettes-'))
  const source = JSON.parse(fs.readFileSync(path.join(DEFAULT_CASSETTE_DIR, 'bt-002-a1.json'), 'utf8')).responses
  const queues = {}
  const fetchImpl = async (url, init) => {
    const body = JSON.parse(init.body)
    const key = body.messages[1].content
    queues[key] ??= structuredClone(source)
    assert.equal(init.headers.Authorization, 'Bearer fake-key')
    return { ok: true, status: 200, json: async () => queues[key].shift() ?? reply([toolCall('z', 'finish', { verdict: 'bug', summary: '' })]) }
  }
  const env = { DEEPSEEK_API_KEY: 'fake-key', DEEPSEEK_MODEL: 'deepseek-chat' }
  const live = await runDataset({ datasetRef: 'bug-triage@v1', runId: 'live', env, cassetteDir: tmp, record: true, fetchImpl })
  assert.equal(live.mode, 'live')
  const written = JSON.parse(fs.readFileSync(path.join(tmp, 'bt-002-a1.json'), 'utf8'))
  assert.equal(written.provenance, 'recorded')
  assert.doesNotMatch(JSON.stringify(written), /fake-key/)
  const replayed = await runDataset({ datasetRef: 'bug-triage@v1', runId: 'live', env: {}, cassetteDir: tmp })
  const pick = (r) => r.trials.find((t) => t.case_id === 'bt-002')
  assert.deepEqual(pick(replayed).events, pick(live).events)
  assert.deepEqual(pick(replayed).outcome, pick(live).outcome)
})

test('committed DeepSeek run is reproducible from its cassettes', async () => {
  const runId = '2026-11-20-deepseek-super-agent'
  const { trials } = await runDataset({ datasetRef: 'bug-triage@v1', runId, env: {} })
  assert.deepEqual(loadRun(runId).trials, JSON.parse(JSON.stringify(trials)))
})

test('unknown tools and malformed arguments become tool errors in the trace, not crashes', async () => {
  const kase = caseById('bt-002')
  const weird = [
    reply([{ id: 'c1', type: 'function', function: { name: 'rm_rf', arguments: '{}' } }]),
    reply([{ id: 'c2', type: 'function', function: { name: 'read_file', arguments: '{not json' } }]),
    reply([toolCall('c3', 'finish', { verdict: 'bug', summary: 'gave up' })])
  ]
  const trial = await runSuperAgent(agentOpts(kase, replayTransport(weird)))
  const calls = trial.events.filter((e) => e.type === 'tool_call')
  assert.match(calls[0].result_summary, /unknown tool/)
  assert.match(calls[1].result_summary, /invalid arguments/)
})
