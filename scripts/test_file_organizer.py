#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""file_organizer.py 的本地测试。"""

from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from file_organizer import (
    REPORT_NAME,
    analyze,
    apply_plans,
    build_plan,
    classify,
    human_size,
    main,
)


class ClassifyTests(unittest.TestCase):
    def test_known_extensions(self) -> None:
        self.assertEqual(classify(".PDF"), "01-文档")
        self.assertEqual(classify(".xlsx"), "02-表格")
        self.assertEqual(classify(".pptx"), "03-演示")
        self.assertEqual(classify(".HEIC"), "04-图片")
        self.assertEqual(classify(".mp4"), "05-音视频")
        self.assertEqual(classify(".zip"), "06-压缩包")
        self.assertEqual(classify(".py"), "07-代码与数据")

    def test_unknown_extension(self) -> None:
        self.assertEqual(classify(".xyz"), "08-其他")

    def test_human_size(self) -> None:
        self.assertEqual(human_size(500), "500 B")
        self.assertEqual(human_size(2048), "2.0 KB")


class OrganizeFlowTests(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name) / "测试"
        self.root.mkdir()
        (self.root / "合同A.pdf").write_bytes(b"%PDF-demo")
        (self.root / "合同A 副本.pdf").write_bytes(b"%PDF-demo")
        (self.root / "预算.xlsx").write_bytes(b"excel")
        (self.root / "未命名.txt").write_text("hello", encoding="utf-8")
        (self.root / "空文件.dat").write_bytes(b"")
        nested = self.root / "临时" / "更深"
        nested.mkdir(parents=True)
        (nested / "截屏2024.png").write_bytes(b"png-bytes")
        (self.root / "主题稿-1.md").write_text("a", encoding="utf-8")
        (self.root / "主题稿-2.md").write_text("b", encoding="utf-8")
        (self.root / "主题稿-3.md").write_text("c", encoding="utf-8")

    def tearDown(self) -> None:
        self.tmp.cleanup()

    def test_analyze_detects_duplicates_and_messy_names(self) -> None:
        result = analyze(self.root)
        self.assertGreaterEqual(result.file_count, 8)
        self.assertTrue(any(group for group in result.duplicates))
        messy_names = " ".join(row["relative"] for row in result.messy)
        self.assertIn("副本", messy_names)
        self.assertIn("未命名", messy_names)
        self.assertTrue(result.empty)
        self.assertIn("主题稿", result.prefix_groups)

    def test_dry_run_does_not_move_files(self) -> None:
        code = main([str(self.root)])
        self.assertEqual(code, 0)
        self.assertTrue((self.root / "合同A.pdf").exists())
        self.assertTrue((self.root / REPORT_NAME).exists())
        report = (self.root / REPORT_NAME).read_text(encoding="utf-8")
        self.assertIn("文件整理分析报告", report)
        self.assertIn("重复文件", report)

    def test_apply_and_undo(self) -> None:
        code = main([str(self.root), "--apply"])
        self.assertEqual(code, 0)
        output = self.root.parent / "测试_整理结果"
        self.assertTrue(output.exists())
        self.assertTrue(any(output.rglob("合同A.pdf")))
        self.assertTrue(any(output.rglob("*副本*.pdf")) or (output / "_重复文件").exists())
        self.assertFalse((self.root / "合同A.pdf").exists())

        log = output / "_整理日志.json"
        self.assertTrue(log.exists())
        payload = json.loads(log.read_text(encoding="utf-8"))
        self.assertGreater(len(payload["moves"]), 0)

        code = main([str(self.root), "--undo"])
        self.assertEqual(code, 0)
        self.assertTrue((self.root / "合同A.pdf").exists())

    def test_missing_path_returns_2(self) -> None:
        self.assertEqual(main(["/definitely/not/here-文稿"]), 2)

    def test_build_plan_keeps_duplicate_reason(self) -> None:
        analysis = analyze(self.root)
        plans = build_plan(analysis, self.root.parent / "out", by_date=False)
        reasons = {item.reason for item in plans}
        self.assertTrue(any("重复" in reason for reason in reasons))
        apply_plans(plans)
        self.assertTrue((self.root.parent / "out" / "01-文档").exists())


if __name__ == "__main__":
    unittest.main()
