import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { gradeJudge, gradeRule, gradeTrial } from './lib/graders.mjs'
import { listRuns, loadAnnotations, loadDataset, loadRun, replayTrial } from './lib/lake.mjs'
import { LAKE_ROOT } from './lib/paths.mjs'
import { buildReport, compareRuns } from './lib/report.mjs'
import { validate } from './lib/schema.mjs'

const trial = (events, extra = {}) => ({
  trial_id: 't1',
  run_id: 'r1',
  case_id: 'bt-001',
  events: events.map((e, seq) => ({ seq, ...e })),
  outcome: {},
  ...extra
})

test('read_before_claim fails when the claimed file was never opened', () => {
  const t = trial([{ type: 'claim', file: 'a.js' }, { type: 'tool_call', tool: 'read_file', args: { path: 'a.js' } }])
  assert.equal(gradeRule(t, { check: 'read_before_claim' }, {}).passed, false)
})

test('read_before_claim passes when the file was read before the claim', () => {
  const t = trial([{ type: 'tool_call', tool: 'read_file', args: { path: 'a.js' } }, { type: 'claim', file: 'a.js' }])
  assert.equal(gradeRule(t, { check: 'read_before_claim' }, {}).passed, true)
})

test('max_tool_calls and artifact_present', () => {
  const t = trial([
    { type: 'tool_call', tool: 'grep' },
    { type: 'tool_call', tool: 'grep' },
    { type: 'artifact', kind: 'video' }
  ])
  assert.equal(gradeRule(t, { check: 'max_tool_calls', max: 1 }, {}).passed, false)
  assert.equal(gradeRule(t, { check: 'max_tool_calls', max: 2 }, {}).passed, true)
  assert.equal(gradeRule(t, { check: 'artifact_present', kinds: ['screenshot'] }, {}).passed, false)
  assert.equal(gradeRule(t, { check: 'artifact_present', kinds: ['video'] }, {}).passed, true)
})

test('outcome_equals compares against the case expectation', () => {
  const t = trial([], { outcome: { diff_files: [] } })
  const g = { check: 'outcome_equals', path: 'outcome.diff_files', value_from: 'expected.diff_files' }
  assert.equal(gradeRule(t, g, { expected: { diff_files: [] } }).passed, true)
  assert.equal(gradeRule(t, g, { expected: { diff_files: ['x'] } }).passed, false)
})

test('judge records must match the rubric length', () => {
  const g = { name: 'j', rubric: ['a', 'b', 'c'] }
  const rec = { trial_id: 't1', grader: 'j', judge_model: 'm', criteria: [1, 1], rationale: '' }
  assert.throws(() => gradeJudge(trial([]), g, [rec]), /criteria/)
  assert.equal(gradeJudge(trial([]), g, []), null)
})

test('human label overrides the automatic verdict', () => {
  const kase = { case_id: 'bt-001', graders: [{ name: 'budget', type: 'rule', check: 'max_tool_calls', max: 5 }] }
  const g = gradeTrial(trial([]), kase, [], { label: 'fail', annotator: 'h' })
  assert.equal(g.auto_passed, true)
  assert.equal(g.passed, false)
  assert.equal(g.verdict_source, 'human')
})

test('schema validation rejects malformed trials', () => {
  const errors = validate('Trial', { trial_id: 'x', events: [{ seq: -1, type: 'bogus' }] })
  assert.ok(errors.some((e) => e.includes('missing "run_id"')))
  assert.ok(errors.some((e) => e.includes('not in enum')))
})

test('published dataset versions are immutable (hash check)', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'lake-'))
  const src = path.join(LAKE_ROOT, 'datasets/bug-triage/v1')
  const dst = path.join(tmp, 'datasets/bug-triage/v1')
  fs.mkdirSync(dst, { recursive: true })
  for (const f of fs.readdirSync(src)) fs.copyFileSync(path.join(src, f), path.join(dst, f))
  assert.equal(loadDataset('bug-triage@v1', tmp).cases.length, 6)
  fs.appendFileSync(path.join(dst, 'cases.jsonl'), ' ')
  assert.throws(() => loadDataset('bug-triage@v1', tmp), /immutable/)
})

