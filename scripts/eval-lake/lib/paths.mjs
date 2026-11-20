import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))

export const REPO_ROOT = path.resolve(here, '../../..')
export const LAKE_ROOT = path.join(REPO_ROOT, 'eval-lake')
export const REPORT_PATH = path.join(REPO_ROOT, 'public/eval-lake/report.json')
