export const pluginComponents = [
  {
    key: 'rules',
    title: 'Rules',
    summary: '长期有效的编码约定，Agent 写代码时自动带上。',
    useWhen: '团队规范、目录约定、禁止事项'
  },
  {
    key: 'skills',
    title: 'Skills',
    summary: '专项能力。Agent 判断该用，或你在对话里 /skill-name 手动点。',
    useWhen: '加课、审课、发版这类重复流程'
  },
  {
    key: 'commands',
    title: 'Commands',
    summary: '可执行的短指令，适合一句话就能启动的动作。',
    useWhen: '开新课时、跑检查、生成提交说明'
  },
  {
    key: 'agents',
    title: 'Agents',
    summary: '带固定人设的代理，适合评审、写作等角色分工。',
    useWhen: '课时作者、安全评审、发布检查'
  },
  {
    key: 'mcp',
    title: 'MCP',
    summary: '把外部系统接到 Agent：文档、工单、设计稿、仓库。',
    useWhen: '要读 Jira / Figma / GitHub，而不是只改本地文件'
  },
  {
    key: 'hooks',
    title: 'Hooks',
    summary: '在编辑、跑命令、打开仓库时自动跑脚本。',
    useWhen: '格式化、拦截危险命令、工作区打开时加载插件'
  }
]

export const recommendedPlugins = [
  {
    name: 'Vue - Official',
    kind: '编辑器扩展',
    category: '前端',
    why: '单文件组件高亮、跳转、模板诊断，写课时组件少踩语法坑。',
    install: '扩展市场搜 Vue - Official'
  },
  {
    name: 'ESLint',
    kind: '编辑器扩展',
    category: '前端',
    why: '保存时标出未用变量和常见 Vue 问题，Agent 改完能立刻看到红线。',
    install: '扩展市场搜 ESLint'
  },
  {
    name: 'Error Lens',
    kind: '编辑器扩展',
    category: '阅读',
    why: '诊断直接写在行尾，不用开 Problems 面板。',
    install: '扩展市场搜 Error Lens'
  },
  {
    name: 'GitLens',
    kind: '编辑器扩展',
    category: 'Git',
    why: '行内 blame 和文件历史，少开一个 IDE 只为看提交。',
    install: '扩展市场搜 GitLens'
  },
  {
    name: 'Git Graph',
    kind: '编辑器扩展',
    category: 'Git',
    why: '分支关系一眼能看完，适合对照 PR 和发布分支。',
    install: '扩展市场搜 Git Graph'
  },
  {
    name: 'Pretty TypeScript Errors',
    kind: '编辑器扩展',
    category: '阅读',
    why: '把挤成一团的 TS 报错拆成人话。',
    install: '扩展市场搜 Pretty TypeScript Errors'
  },
  {
    name: 'Path Intellisense',
    kind: '编辑器扩展',
    category: '编辑',
    why: '补全相对路径，import 课时组件时少打错文件名。',
    install: '扩展市场搜 Path Intellisense'
  },
  {
    name: 'EditorConfig',
    kind: '编辑器扩展',
    category: '编辑',
    why: '缩进和换行跟仓库一致，减少无意义 diff。',
    install: '扩展市场搜 EditorConfig'
  },
  {
    name: 'Cursor Marketplace 官方插件',
    kind: 'Cursor 插件',
    category: 'Agent',
    why: '官方审核过的 Rules / Skills / MCP 组合，从 Customize 安装即可。',
    install: '侧栏 Customize，或打开 cursor.com/marketplace'
  },
  {
    name: '本仓库 fde-cursor-efficiency',
    kind: 'Cursor 插件',
    category: 'Agent',
    why: '演示 Rules + Skills + Commands + Agents，专门服务这个学习站。',
    install: '把 examples/fde-cursor-plugin 链到 ~/.cursor/plugins/local'
  }
]

export const installSteps = [
  {
    title: '打开 Customize',
    content: '在 Cursor 左侧栏点 Customize。这里集中管理插件、MCP、Rules、Skills。'
  },
  {
    title: '从 Marketplace 安装',
    content: '搜索官方插件，选项目级或用户级 Install。团队版还可以看到 Team Marketplace。'
  },
  {
    title: '装编辑器扩展',
    content: 'Cmd/Ctrl + Shift + X 打开扩展市场，装 Vue、ESLint、GitLens 这类 VS Code 兼容扩展。'
  },
  {
    title: '加载本地教学插件',
    content: '开发中的插件放到 ~/.cursor/plugins/local，Reload Window 后在 Customize 里确认组件已出现。'
  }
]

export const localPluginTree = `examples/fde-cursor-plugin/
├── .cursor-plugin/plugin.json
├── agents/lesson-writer.md
├── commands/new-lesson.md
├── rules/vue-element-plus.mdc
├── rules/learn-module.mdc
├── skills/add-learn-module/SKILL.md
├── skills/review-lesson/SKILL.md
└── README.md`

export const localInstallCommand = `ln -s "$(pwd)/examples/fde-cursor-plugin" ~/.cursor/plugins/local/fde-cursor-efficiency`

export const officialDocs = [
  { title: 'Plugins 总览', url: 'https://cursor.com/docs/plugins' },
  { title: 'Plugins 参考', url: 'https://cursor.com/docs/reference/plugins' },
  { title: 'Marketplace', url: 'https://cursor.com/marketplace' },
  { title: 'Rules', url: 'https://cursor.com/docs/rules' },
  { title: 'Skills', url: 'https://cursor.com/docs/skills' }
]
