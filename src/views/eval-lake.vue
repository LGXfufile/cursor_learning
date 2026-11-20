<template>
  <div class="eval-lake">
    <header class="lake-header">
      <div>
        <h1>智能体评测湖 · 结果浏览</h1>
        <p v-if="report" class="sub">
          数据集 <code>{{ report.dataset.ref }}</code>
          · {{ report.dataset.cases.length }} 个用例
          · sha256 <code>{{ report.dataset.manifest.cases_sha256.slice(0, 12) }}</code>
          · 示例数据为合成/mock，仅用于演示
        </p>
      </div>
      <el-button @click="$router.push('/')">返回首页</el-button>
    </header>

    <el-alert v-if="error" type="error" :title="error" show-icon :closable="false" />
    <el-skeleton v-else-if="!report" :rows="8" animated />

    <template v-else>
      <el-card class="block" shadow="never">
        <template #header>运行概览（每个 run = 一个被测变体在一个数据集版本上的全部 trial）</template>
        <el-table :data="report.runs" size="small" data-testid="runs-table">
          <el-table-column prop="run_id" label="run" min-width="220" />
          <el-table-column label="被测智能体" min-width="200">
            <template #default="{ row }">
              {{ row.variant.name }}@{{ row.variant.version }}
              <el-tag size="small" type="info">{{ row.variant.model }}</el-tag>
              <el-tag v-if="row.meta.provenance === 'cassette'" size="small" type="warning">回放</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="通过率" width="80"><template #default="{ row }">{{ pct(row.summary.pass_rate) }}</template></el-table-column>
          <el-table-column label="pass@k" width="80"><template #default="{ row }">{{ pct(row.summary.pass_at_k) }}</template></el-table-column>
          <el-table-column label="pass^k" width="80"><template #default="{ row }">{{ pct(row.summary.pass_all_k) }}</template></el-table-column>
          <el-table-column label="holdout" width="80"><template #default="{ row }">{{ pct(row.by_split.holdout?.pass_rate ?? 0) }}</template></el-table-column>
          <el-table-column label="均分" width="70"><template #default="{ row }">{{ row.summary.mean_score }}</template></el-table-column>
          <el-table-column label="judge 覆盖" width="90"><template #default="{ row }">{{ pct(row.summary.judge_coverage) }}</template></el-table-column>
          <el-table-column label="平均 tokens" width="100"><template #default="{ row }">{{ row.summary.mean_tokens }}</template></el-table-column>
          <el-table-column label="平均耗时" width="90"><template #default="{ row }">{{ row.summary.mean_duration_s }}s</template></el-table-column>
        </el-table>
      </el-card>

      <div class="grid">
        <el-card class="block" shadow="never" data-testid="gate-card">
          <template #header>
            回归门禁：{{ report.comparison.baseline }} → {{ report.comparison.candidate }}
          </template>
          <el-tag :type="report.comparison.gate.passed ? 'success' : 'danger'" size="large">
            {{ report.comparison.gate.passed ? 'GATE PASSED' : 'GATE FAILED' }}
          </el-tag>
          <ul class="plain">
            <li v-for="r in report.comparison.gate.reasons" :key="r">{{ r }}</li>
          </ul>
          <p>改进：<el-tag v-for="i in report.comparison.improvements" :key="i.case_id" size="small" type="success" class="gap">{{ i.case_id }}</el-tag></p>
          <p>回归：<el-tag v-for="r in report.comparison.regressions" :key="r.case_id" size="small" type="danger" class="gap">{{ r.case_id }} · {{ r.reason }}</el-tag></p>
        </el-card>

        <el-card class="block" shadow="never">
          <template #header>评委校准（LLM judge vs 人工标注）</template>
          <p>
            一致率 <b>{{ pct(report.calibration.judge_human_agreement) }}</b>（{{ report.calibration.pairs }} 条标注）；
            纯规则 vs 人工 <b>{{ pct(report.calibration.auto_human_agreement) }}</b>
          </p>
          <el-table :data="report.calibration.disagreements" size="small" empty-text="无分歧">
            <el-table-column prop="trial_id" label="分歧 trial" min-width="220" />
            <el-table-column label="judge" width="70"><template #default="{ row }">{{ row.judge_value }}</template></el-table-column>
            <el-table-column prop="note" label="人工意见" min-width="160" />
          </el-table>
        </el-card>
      </div>

      <el-card class="block" shadow="never">
        <template #header>用例矩阵（pass^k；点击单元格回放 trial）</template>
        <el-table :data="report.dataset.cases" size="small" data-testid="case-matrix">
          <el-table-column label="用例" min-width="220">
            <template #default="{ row }">
              <b>{{ row.case_id }}</b> {{ row.title }}
              <el-tag size="small" :type="row.split === 'holdout' ? 'warning' : 'info'">{{ row.split }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column v-for="run in report.runs" :key="run.run_id" :label="run.variant.name + '@' + run.variant.version" min-width="150">
            <template #default="{ row }">
              <template v-if="run.cases[row.case_id]">
                <el-button
                  v-for="tid in run.cases[row.case_id].trial_ids"
                  :key="tid"
                  size="small"
                  :type="trialById[tid].grading.passed ? 'success' : 'danger'"
                  plain
                  @click="open(tid)"
                >
                  a{{ trialById[tid].attempt }}
                </el-button>
              </template>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <el-card class="block" shadow="never">
        <template #header>失败模式（把反复出现的失败变成技能或新用例）</template>
        <div class="grid">
          <div v-for="run in report.runs" :key="run.run_id">
            <h4>{{ run.run_id }}</h4>
            <div v-for="[mode, count] in sortedModes(run)" :key="mode" class="bar-row">
              <span class="bar-label">{{ mode }}</span>
              <span class="bar" :style="{ width: count * 18 + 'px' }"></span>
              <span>{{ count }}</span>
            </div>
            <p v-if="!sortedModes(run).length" class="muted">无失败</p>
          </div>
        </div>
      </el-card>
    </template>

    <el-drawer v-model="drawer" size="55%" :title="current?.trial_id" data-testid="trial-drawer">
      <template v-if="current">
        <p>
          <el-tag :type="current.grading.passed ? 'success' : 'danger'">{{ current.grading.passed ? 'PASS' : 'FAIL' }}</el-tag>
          判定来源：{{ current.grading.verdict_source === 'human' ? '人工标注' : '自动评分' }} · 自动分 {{ current.grading.score }}
          · {{ current.usage.input_tokens + current.usage.output_tokens }} tokens
        </p>
        <el-table :data="current.grading.scores" size="small">
          <el-table-column label="" width="50"><template #default="{ row }">{{ row.passed ? '✓' : '✗' }}</template></el-table-column>
          <el-table-column prop="grader_type" label="类型" width="70" />
          <el-table-column prop="grader" label="评分器" width="160" />
          <el-table-column prop="detail" label="依据" />
        </el-table>
        <h4>轨迹回放</h4>
        <el-timeline>
          <el-timeline-item v-for="e in current.events" :key="e.seq" :type="eventColor(e)" :timestamp="`#${e.seq} ${e.type}`" placement="top">
            <span v-if="e.type === 'tool_call'"><code>{{ e.tool }}({{ JSON.stringify(e.args) }})</code> → {{ e.result_summary }}</span>
            <span v-else-if="e.type === 'artifact'">证据：{{ e.kind }} <code>{{ e.uri }}</code></span>
            <span v-else-if="e.type === 'claim'">根因断言：<code>{{ e.file }}</code> {{ e.content }}</span>
            <span v-else>{{ e.content }}</span>
          </el-timeline-item>
        </el-timeline>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'

const report = ref(null)
const error = ref('')
const drawer = ref(false)
const currentId = ref(null)

const trialById = computed(() => Object.fromEntries((report.value?.trials ?? []).map((t) => [t.trial_id, t])))
const current = computed(() => trialById.value[currentId.value])

const pct = (x) => `${Math.round(x * 100)}%`
const sortedModes = (run) => Object.entries(run.failure_modes).sort((a, b) => b[1] - a[1])
const eventColor = (e) => ({ claim: 'warning', artifact: 'success', user_message: 'primary' })[e.type] ?? ''

const open = (tid) => {
  currentId.value = tid
  drawer.value = true
}

onMounted(async () => {
  try {
    const res = await fetch('./eval-lake/report.json')
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    report.value = await res.json()
  } catch (err) {
    error.value = `加载 report.json 失败：${err.message}（先运行 npm run eval:run）`
  }
})
</script>

<style scoped>
.eval-lake { max-width: 1280px; margin: 0 auto; padding: 24px; }
.lake-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
.lake-header h1 { margin: 0 0 6px; font-size: 26px; }
.sub { color: #606266; margin: 0; }
.block { margin-bottom: 16px; }
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(380px, 1fr)); gap: 16px; }
.plain { padding-left: 18px; color: #f56c6c; }
.gap { margin: 0 6px 6px 0; }
.bar-row { display: flex; align-items: center; gap: 8px; font-size: 13px; margin: 4px 0; }
.bar-label { width: 220px; color: #606266; }
.bar { display: inline-block; height: 10px; background: #f56c6c; border-radius: 4px; }
.muted { color: #909399; }
</style>
