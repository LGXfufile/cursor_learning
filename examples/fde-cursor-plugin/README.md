# FDE Cursor 提效插件（示例）

把 Rules、Skills、Commands、Agents 打成一份可本地加载的 Cursor Plugin，配合学习站「Cursor 插件提效」课时使用。

## 本地加载

```bash
ln -s "$(pwd)/examples/fde-cursor-plugin" ~/.cursor/plugins/local/fde-cursor-efficiency
```

然后执行 **Developer: Reload Window**，到侧栏 **Customize** 确认组件已出现。

## 里面有什么

| 组件 | 路径 | 用途 |
| --- | --- | --- |
| Rules | `rules/` | Vue 3 + Element Plus 约定；加课文件清单 |
| Skills | `skills/add-learn-module`、`skills/review-lesson` | 加新课时 / 审课时 |
| Commands | `commands/new-lesson.md` | 按模板开一节新课 |
| Agents | `agents/lesson-writer.md` | 按本站文风写课 |

不包含 MCP，避免教学示例依赖密钥。
