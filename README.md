# Cursor Learning Demo

这是一个用于学习和演示 Cursor 编辑器功能的示例项目，所有功能均由cursor编写。

## 项目功能

- 展示 Cursor 编辑器的基础用法和特性
- 提供常用快捷键和操作指南
- 包含实用的代码示例和最佳实践
- 演示 AI 辅助编程功能

## 文件整理分析

云端环境读不到本机路径 `/Users/liguangxin/Desktop/文稿new/测试`。请在自己电脑上运行：

```bash
python3 scripts/file_organizer.py "/Users/liguangxin/Desktop/文稿new/测试"
python3 scripts/file_organizer.py "/Users/liguangxin/Desktop/文稿new/测试" --apply
```

默认只生成 `_文件分析报告.md` 和整理计划，不会移动文件。加 `--apply` 后，结果写到旁边的 `测试_整理结果`，可用 `--undo` 撤回。网页预览入口：`#/organize`。

## 在线交流群

如果你想加入我们的学习交流群，欢迎扫描下方二维码：

![学习交流群](./public/img/WechatIMG107.jpg)
