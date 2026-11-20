# Agent Eval Lake（MVP）

把智能体的运行轨迹、评测用例、评分、人工标注沉淀为开放格式（JSONL + JSON Schema），可重评分、可回放、可做回归门禁。零运行时依赖，Node 22 即可运行。

> 仓库内所有示例数据都是合成数据或 mock 数据：`triage-v1/v2` 的轨迹来自 `seed-sample.mjs`，DeepSeek 运行回放的是手写的 mock cassette（`provenance: "mock"`），均不是真实模型输出。

## 目录

| 路径 | 内容 |
|------|------|
| `schema/eval-lake.schema.json` | Case / Trial / TraceEvent / JudgeRecord / Annotation / Score / DatasetManifest |
| `datasets/<name>/<vN>/` | `cases.jsonl` + `manifest.json`（sha256）。已发布的版本不可修改，改用例就新建 `vN+1` |
| `envs/<name>/<vN>/` | 被测智能体的沙箱环境（包含隐藏的标准答案），与用例分开存放 |
| `runs/<run_id>/` | `trials.jsonl`（轨迹）、`judge.jsonl`（外部 judge 结果）、`run.json`（来源信息） |
| `annotations/human-labels.jsonl` | 人工标注；有标注时以人工判定为准，同时用于校准 judge |
| `cassettes/deepseek-super-agent/` | DeepSeek 响应录制，用于离线回放 |
| `lake/scores/<run_id>.jsonl` | 评分结果（生成） |
| `../public/eval-lake/report.json` | 浏览页数据（生成，页面路由 `#/eval-lake`） |

## 命令

```bash
npm run eval:test                 # 全部测试（TDD 入口）
npm run eval:agent                # 用 DeepSeek super-agent 跑 bug-triage@v1；没有 key 时回放 cassette
npm run eval:run                  # 重新评分全部 run，写 scores 和 report.json
npm run eval:gate                 # 同上；baseline -> candidate 出现回归时 exit 1
npm run eval:replay -- <trial_id> # 打印轨迹并重新评分
npm run eval:seed                 # 重新生成合成示例数据
npm run eval:cassettes            # 重新生成 DeepSeek mock cassette
```

## 接入真实 DeepSeek

适配器走 OpenAI 兼容的 `/chat/completions` 接口，配置只从环境变量读取，代码和仓库里不保存密钥：

| 变量 | 默认值 |
|------|--------|
| `DEEPSEEK_API_KEY` | 未设置时进入回放模式 |
| `DEEPSEEK_BASE_URL` | `https://api.deepseek.com`（可指向任何 OpenAI 兼容网关） |
| `DEEPSEEK_MODEL` | `deepseek-chat` |

```bash
DEEPSEEK_API_KEY=... npm run eval:agent -- --run-id 2026-11-21-deepseek-live --attempts 3 --record
npm run eval:run
```

加 `--record` 会用真实响应覆盖 `cassettes/`（`provenance: "recorded"`），之后 CI 不需要 key 也能复现。注意，覆盖后 `deepseek-agent.test.mjs` 中断言固定 run 可复现的那条测试，需要对新的 run 重新生成并提交。
