// DeepSeek speaks the OpenAI chat.completions protocol, so any OpenAI-compatible gateway
// can be swapped in through DEEPSEEK_BASE_URL.
export function loadDeepSeekConfig(env = process.env) {
  const apiKey = env.DEEPSEEK_API_KEY || undefined
  return {
    mode: apiKey ? 'live' : 'replay',
    apiKey,
    baseUrl: (env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com').replace(/\/+$/, ''),
    model: env.DEEPSEEK_MODEL || 'deepseek-chat'
  }
}

export function httpTransport({ apiKey, baseUrl, model, fetchImpl = globalThis.fetch, temperature = 0 }) {
  return async ({ messages, tools }) => {
    const res = await fetchImpl(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, messages, tools, temperature })
    })
    if (!res.ok) {
      const text = (await res.text().catch(() => '')).split(apiKey).join('[REDACTED]')
      throw new Error(`DeepSeek request failed: HTTP ${res.status} ${text.slice(0, 200)}`)
    }
    return res.json()
  }
}

export function replayTransport(responses) {
  let i = 0
  return async () => {
    if (i >= responses.length) throw new Error(`cassette exhausted after ${responses.length} responses`)
    return structuredClone(responses[i++])
  }
}

export function recordingTransport(inner, sink) {
  return async (request) => {
    const response = await inner(request)
    sink.push(structuredClone(response))
    return response
  }
}
