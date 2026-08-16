---
name: add-learn-module
description: 给 cursor_learning 加一节新课时。用户说加课、新章节、补学习页时使用。
---

# 加学习课时

## 何时用

- 用户要新增一节课或一个侧栏章节
- 要把文档或计划落成可浏览的学习页

## 步骤

1. 看现有课时（如 `TabCompletion.vue`、`CursorPlugins.vue`）对齐版式：介绍卡、示例、时间线技巧。
2. 新建 `src/components/learn/<PascalName>.vue`。
3. 在 `src/views/learn.vue` 注册：import、`contentMap`、对应 `el-menu-item`。
4. 长清单放到 `src/data/`，组件只负责展示。
5. 用现有 Element Plus 组件，不要加依赖。

## 不要做

- 不要改路由结构（课时都在 `/learn` 里切换）。
- 不要新建测试框架；需要校验就沿用 `scripts/validate-plugin.mjs` 这类脚本。
