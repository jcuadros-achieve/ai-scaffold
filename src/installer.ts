import fs   from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createDiff } from './differ.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const TEMPLATES_DIR = path.resolve(__dirname, '../templates')
export const SCAFFOLD_VERSION_FILE = '.ai/.scaffold-version'
export const SCAFFOLD_VERSION = '1.1.0'

export interface FileAction {
  type: 'create' | 'update' | 'skip' | 'symlink'
  src:  string
  dest: string
  diff?: string
}

export function planInstall(projectRoot: string): FileAction[] {
  const actions: FileAction[] = []

  walkDir(TEMPLATES_DIR, (srcPath) => {
    const rel  = path.relative(TEMPLATES_DIR, srcPath)
    const dest = path.join(projectRoot, rel)

    if (!fs.existsSync(dest)) {
      actions.push({ type: 'create', src: srcPath, dest })
      return
    }

    const srcContent  = fs.readFileSync(srcPath, 'utf8')
    const destContent = fs.readFileSync(dest, 'utf8')

    if (srcContent === destContent) {
      actions.push({ type: 'skip', src: srcPath, dest })
    } else {
      actions.push({ type: 'update', src: srcPath, dest,
        diff: createDiff(destContent, srcContent, rel) })
    }
  })

  const symlinks: Array<[string, string]> = [
    ['.ai/AI_CONTEXT.md', 'CLAUDE.md'],
    ['.ai/AI_CONTEXT.md', '.cursorrules'],
  ]
  for (const [target, link] of symlinks) {
    const dest = path.join(projectRoot, link)
    actions.push(fs.existsSync(dest)
      ? { type: 'skip',    src: target, dest }
      : { type: 'symlink', src: target, dest })
  }

  return actions
}

export function applyAction(action: FileAction): void {
  if (action.type === 'skip') return
  if (action.type === 'symlink') {
    fs.mkdirSync(path.dirname(action.dest), { recursive: true })
    fs.symlinkSync(action.src, action.dest)
    return
  }
  fs.mkdirSync(path.dirname(action.dest), { recursive: true })
  fs.copyFileSync(action.src, action.dest)
}

export function writeVersionFile(projectRoot: string): void {
  const p = path.join(projectRoot, SCAFFOLD_VERSION_FILE)
  fs.mkdirSync(path.dirname(p), { recursive: true })
  fs.writeFileSync(p, JSON.stringify({
    version: SCAFFOLD_VERSION,
    installedAt: new Date().toISOString(),
  }, null, 2))
}

export function readVersionFile(projectRoot: string): string | null {
  const p = path.join(projectRoot, SCAFFOLD_VERSION_FILE)
  if (!fs.existsSync(p)) return null
  try { return JSON.parse(fs.readFileSync(p, 'utf8')).version ?? null }
  catch { return null }
}

function walkDir(dir: string, cb: (f: string) => void): void {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) walkDir(full, cb)
    else cb(full)
  }
}
