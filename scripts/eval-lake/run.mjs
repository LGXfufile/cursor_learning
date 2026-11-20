import fs from 'node:fs'
import path from 'node:path'
import { parseArgs } from 'node:util'
import { LAKE_ROOT, REPORT_PATH, REPO_ROOT } from './lib/paths.mjs'
import { listRuns, loadAnnotations, loadDataset, loadRun, writeJsonl } from './lib/lake.mjs'
import { assertValid } from './lib/schema.mjs'
import { buildReport } from './lib/report.mjs'

const { values } = parseArgs({
  options: {
    dataset: { type: 'string', default: 'bug-triage@v1' },
    baseline: { type: 'string' },
    candidate: { type: 'string' },
    gate: { type: 'boolean', default: false }
  }
})

const dataset = loadDataset(values.dataset)
const runs = listRuns()
  .map(loadRun)
  .filter((r) => r.trials.some((t) => t.dataset === dataset.ref))
if (!runs.length) throw new Error(`No runs found for ${dataset.ref}`)

const baselineId = values.baseline ?? runs[0].runId
const candidateId = values.candidate ?? runs[runs.length - 1].runId
for (const id of [baselineId, candidateId]) {
  if (!runs.some((r) => r.runId === id)) throw new Error(`Run ${id} not found for ${dataset.ref}`)
}

const report = buildReport({ dataset, runs, annotations: loadAnnotations(), baselineId, candidateId })

for (const run of report.runs) {
  const scores = report.trials
    .filter((t) => t.run_id === run.run_id)
    .flatMap((t) => t.grading.scores.map(({ criteria, ...s }) => s))
  assertValid('Score', scores, `scores/${run.run_id}`)
  writeJsonl(path.join(LAKE_ROOT, 'lake/scores', `${run.run_id}.jsonl`), scores)
}

fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true })
fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2) + '\n')

const pct = (x) => `${(x * 100).toFixed(0)}%`
console.log(`dataset ${dataset.ref} (${dataset.cases.length} cases)`)
console.table(
  Object.fromEntries(
    report.runs.map((r) => [
      r.run_id,
      {
        pass_rate: pct(r.summary.pass_rate),
        'pass@k': pct(r.summary.pass_at_k),
        'pass^k': pct(r.summary.pass_all_k),
        holdout: pct(r.by_split.holdout?.pass_rate ?? 0),
        score: r.summary.mean_score,
        tokens: r.summary.mean_tokens,
        cost: r.summary.mean_cost_usd
      }
    ])
  )
)
const { comparison: cmp, calibration: cal } = report
console.log(`compare ${cmp.baseline} -> ${cmp.candidate}`)
console.log(`  improvements: ${cmp.improvements.map((i) => i.case_id).join(', ') || '-'}`)
console.log(`  regressions:  ${cmp.regressions.map((r) => `${r.case_id} (${r.reason})`).join('; ') || '-'}`)
console.log(`judge/human agreement ${pct(cal.judge_human_agreement)} over ${cal.pairs} labels; disagreements: ${cal.disagreements.map((d) => d.trial_id).join(', ') || '-'}`)
console.log(`report -> ${path.relative(REPO_ROOT, REPORT_PATH)}`)

if (values.gate) {
  if (cmp.gate.passed) console.log('GATE PASSED')
  else {
    console.error(`GATE FAILED: ${cmp.gate.reasons.join('; ')}`)
    process.exitCode = 1
  }
}
