# Cursor 插件提效

> 状态：已执行  
> 范围：`cursor_learning` 学习站  
> 目标：把 Cursor 插件（Rules / Skills / Commands / MCP / Hooks）变成可学、可装、可复用的提效能力

## 背景

课程站已覆盖 Tab、Chat、Cmd K、Composer 和 Chrome 插件实战，但缺少 **Cursor 原生插件** 这一块。FDE 日常提效不再只靠编辑器快捷键，而是把规范、技能、命令和 MCP 打成可分发的插件，让 Agent 按同一套约定干活。

仓库里原先没有 `docs/plans/fde/提效/cursor插件`，本文件即该任务的计划与执行记录。

## 目标

1. 在学习站增加「Cursor 插件提效」完整课时，讲清装什么、怎么用、怎么自己做。
2. 提供一份可本地加载的示例插件，覆盖 Rules、Skills、Commands、Agents。
3. 给本仓库加上项目级 Cursor Rules，后续改课时代理少走样。
4. 首页和文档入口能直接进入该课时。

## 非目标

- 不发布到 Cursor Marketplace（示例仅作本地加载与教学）。
- 不引入需要密钥的 MCP 服务。
- 不改 Chrome 插件课时，也不补齐 Chat / Cmd K / Composer 占位页。

## 方案

| 产物 | 路径 | 作用 |
| --- | --- | --- |
| 本计划 | `docs/plans/fde/提效/cursor插件.md` | 任务说明与验收 |
| 示例插件 | `examples/fde-cursor-plugin/` | 可 symlink 到 `~/.cursor/plugins/local` |
| 项目规则 | `.cursor/rules/vue-learning-site.mdc` | 本站 Vue / Element Plus 约定 |
| 课时页 | `src/components/learn/CursorPlugins.vue` | 安装、组件、推荐清单、自建步骤 |
| 推荐数据 | `src/data/pluginCatalog.js` | 插件清单，页面与校验脚本共用 |
| 校验 | `scripts/validate-plugin.mjs` | 检查清单与示例插件结构 |

学习侧栏新增「提效实践 → Cursor 插件提效」。首页增加入口，文档弹窗增加本计划链接。

## 验收

- 侧栏能打开课时，组件卡片、安装步骤、推荐清单、示例目录都在。
- `examples/fde-cursor-plugin/.cursor-plugin/plugin.json` 字段完整，Rules / Skills / Commands / Agents 齐全。
- `node scripts/validate-plugin.mjs` 通过。
- `npm run build` 通过。

## 执行记录

- 已落地上述产物，并接入 `/learn` 与首页入口。