test('compareRuns flags pass^k regressions and fails the gate', () => {
  const cases = [{ case_id: 'c1', split: 'dev' }, { case_id: 'c2', split: 'dev' }]
  const run = (id, c1, c2) => ({
    run_id: id,
    by_split: {},
    cases: {
      c1: { pass_all_k: c1, mean_score: c1 ? 1 : 0.5 },
      c2: { pass_all_k: c2, mean_score: c2 ? 1 : 0.5 }
    }
  })
  const cmp = compareRuns(cases, run('a', true, false), run('b', false, true))
  assert.deepEqual(cmp.regressions.map((r) => r.case_id), ['c1'])
  assert.deepEqual(cmp.improvements.map((r) => r.case_id), ['c2'])
  assert.equal(cmp.gate.passed, false)
})

test('sample lake: candidate improves holdout but regresses bt-004; judge disagreements surface', () => {
  const dataset = loadDataset('bug-triage@v1')
  const runs = listRuns().map(loadRun)
  const report = buildReport({
    dataset,
    runs,
    annotations: loadAnnotations(),
    baselineId: '2026-11-18-triage-v1',
    candidateId: '2026-11-20-triage-v2'
  })
  const [v1, v2] = report.runs
  assert.ok(v2.by_split.holdout.pass_rate > v1.by_split.holdout.pass_rate)
  assert.deepEqual(report.comparison.regressions.map((r) => r.case_id), ['bt-004'])
  assert.equal(report.comparison.gate.passed, false)
  assert.ok(report.calibration.disagreements.some((d) => d.trial_id === '2026-11-18-triage-v1/bt-001/a1'))
})

test('replayTrial re-grades a stored trial deterministically', () => {
  const id = '2026-11-18-triage-v1/bt-001/a1'
  const a = replayTrial(id)
  const b = replayTrial(id)
  assert.equal(a.trial.trial_id, id)
  assert.equal(a.kase.case_id, 'bt-001')
  assert.deepEqual(a.grading, b.grading)
  assert.equal(a.grading.passed, false)
  assert.equal(a.grading.verdict_source, 'human')
  assert.throws(() => replayTrial('nope/bt-001/a1'), /not found/)
})

test('summary distinguishes pass@k (any attempt) from pass^k (every attempt)', () => {
  const dataset = loadDataset('bug-triage@v1')
  const report = buildReport({ dataset, runs: [loadRun('2026-11-18-triage-v1')], annotations: loadAnnotations() })
  const s = report.runs[0].summary
  assert.equal(s.trials, 12)
  assert.equal(s.pass_rate, 0.5)
  assert.equal(s.pass_at_k, 0.667)
  assert.equal(s.pass_all_k, 0.333)
  assert.equal(report.runs[0].by_split.holdout.pass_rate, 0.167)
})

test('summary reports judge coverage so un-judged runs are visible', () => {
  const dataset = loadDataset('bug-triage@v1')
  const run = loadRun('2026-11-18-triage-v1')
  const unjudged = { ...run, runId: 'unjudged', judge: [] }
  const report = buildReport({ dataset, runs: [run, unjudged], annotations: [] })
  assert.equal(report.runs[0].summary.judge_coverage, 1)
  assert.equal(report.runs[1].summary.judge_coverage, 0)
})

test('committed report is up to date with the lake', () => {
  const committed = JSON.parse(fs.readFileSync(path.join(LAKE_ROOT, '../public/eval-lake/report.json'), 'utf8'))
  const fresh = buildReport({
    dataset: loadDataset('bug-triage@v1'),
    runs: listRuns().map(loadRun),
    annotations: loadAnnotations(),
    baselineId: committed.comparison.baseline,
    candidateId: committed.comparison.candidate
  })
  assert.deepEqual(committed, JSON.parse(JSON.stringify(fresh)), 'run `npm run eval:run` to refresh public/eval-lake/report.json')
})
