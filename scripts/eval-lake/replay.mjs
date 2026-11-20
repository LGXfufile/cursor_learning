// Replays a stored trial: prints its transcript timeline and re-grades it against the
// current dataset version. Re-executing the agent itself is run-agent.mjs's job.
import { replayTrial } from './lib/lake.mjs'

const trialId = process.argv[2]
if (!trialId) {
  console.error('usage: npm run eval:replay -- <trial_id>')
  process.exit(2)
}

const { trial, kase, grading } = replayTrial(trialId)

console.log(`${trial.trial_id}  [${trial.variant.name}@${trial.variant.version} / ${trial.variant.model}]`)
console.log(`case ${kase.case_id}: ${kase.title}\n`)
for (const e of trial.events) {
  const body =
    e.type === 'tool_call'
      ? `${e.tool}(${JSON.stringify(e.args)}) -> ${e.result_summary ?? ''}`
      : e.type === 'artifact'
        ? `${e.kind} ${e.uri}`
        : e.content
  console.log(`${String(e.seq).padStart(3)}  ${e.type.padEnd(17)} ${body}`)
}

console.log(`\nverdict: ${grading.passed ? 'PASS' : 'FAIL'} (source: ${grading.verdict_source}, auto score ${grading.score})`)
for (const s of grading.scores) {
  console.log(`  ${s.passed ? 'ok  ' : 'FAIL'} ${s.grader_type.padEnd(5)} ${s.grader.padEnd(20)} ${s.detail}`)
}
