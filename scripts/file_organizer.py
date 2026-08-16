#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""本地文件夹整理分析工具。

云端环境读不到你电脑上的路径，把本脚本拷到本机后运行：

  python3 scripts/file_organizer.py "/Users/liguangxin/Desktop/文稿new/测试"
  python3 scripts/file_organizer.py "/Users/liguangxin/Desktop/文稿new/测试" --apply
  python3 scripts/file_organizer.py "/Users/liguangxin/Desktop/文稿new/测试" --undo
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
import sys
from collections import defaultdict
from dataclasses import asdict, dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Sequence, Tuple


DEFAULT_TARGET = "/Users/liguangxin/Desktop/文稿new/测试"
SKIP_NAMES = {".ds_store", "thumbs.db", "desktop.ini", ".localized"}
SKIP_DIR_NAMES = {".git", ".svn", "__pycache__", "node_modules", ".idea", ".vscode"}
REPORT_NAME = "_文件分析报告.md"
PLAN_NAME = "_整理计划.json"
LOG_NAME = "_整理日志.json"
RESULT_SUFFIX = "_整理结果"

CATEGORIES: Dict[str, Sequence[str]] = {
    "01-文档": (
        ".pdf",
        ".doc",
        ".docx",
        ".txt",
        ".md",
        ".rtf",
        ".pages",
        ".odt",
        ".wps",
        ".html",
        ".htm",
        ".epub",
    ),
    "02-表格": (".xls", ".xlsx", ".csv", ".numbers", ".ods", ".tsv"),
    "03-演示": (".ppt", ".pptx", ".key", ".odp"),
    "04-图片": (
        ".jpg",
        ".jpeg",
        ".png",
        ".gif",
        ".webp",
        ".heic",
        ".heif",
        ".bmp",
        ".svg",
        ".tif",
        ".tiff",
        ".ico",
        ".raw",
        ".dng",
    ),
    "05-音视频": (
        ".mp3",
        ".wav",
        ".aac",
        ".flac",
        ".m4a",
        ".mp4",
        ".mov",
        ".avi",
        ".mkv",
        ".webm",
        ".m4v",
        ".wmv",
    ),
    "06-压缩包": (".zip", ".rar", ".7z", ".tar", ".gz", ".bz2", ".dmg", ".iso", ".tgz"),
    "07-代码与数据": (
        ".py",
        ".js",
        ".ts",
        ".json",
        ".xml",
        ".sql",
        ".ipynb",
        ".sh",
        ".vue",
        ".java",
        ".c",
        ".cpp",
        ".go",
        ".rs",
        ".yml",
        ".yaml",
    ),
}

MESSY_NAME_RE = re.compile(
    r"(副本|的副本|copy|untitled|未命名|新建\s*(文件夹|文稿|文档)?|screenshot|截屏|屏幕快照|\(\d+\)|（\d+）)",
    re.IGNORECASE,
)
PREFIX_SPLIT_RE = re.compile(r"[\s_\-—–.（(]+")
HASH_SIZE_LIMIT = 80 * 1024 * 1024


@dataclass
class FileItem:
    path: str
    name: str
    suffix: str
    category: str
    size: int
    mtime: float
    digest: str
    relative: str
    issues: List[str] = field(default_factory=list)


@dataclass
class MovePlan:
    source: str
    destination: str
    reason: str


@dataclass
class Analysis:
    root: str
    generated_at: str
    file_count: int
    folder_count: int
    total_size: int
    by_category: Dict[str, Dict[str, int]]
    largest: List[Dict[str, object]]
    duplicates: List[List[str]]
    messy: List[Dict[str, object]]
    empty: List[str]
    prefix_groups: Dict[str, List[str]]
    files: List[FileItem]


def classify(suffix: str) -> str:
    lower = suffix.lower()
    for name, exts in CATEGORIES.items():
        if lower in exts:
            return name
    return "08-其他"


def human_size(num: int) -> str:
    value = float(num)
    for unit in ("B", "KB", "MB", "GB", "TB"):
        if value < 1024 or unit == "TB":
            if unit == "B":
                return f"{int(value)} {unit}"
            return f"{value:.1f} {unit}"
        value /= 1024
    return f"{num} B"


