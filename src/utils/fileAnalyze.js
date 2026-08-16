const CATEGORIES = {
  '01-文档': ['.pdf', '.doc', '.docx', '.txt', '.md', '.rtf', '.pages', '.odt', '.wps', '.html', '.htm', '.epub'],
  '02-表格': ['.xls', '.xlsx', '.csv', '.numbers', '.ods', '.tsv'],
  '03-演示': ['.ppt', '.pptx', '.key', '.odp'],
  '04-图片': ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.heif', '.bmp', '.svg', '.tif', '.tiff', '.ico'],
  '05-音视频': ['.mp3', '.wav', '.aac', '.flac', '.m4a', '.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v'],
  '06-压缩包': ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.dmg', '.iso'],
  '07-代码与数据': ['.py', '.js', '.ts', '.json', '.xml', '.sql', '.ipynb', '.sh', '.vue', '.java', '.yml', '.yaml']
}

const MESSY_RE = /(副本|的副本|copy|untitled|未命名|新建\s*(文件夹|文稿|文档)?|screenshot|截屏|屏幕快照|\(\d+\)|（\d+）)/i

export function getExtension(name) {
  const index = name.lastIndexOf('.')
  if (index <= 0) return ''
  return name.slice(index).toLowerCase()
}

export function classify(name) {
  const ext = getExtension(name)
  for (const [label, list] of Object.entries(CATEGORIES)) {
    if (list.includes(ext)) return label
  }
  return '08-其他'
}

export function humanSize(num) {
  let value = Number(num) || 0
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  for (const unit of units) {
    if (value < 1024 || unit === 'TB') {
      return unit === 'B' ? `${Math.round(value)} ${unit}` : `${value.toFixed(1)} ${unit}`
    }
    value /= 1024
  }
  return `${num} B`
}

export function detectIssues(name, size) {
  const issues = []
  if (!size) issues.push('空文件')
  if (MESSY_RE.test(name)) issues.push('命名较乱')
  if (name.startsWith('.')) issues.push('隐藏文件')
  if (name.includes('  ')) issues.push('文件名含连续空格')
  return issues
}

export function prefixKey(name) {
  const stem = name.replace(/\.[^.]+$/, '').replace(MESSY_RE, '').trim()
  const part = stem.split(/[\s_\-—–.（(]+/).filter(Boolean)[0]
  if (!part || part.length < 2 || /^\d+$/.test(part)) return ''
  return part
}

export function analyzeBrowserFiles(fileList) {
  const files = Array.from(fileList || []).filter((file) => {
    const name = file.name || ''
    return name && name !== '.DS_Store' && !name.startsWith('_文件')
  })

  const byCategory = {}
  const sizeGroups = {}
  const prefixGroups = {}
  const messy = []
  const empty = []
  const items = files.map((file) => {
    const relative = file.webkitRelativePath || file.name
    const category = classify(file.name)
    const issues = detectIssues(file.name, file.size)
    const item = {
      name: file.name,
      relative,
      size: file.size,
      lastModified: file.lastModified,
      category,
      issues
    }
    if (!byCategory[category]) byCategory[category] = { count: 0, size: 0 }
    byCategory[category].count += 1
    byCategory[category].size += file.size
    const sizeKey = `${file.size}:${file.name}`
    if (!sizeGroups[sizeKey]) sizeGroups[sizeKey] = []
    sizeGroups[sizeKey].push(relative)
    const key = prefixKey(file.name)
    if (key) {
      if (!prefixGroups[key]) prefixGroups[key] = []
      prefixGroups[key].push(relative)
    }
    if (issues.length) messy.push({ relative, issues })
    if (!file.size) empty.push(relative)
    return item
  })

  const largest = [...items]
    .sort((a, b) => b.size - a.size)
    .slice(0, 15)
    .map((item) => ({
      relative: item.relative,
      size: item.size,
      size_h: humanSize(item.size)
    }))

  const maybeDuplicates = Object.values(sizeGroups).filter((group) => group.length > 1)
  const prefixes = Object.fromEntries(
    Object.entries(prefixGroups).filter(([, paths]) => paths.length >= 3)
  )

  return {
    fileCount: items.length,
    totalSize: items.reduce((sum, item) => sum + item.size, 0),
    byCategory,
    largest,
    maybeDuplicates,
    messy,
    empty,
    prefixGroups: prefixes,
    items
  }
}

export function renderBrowserReport(analysis, folderLabel) {
  const lines = [
    '# 文件整理分析报告',
    '',
    `- 选择目录：${folderLabel || '浏览器本地文件夹'}`,
    `- 生成时间：${new Date().toLocaleString()}`,
    `- 文件数量：${analysis.fileCount}`,
    `- 合计大小：${humanSize(analysis.totalSize)}`,
    '',
    '## 类型分布',
    ''
  ]
  Object.keys(analysis.byCategory)
    .sort()
    .forEach((name) => {
      const info = analysis.byCategory[name]
      lines.push(`- ${name}：${info.count} 个，${humanSize(info.size)}`)
    })
  lines.push('', '## 体积最大的文件', '')
  if (analysis.largest.length) {
    analysis.largest.forEach((row) => lines.push(`- ${row.relative}（${row.size_h}）`))
  } else {
    lines.push('- 无')
  }
  lines.push('', '## 可能重复（同名且同大小）', '')
  if (analysis.maybeDuplicates.length) {
    analysis.maybeDuplicates.forEach((group, index) => {
      lines.push(`- 组 ${index + 1}：${group.join('、')}`)
    })
  } else {
    lines.push('- 未发现同名同大小文件')
  }
  lines.push('', '## 命名或状态问题', '')
  if (analysis.messy.length) {
    analysis.messy.forEach((row) => lines.push(`- ${row.relative}：${row.issues.join('、')}`))
  } else {
    lines.push('- 未发现明显命名问题')
  }
  lines.push(
    '',
    '## 建议',
    '',
    '浏览器只能预览，不会改你电脑上的文件。',
    '要真正整理，请在本机运行：',
    '',
    '```bash',
    'python3 scripts/file_organizer.py "/Users/liguangxin/Desktop/文稿new/测试"',
    'python3 scripts/file_organizer.py "/Users/liguangxin/Desktop/文稿new/测试" --apply',
    '```',
    ''
  )
  return lines.join('\n')
}
