import fs from 'node:fs'
import path from 'node:path'
import { parseArgs } from 'node:util'
import { runDataset } from './agents/run-dataset.mjs'
import { writeJsonl } from './lib/lake.mjs'
import { LAKE_ROOT } from './lib/paths.mjs'
import { assertValid } from './lib/schema.mjs'

const { values } = parseArgs({
  options: {
    dataset: { type: 'string', default: 'bug-triage@v1' },
    'run-id': { type: 'string', default: '2026-11-20-deepseek-super-agent' },
    attempts: { type: 'string', default: '1' },
    record: { type: 'boolean', default: false }
  }
})

const runId = values['run-id']
const { mode, trials } = await runDataset({
  datasetRef: values.dataset,
  runId,
  attempts: Number(values.attempts),
  record: values.record
})
assertValid('Trial', trials, `runs/${runId}/trials`)

const dir = path.join(LAKE_ROOT, 'runs', runId)
writeJsonl(path.join(dir, 'trials.jsonl'), trials)
fs.writeFileSync(
  path.join(dir, 'run.json'),
  JSON.stringify({ run_id: runId, agent: 'deepseek-super-agent', mode, provenance: mode === 'live' ? 'live' : 'cassette' }, null, 2) + '\n'
)
console.log(`${mode === 'live' ? 'LIVE DeepSeek' : 'REPLAY (no DEEPSEEK_API_KEY, using cassettes)'}: ${trials.length} trials -> ${path.relative(process.cwd(), dir)}`)
console.log('next: npm run eval:run')