def should_skip_dir(path: Path) -> bool:
    return path.name.lower() in SKIP_DIR_NAMES or path.name.startswith(RESULT_SUFFIX.lstrip("_"))


def iter_files(root: Path) -> Iterable[Path]:
    for item in root.rglob("*"):
        if not item.is_file():
            continue
        if item.name.lower() in SKIP_NAMES:
            continue
        if item.name in {REPORT_NAME, PLAN_NAME, LOG_NAME}:
            continue
        if any(part.lower() in SKIP_DIR_NAMES for part in item.parts):
            continue
        if any(RESULT_SUFFIX in part for part in item.relative_to(root).parts):
            continue
        yield item


def file_digest(path: Path, size: int) -> str:
    if size == 0:
        return "empty"
    hasher = hashlib.sha256()
    read_limit = size if size <= HASH_SIZE_LIMIT else 1024 * 1024
    with path.open("rb") as handle:
        remaining = read_limit
        while remaining > 0:
            chunk = handle.read(min(1024 * 1024, remaining))
            if not chunk:
                break
            hasher.update(chunk)
            remaining -= len(chunk)
    prefix = "full" if size <= HASH_SIZE_LIMIT else "partial"
    return f"{prefix}:{size}:{hasher.hexdigest()}"


def detect_issues(name: str, size: int) -> List[str]:
    issues: List[str] = []
    if size == 0:
        issues.append("空文件")
    if MESSY_NAME_RE.search(name):
        issues.append("命名较乱")
    if name.startswith("."):
        issues.append("隐藏文件")
    if " " * 2 in name:
        issues.append("文件名含连续空格")
    return issues


def common_prefix_key(name: str) -> Optional[str]:
    stem = Path(name).stem
    stem = MESSY_NAME_RE.sub("", stem).strip(" _-—.")
    parts = [part for part in PREFIX_SPLIT_RE.split(stem) if part]
    if not parts:
        return None
    key = parts[0]
    if len(key) < 2:
        return None
    if key.isdigit():
        return None
    return key


def analyze(root: Path) -> Analysis:
    files: List[FileItem] = []
    folder_count = 0
    for item in root.rglob("*"):
        if item.is_dir() and not should_skip_dir(item):
            folder_count += 1

    digest_map: Dict[str, List[str]] = defaultdict(list)
    prefix_map: Dict[str, List[str]] = defaultdict(list)

    for path in iter_files(root):
        size = path.stat().st_size
        digest = file_digest(path, size)
        relative = str(path.relative_to(root))
        item = FileItem(
            path=str(path),
            name=path.name,
            suffix=path.suffix.lower(),
            category=classify(path.suffix),
            size=size,
            mtime=path.stat().st_mtime,
            digest=digest,
            relative=relative,
            issues=detect_issues(path.name, size),
        )
        files.append(item)
        digest_map[digest].append(relative)
        prefix = common_prefix_key(path.name)
        if prefix:
            prefix_map[prefix].append(relative)

    by_category: Dict[str, Dict[str, int]] = {}
    for item in files:
        bucket = by_category.setdefault(item.category, {"count": 0, "size": 0})
        bucket["count"] += 1
        bucket["size"] += item.size

    largest = [
        {"relative": item.relative, "size": item.size, "size_h": human_size(item.size)}
        for item in sorted(files, key=lambda x: x.size, reverse=True)[:15]
    ]
    duplicates = [paths for paths in digest_map.values() if len(paths) > 1]
    messy = [
        {"relative": item.relative, "issues": item.issues}
        for item in files
        if item.issues
    ]
    empty = [item.relative for item in files if item.size == 0]
    prefix_groups = {
        key: paths
        for key, paths in sorted(prefix_map.items(), key=lambda kv: -len(kv[1]))
        if len(paths) >= 3
    }

    return Analysis(
        root=str(root),
        generated_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        file_count=len(files),
        folder_count=folder_count,
        total_size=sum(item.size for item in files),
        by_category=dict(sorted(by_category.items())),
        largest=largest,
        duplicates=duplicates,
        messy=messy,
        empty=empty,
        prefix_groups=prefix_groups,
        files=files,
    )


