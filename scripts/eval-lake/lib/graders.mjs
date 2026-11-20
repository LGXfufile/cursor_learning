const get = (obj, dotted) => dotted.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), obj)

const ruleChecks = {
  outcome_equals(trial, grader, kase) {
    const expected = get(kase, grader.value_from)
    const actual = get(trial, grader.path)
    const passed = JSON.stringify(actual) === JSON.stringify(expected)
    return { passed, detail: `${grader.path}=${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}` }
  },

  // Grades from what the agent actually opened, not what it says it did.
  read_before_claim(trial) {
    const claim = trial.events.find((e) => e.type === 'claim')
    if (!claim) return { passed: false, detail: 'no root-cause claim in transcript' }
    const readFirst = trial.events.some(
      (e) => e.type === 'tool_call' && e.tool === 'read_file' && e.args?.path === claim.file && e.seq < claim.seq
    )
    return {
      passed: readFirst,
      detail: readFirst ? `read ${claim.file} before claiming` : `claimed ${claim.file} without reading it first`
    }
  },

  artifact_present(trial, grader) {
    const found = trial.events.filter((e) => e.type === 'artifact' && grader.kinds.includes(e.kind))
    return {
      passed: found.length > 0,
      detail: found.length ? `artifacts: ${found.map((e) => e.kind).join(', ')}` : `none of [${grader.kinds}]`
    }
  },

  max_tool_calls(trial, grader) {
    const n = trial.events.filter((e) => e.type === 'tool_call').length
    return { passed: n <= grader.max, detail: `${n} tool calls (budget ${grader.max})` }
  }
}

export function gradeRule(trial, grader, kase) {
  const fn = ruleChecks[grader.check]
  if (!fn) throw new Error(`Unknown rule check "${grader.check}" in case ${kase.case_id}`)
  const { passed, detail } = fn(trial, grader, kase)
  return { value: passed ? 1 : 0, passed, detail }
}

// Judge verdicts are produced out-of-process (a model from a different family than the
// candidate) and ingested as records, so a re-grade never silently re-samples the judge.
export function gradeJudge(trial, grader, judgeRecords) {
  const record = judgeRecords.find((r) => r.trial_id === trial.trial_id && r.grader === grader.name)
  if (!record) return null
  if (record.criteria.length !== grader.rubric.length) {
    throw new Error(`Judge record for ${trial.trial_id} has ${record.criteria.length} criteria, rubric has ${grader.rubric.length}`)
  }
  const value = record.criteria.reduce((a, b) => a + b, 0) / record.criteria.length
  const threshold = grader.threshold ?? 0.6
  return {
    value: Number(value.toFixed(3)),
    passed: value >= threshold,
    detail: `${record.judge_model}: ${record.rationale}`,
    criteria: record.criteria
  }
}

export function gradeTrial(trial, kase, judgeRecords, annotation) {
  const scores = []
  for (const grader of kase.graders) {
    let result
    if (grader.type === 'rule') result = gradeRule(trial, grader, kase)
    else if (grader.type === 'judge') result = gradeJudge(trial, grader, judgeRecords)
    if (!result) continue
    scores.push({
      score_id: `${trial.trial_id}:${grader.name}`,
      trial_id: trial.trial_id,
      run_id: trial.run_id,
      case_id: trial.case_id,
      grader: grader.name,
      grader_type: grader.type,
      ...result
    })
  }
  if (annotation) {
    scores.push({
      score_id: `${trial.trial_id}:human`,
      trial_id: trial.trial_id,
      run_id: trial.run_id,
      case_id: trial.case_id,
      grader: 'human',
      grader_type: 'human',
      value: annotation.label === 'pass' ? 1 : 0,
      passed: annotation.label === 'pass',
      detail: `${annotation.annotator}: ${annotation.note ?? ''}`.trim()
    })
  }
  const auto = scores.filter((s) => s.grader_type !== 'human')
  const autoPassed = auto.length > 0 && auto.every((s) => s.passed)
  const human = scores.find((s) => s.grader_type === 'human')
  return {
    scores,
    auto_passed: autoPassed,
    passed: human ? human.passed : autoPassed,
    verdict_source: human ? 'human' : 'auto',
    score: Number((auto.reduce((a, s) => a + s.value, 0) / Math.max(auto.length, 1)).toFixed(3))
  }
}
