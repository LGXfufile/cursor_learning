import { gradeTrial } from './graders.mjs'

const round = (n, d = 3) => Number(n.toFixed(d))
const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0)

function summarize(graded) {
  const byCase = new Map()
  for (const t of graded) {
    if (!byCase.has(t.case_id)) byCase.set(t.case_id, [])
    byCase.get(t.case_id).push(t)
  }
  const caseStats = [...byCase.values()].map((ts) => ({
    any: ts.some((t) => t.grading.passed),
    all: ts.every((t) => t.grading.passed)
  }))
  return {
    trials: graded.length,
    cases: byCase.size,
    pass_rate: round(mean(graded.map((t) => (t.grading.passed ? 1 : 0)))),
    pass_at_k: round(mean(caseStats.map((c) => (c.any ? 1 : 0)))),
    pass_all_k: round(mean(caseStats.map((c) => (c.all ? 1 : 0)))),
    mean_score: round(mean(graded.map((t) => t.grading.score))),
    judge_coverage: round(mean(graded.map((t) => (t.grading.scores.some((s) => s.grader_type === 'judge') ? 1 : 0)))),
    mean_tokens: Math.round(mean(graded.map((t) => t.usage.input_tokens + t.usage.output_tokens))),
    mean_cost_usd: round(mean(graded.map((t) => t.usage.cost_usd ?? 0)), 4),
    mean_duration_s: round(mean(graded.map((t) => t.usage.duration_ms / 1000)), 1)
  }
}

function caseResult(trials) {
  return {
    trial_ids: trials.map((t) => t.trial_id),
    pass_at_k: trials.some((t) => t.grading.passed),
    pass_all_k: trials.length > 0 && trials.every((t) => t.grading.passed),
    mean_score: round(mean(trials.map((t) => t.grading.score)))
  }
}

export function compareRuns(cases, baseline, candidate, { maxScoreDrop = 0.15 } = {}) {
  const regressions = []
  const improvements = []
  for (const kase of cases) {
    const b = baseline.cases[kase.case_id]
    const c = candidate.cases[kase.case_id]
    if (!b || !c) continue
    const drop = b.mean_score - c.mean_score
    if (b.pass_all_k && !c.pass_all_k) {
      regressions.push({ case_id: kase.case_id, split: kase.split, reason: 'pass^k 由通过变为失败（不稳定或退化）' })
    } else if (drop > maxScoreDrop) {
      regressions.push({ case_id: kase.case_id, split: kase.split, reason: `平均分下降 ${round(drop)}` })
    } else if (!b.pass_all_k && c.pass_all_k) {
      improvements.push({ case_id: kase.case_id, split: kase.split })
    }
  }
  const reasons = []
  if (regressions.length) reasons.push(`${regressions.length} 个用例回归：${regressions.map((r) => r.case_id).join(', ')}`)
  const bh = baseline.by_split.holdout
  const ch = candidate.by_split.holdout
  if (bh && ch && ch.pass_rate < bh.pass_rate) {
    reasons.push(`holdout 通过率下降 ${bh.pass_rate} → ${ch.pass_rate}`)
  }
  return {
    baseline: baseline.run_id,
    candidate: candidate.run_id,
    regressions,
    improvements,
    gate: { passed: reasons.length === 0, reasons }
  }
}

export function calibrate(gradedTrials, annotations) {
  const pairs = []
  for (const a of annotations) {
    const t = gradedTrials.find((x) => x.trial_id === a.trial_id)
    const judge = t?.grading.scores.find((s) => s.grader_type === 'judge')
    if (!judge) continue
    pairs.push({
      trial_id: a.trial_id,
      judge_passed: judge.passed,
      judge_value: judge.value,
      auto_passed: t.grading.auto_passed,
      human_passed: a.label === 'pass',
      note: a.note ?? ''
    })
  }
  const agree = (key) => round(mean(pairs.map((p) => (p[key] === p.human_passed ? 1 : 0))))
  return {
    pairs: pairs.length,
    judge_human_agreement: agree('judge_passed'),
    auto_human_agreement: agree('auto_passed'),
    disagreements: pairs.filter((p) => p.judge_passed !== p.human_passed)
  }
}

export function buildReport({ dataset, runs, annotations, baselineId, candidateId }) {
  const caseById = Object.fromEntries(dataset.cases.map((c) => [c.case_id, c]))
  const annotationByTrial = Object.fromEntries(annotations.map((a) => [a.trial_id, a]))
  const allTrials = []
  const runSummaries = []

  for (const run of runs) {
    const graded = run.trials.map((trial) => {
      if (trial.dataset !== dataset.ref) {
        throw new Error(`${trial.trial_id} targets ${trial.dataset}, report is for ${dataset.ref}`)
      }
      const kase = caseById[trial.case_id]
      if (!kase) throw new Error(`${trial.trial_id}: unknown case ${trial.case_id}`)
      return { ...trial, grading: gradeTrial(trial, kase, run.judge, annotationByTrial[trial.trial_id]) }
    })
    allTrials.push(...graded)

    const failureModes = {}
    for (const t of graded) {
      for (const s of t.grading.scores) {
        if (!s.passed && s.grader_type !== 'human') failureModes[s.grader] = (failureModes[s.grader] ?? 0) + 1
      }
      for (const tag of annotationByTrial[t.trial_id]?.failure_tags ?? []) {
        failureModes[`human:${tag}`] = (failureModes[`human:${tag}`] ?? 0) + 1
      }
    }

    const bySplit = {}
    for (const split of ['dev', 'holdout']) {
      const subset = graded.filter((t) => caseById[t.case_id].split === split)
      if (subset.length) bySplit[split] = summarize(subset)
    }
    const cases = {}
    for (const kase of dataset.cases) {
      const ts = graded.filter((t) => t.case_id === kase.case_id)
      if (ts.length) cases[kase.case_id] = caseResult(ts)
    }
    runSummaries.push({
      run_id: run.runId,
      meta: run.meta ?? {},
      variant: graded[0]?.variant,
      summary: summarize(graded),
      by_split: bySplit,
      failure_modes: failureModes,
      cases
    })
  }

  const find = (id) => runSummaries.find((r) => r.run_id === id)
  const comparison =
    baselineId && candidateId ? compareRuns(dataset.cases, find(baselineId), find(candidateId)) : null

  return {
    dataset: {
      ref: dataset.ref,
      manifest: dataset.manifest,
      cases: dataset.cases.map((c) => ({
        case_id: c.case_id,
        title: c.title,
        split: c.split,
        tags: c.tags,
        source: c.source,
        prompt: c.input.prompt,
        graders: c.graders.map(({ name, type, rubric }) => ({ name, type, rubric }))
      }))
    },
    runs: runSummaries,
    comparison,
    calibration: calibrate(allTrials, annotations),
    trials: allTrials
  }
}