def unique_dest(dest: Path) -> Path:
    if not dest.exists():
        return dest
    stem, suffix = dest.stem, dest.suffix
    index = 2
    while True:
        candidate = dest.with_name(f"{stem}_{index}{suffix}")
        if not candidate.exists():
            return candidate
        index += 1


def build_plan(analysis: Analysis, output_root: Path, by_date: bool) -> List[MovePlan]:
    plans: List[MovePlan] = []
    seen_dest: Dict[str, int] = {}
    duplicate_first: Dict[str, str] = {}

    for group in analysis.duplicates:
        if group:
            duplicate_first[group[0]] = group[0]

    for item in analysis.files:
        category = item.category
        if by_date:
            dt = datetime.fromtimestamp(item.mtime)
            dest_dir = output_root / category / f"{dt.year:04d}" / f"{dt.month:02d}"
        else:
            dest_dir = output_root / category

        reason = "按类型归类"
        if item.relative in {path for group in analysis.duplicates for path in group[1:]}:
            dest_dir = output_root / "_重复文件" / category
            reason = "内容重复，保留首份在原分类，其余集中存放"

        dest = dest_dir / Path(item.name)
        key = str(dest)
        if key in seen_dest:
            seen_dest[key] += 1
            dest = dest_dir / f"{dest.stem}_{seen_dest[key]}{dest.suffix}"
        else:
            seen_dest[key] = 1

        if Path(item.path).resolve() == dest.resolve():
            continue
        plans.append(
            MovePlan(source=item.path, destination=str(dest), reason=reason)
        )
    return plans


def render_report(analysis: Analysis, plans: Sequence[MovePlan], output_root: Path) -> str:
    lines = [
        "# 文件整理分析报告",
        "",
        f"- 扫描路径：`{analysis.root}`",
        f"- 生成时间：{analysis.generated_at}",
        f"- 文件数量：{analysis.file_count}",
        f"- 子文件夹：{analysis.folder_count}",
        f"- 合计大小：{human_size(analysis.total_size)}",
        f"- 建议输出：`{output_root}`",
        "",
        "## 类型分布",
        "",
        "| 分类 | 数量 | 大小 |",
        "| --- | ---: | ---: |",
    ]
    for name, info in analysis.by_category.items():
        lines.append(f"| {name} | {info['count']} | {human_size(info['size'])} |")

    lines += ["", "## 体积最大的文件", ""]
    if analysis.largest:
        for row in analysis.largest:
            lines.append(f"- `{row['relative']}`（{row['size_h']}）")
    else:
        lines.append("- 无")

    lines += ["", "## 重复文件", ""]
    if analysis.duplicates:
        for index, group in enumerate(analysis.duplicates, 1):
            lines.append(f"### 组 {index}")
            for path in group:
                lines.append(f"- `{path}`")
    else:
        lines.append("- 未发现内容相同的文件")

    lines += ["", "## 命名或状态问题", ""]
    if analysis.messy:
        for row in analysis.messy:
            lines.append(f"- `{row['relative']}`：{'、'.join(row['issues'])}")
    else:
        lines.append("- 未发现明显命名问题")

    lines += ["", "## 疑似同一主题（文件名前缀）", ""]
    if analysis.prefix_groups:
        for key, paths in analysis.prefix_groups.items():
            lines.append(f"- **{key}**（{len(paths)} 个）：" + "、".join(f"`{p}`" for p in paths[:8]))
    else:
        lines.append("- 文件名缺少可复用的共同前缀")

    lines += [
        "",
        "## 建议整理方式",
        "",
        "1. 先看本报告，确认分类是否符合你的使用习惯。",
        "2. 默认只生成计划，不移动文件。",
        "3. 确认后执行：`python3 scripts/file_organizer.py <目录> --apply`。",
        "4. 原文件移到「目录名_整理结果」中，可用 `--undo` 撤回到原位置。",
        "5. 重复文件会单独放到 `_重复文件`，不会直接删除。",
        "",
        f"## 整理计划预览（{len(plans)} 项）",
        "",
    ]
    preview = plans[:40]
    if preview:
        for plan in preview:
            src = Path(plan.source).name
            dest = Path(plan.destination).relative_to(output_root) if str(plan.destination).startswith(str(output_root)) else plan.destination
            lines.append(f"- `{src}` → `{dest}`（{plan.reason}）")
        if len(plans) > 40:
            lines.append(f"- ……其余 {len(plans) - 40} 项见 `{PLAN_NAME}`")
    else:
        lines.append("- 无需移动")

    lines.append("")
    return "\n".join(lines)


