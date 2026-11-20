import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { LAKE_ROOT } from './paths.mjs'
import { gradeTrial } from './graders.mjs'
import { assertValid } from './schema.mjs'

export const readJsonl = (file) =>
  fs
    .readFileSync(file, 'utf8')
    .split('\n')
    .filter((line) => line.trim())
    .map((line, i) => {
      try {
        return JSON.parse(line)
      } catch (err) {
        throw new Error(`${file}:${i + 1}: ${err.message}`)
      }
    })

export const writeJsonl = (file, records) => {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, records.map((r) => JSON.stringify(r)).join('\n') + '\n')
}

export const sha256 = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')

export function loadDataset(ref, root = LAKE_ROOT) {
  const [name, version] = ref.split('@')
  const dir = path.join(root, 'datasets', name, version)
  const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'))
  assertValid('DatasetManifest', [manifest], `${ref}/manifest`)
  const casesFile = path.join(dir, 'cases.jsonl')
  const actual = sha256(casesFile)
  if (actual !== manifest.cases_sha256) {
    throw new Error(
      `Dataset ${ref} was modified after publishing (sha256 ${actual} != manifest ${manifest.cases_sha256}). ` +
        'Published versions are immutable: create a new version directory instead.'
    )
  }
  const cases = readJsonl(casesFile)
  assertValid('Case', cases, `${ref}/cases`)
  if (cases.length !== manifest.case_count) {
    throw new Error(`Dataset ${ref}: manifest says ${manifest.case_count} cases, found ${cases.length}`)
  }
  return { ref, manifest, cases }
}

export function listRuns() {
  const dir = path.join(LAKE_ROOT, 'runs')
  return fs
    .readdirSync(dir)
    .filter((d) => fs.existsSync(path.join(dir, d, 'trials.jsonl')))
    .sort()
}

export function loadRun(runId) {
  const dir = path.join(LAKE_ROOT, 'runs', runId)
  const trials = readJsonl(path.join(dir, 'trials.jsonl'))
  assertValid('Trial', trials, `runs/${runId}/trials`)
  const judgeFile = path.join(dir, 'judge.jsonl')
  const judge = fs.existsSync(judgeFile) ? readJsonl(judgeFile) : []
  assertValid('JudgeRecord', judge, `runs/${runId}/judge`)
  const metaFile = path.join(dir, 'run.json')
  const meta = fs.existsSync(metaFile) ? JSON.parse(fs.readFileSync(metaFile, 'utf8')) : {}
  return { runId, trials, judge, meta }
}

export function replayTrial(trialId) {
  const run = listRuns()
    .map(loadRun)
    .find((r) => r.trials.some((t) => t.trial_id === trialId))
  if (!run) throw new Error(`trial ${trialId} not found`)
  const trial = run.trials.find((t) => t.trial_id === trialId)
  const kase = loadDataset(trial.dataset).cases.find((c) => c.case_id === trial.case_id)
  const annotation = loadAnnotations().find((a) => a.trial_id === trialId)
  return { trial, kase, grading: gradeTrial(trial, kase, run.judge, annotation) }
}

export function loadAnnotations() {
  const file = path.join(LAKE_ROOT, 'annotations/human-labels.jsonl')
  if (!fs.existsSync(file)) return []
  const records = readJsonl(file)
  assertValid('Annotation', records, 'annotations')
  return records
}
