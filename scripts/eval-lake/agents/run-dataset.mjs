import fs from 'node:fs'
import path from 'node:path'
import { loadDataset } from '../lib/lake.mjs'
import { LAKE_ROOT } from '../lib/paths.mjs'
import { httpTransport, loadDeepSeekConfig, recordingTransport, replayTransport } from './deepseek.mjs'
import { loadEnv } from './sandbox.mjs'
import { runSuperAgent } from './super-agent.mjs'

export const DEFAULT_CASSETTE_DIR = path.join(LAKE_ROOT, 'cassettes/deepseek-super-agent')

// runSuperAgent reads the clock before and after each model call; replay feeds it the
// recorded latencies so durations are reproducible.
function latencyClock(latencies) {
  let t = 0
  let calls = 0
  let i = 0
  return () => {
    if (calls++ % 2 === 1) t += latencies[i++] ?? 0
    return t
  }
}

export async function runDataset({
  datasetRef,
  runId,
  attempts = 1,
  env = process.env,
  cassetteDir = DEFAULT_CASSETTE_DIR,
  record = false,
  fetchImpl
}) {
  const cfg = loadDeepSeekConfig(env)
  const dataset = loadDataset(datasetRef)
  const trials = []

  for (const kase of dataset.cases) {
    for (let attempt = 1; attempt <= attempts; attempt++) {
      const cassetteFile = path.join(cassetteDir, `${kase.case_id}-a${attempt}.json`)
      let transport
      let clock = Date.now
      let model = cfg.model
      const recorded = []
      const latencies = []

      if (cfg.mode === 'live') {
        const live = httpTransport({ ...cfg, fetchImpl })
        const timed = async (req) => {
          const t0 = Date.now()
          const res = await live(req)
          latencies.push(Date.now() - t0)
          return res
        }
        transport = record ? recordingTransport(timed, recorded) : timed
      } else {
        if (!fs.existsSync(cassetteFile)) {
          throw new Error(
            `No cassette at ${cassetteFile}. Set DEEPSEEK_API_KEY to run DeepSeek live (add --record to save a cassette).`
          )
        }
        const cassette = JSON.parse(fs.readFileSync(cassetteFile, 'utf8'))
        transport = replayTransport(cassette.responses)
        clock = latencyClock(cassette.latency_ms ?? [])
        model = cassette.model
      }

      const trial = await runSuperAgent({
        kase,
        env: loadEnv(dataset.ref, kase.case_id),
        transport,
        runId,
        attempt,
        clock,
        variant: { name: 'deepseek-super-agent', version: 'v0', model, harness: 'eval-lake-super-agent' }
      })
      trials.push(trial)

      if (cfg.mode === 'live' && record) {
        fs.mkdirSync(cassetteDir, { recursive: true })
        fs.writeFileSync(
          cassetteFile,
          JSON.stringify(
            { provenance: 'recorded', model, recorded_at: new Date().toISOString(), latency_ms: latencies, responses: recorded },
            null,
            2
          ) + '\n'
        )
      }
    }
  }
  return { mode: cfg.mode, trials }
}