def write_json(path: Path, payload: object) -> None:
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def apply_plans(plans: Sequence[MovePlan]) -> List[Dict[str, str]]:
    executed: List[Dict[str, str]] = []
    for plan in plans:
        src = Path(plan.source)
        dest = unique_dest(Path(plan.destination))
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.move(str(src), str(dest))
        executed.append(
            {
                "source": plan.source,
                "destination": str(dest),
                "reason": plan.reason,
            }
        )
    return executed


def undo_moves(log_path: Path) -> int:
    payload = json.loads(log_path.read_text(encoding="utf-8"))
    moves = list(reversed(payload.get("moves", [])))
    count = 0
    for item in moves:
        src = Path(item["destination"])
        dest = Path(item["source"])
        if not src.exists():
            continue
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest = unique_dest(dest) if dest.exists() else dest
        shutil.move(str(src), str(dest))
        count += 1
    return count


def parse_args(argv: Optional[Sequence[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="分析并整理本地文件夹")
    parser.add_argument(
        "path",
        nargs="?",
        default=DEFAULT_TARGET,
        help=f"要分析的目录，默认 {DEFAULT_TARGET}",
    )
    parser.add_argument("--apply", action="store_true", help="按计划移动文件（默认只分析）")
    parser.add_argument("--undo", action="store_true", help="按整理日志撤回到原位置")
    parser.add_argument("--by-date", action="store_true", help="分类后再按年/月分子目录")
    parser.add_argument("--output", help="整理结果目录，默认是「原目录名_整理结果」")
    return parser.parse_args(argv)


def resolve_output(root: Path, output: Optional[str]) -> Path:
    if output:
        return Path(output).expanduser().resolve()
    return (root.parent / f"{root.name}{RESULT_SUFFIX}").resolve()


def main(argv: Optional[Sequence[str]] = None) -> int:
    args = parse_args(argv)
    root = Path(args.path).expanduser()
    if not root.exists() or not root.is_dir():
        print(f"找不到目录：{root}", file=sys.stderr)
        print("这是本机路径。请在自己的电脑上运行本脚本，或把文件夹拷进当前工作区。", file=sys.stderr)
        return 2

    root = root.resolve()
    output_root = resolve_output(root, args.output)
    log_path = output_root / LOG_NAME

    if args.undo:
        if not log_path.exists():
            print(f"没有整理日志：{log_path}", file=sys.stderr)
            return 2
        count = undo_moves(log_path)
        print(f"已撤回 {count} 个文件。")
        return 0

    analysis = analyze(root)
    plans = build_plan(analysis, output_root, args.by_date)
    report = render_report(analysis, plans, output_root)
    report_path = root / REPORT_NAME
    report_path.write_text(report, encoding="utf-8")
    write_json(
        root / PLAN_NAME,
        {
            "root": analysis.root,
            "output": str(output_root),
            "generated_at": analysis.generated_at,
            "plans": [asdict(item) for item in plans],
        },
    )

    print(report)
    print(f"\n报告已写入：{report_path}")
    print(f"计划已写入：{root / PLAN_NAME}")

    if not args.apply:
        print("当前是预览模式，没有移动文件。确认后加上 --apply 执行。")
        return 0

    output_root.mkdir(parents=True, exist_ok=True)
    executed = apply_plans(plans)
    write_json(
        log_path,
        {
            "root": str(root),
            "output": str(output_root),
            "applied_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "moves": executed,
        },
    )
    (output_root / REPORT_NAME).write_text(report, encoding="utf-8")
    print(f"已移动 {len(executed)} 个文件到：{output_root}")
    print(f"如需撤回：python3 scripts/file_organizer.py {root} --undo")
    return 0


if __name__ == "__main__":
    sys.exit(main())
