import { TOOL_SPECS, createSandbox } from './sandbox.mjs'

// Candidate-facing text must read like ordinary work: an agent that can tell it is being
// measured behaves differently (see the blinding test).
const SYSTEM_PROMPT = [
  '你是一名资深工程师，正在帮同事处理一条用户反馈。',
  '工作方式：先用 run_app 复现；在下结论之前必须用 read_file 打开相关源码；',
  '用 report_root_cause 记录根因；做最小修改并运行项目测试；',
  '用 attach_artifact 附上可复核的证据（截图、视频、测试日志或堆快照）。',
  '如果确认是预期行为，解释原因、不要改代码，并以 verdict=not_a_bug 结束。',
  '完成后调用 finish。'
].join('\n')

export function buildPrompts(kase) {
  return { system: SYSTEM_PROMPT, user: kase.input.prompt }
}

const parseArgs = (raw) => {
  if (raw && typeof raw === 'object') return raw
  return JSON.parse(raw || '{}')
}

export async function runSuperAgent({ kase, env, transport, runId, attempt, variant, maxSteps = 16, clock = Date.now }) {
  const { system, user } = buildPrompts(kase)
  const sandbox = createSandbox(env)
  const messages = [
    { role: 'system', content: system },
    { role: 'user', content: user }
  ]
  const events = [{ type: 'user_message', content: user }]
  const usage = { input_tokens: 0, output_tokens: 0, duration_ms: 0 }
  let finished = false
  let steps = 0

  while (!finished && steps < maxSteps) {
    steps++
    const t0 = clock()
    const response = await transport({ messages, tools: TOOL_SPECS })
    usage.duration_ms += clock() - t0
    usage.input_tokens += response.usage?.prompt_tokens ?? 0
    usage.output_tokens += response.usage?.completion_tokens ?? 0

    const message = response.choices[0].message
    if (message.reasoning_content) events.push({ type: 'thinking', content: message.reasoning_content })
    // DeepSeek rejects reasoning_content when it is sent back in the history.
    const { reasoning_content, ...historyMessage } = message
    messages.push(historyMessage)

    const toolCalls = message.tool_calls ?? []
    if (message.content) events.push({ type: 'assistant_message', content: message.content })
    if (!toolCalls.length) {
      finished = true
      break
    }

    for (const call of toolCalls) {
      const name = call.function?.name
      let args = {}
      let result
      try {
        args = parseArgs(call.function?.arguments)
        result = sandbox.has(name) ? sandbox.call(name, args) : { error: `unknown tool: ${name}` }
      } catch (err) {
        result = { error: `invalid arguments: ${err.message}` }
      }
      events.push({ type: 'tool_call', tool: name, args, result_summary: JSON.stringify(result).slice(0, 200) })
      if (!result.error) {
        if (name === 'report_root_cause') events.push({ type: 'claim', file: args.file, content: args.reason ?? '' })
        if (name === 'attach_artifact') events.push({ type: 'artifact', kind: args.kind, uri: result.uri })
        if (name === 'finish') {
          events.push({ type: 'assistant_message', content: args.summary ?? '' })
          finished = true
        }
      }
      messages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify(result) })
    }
  }

  const state = sandbox.state()
  const outcome = {
    verdict: state.verdict,
    tests_pass: state.tests_pass,
    root_cause_file: state.root_cause_file,
    diff_files: state.diff_files
  }
  if (!finished) outcome.error = 'max_steps'

  return {
    trial_id: `${runId}/${kase.case_id}/a${attempt}`,
    run_id: runId,
    case_id: kase.case_id,
    dataset: `${env.dataset}`,
    variant,
    attempt,
    events: events.map((e, seq) => ({ seq, ...e })),
    outcome,
    usage
  }
}
