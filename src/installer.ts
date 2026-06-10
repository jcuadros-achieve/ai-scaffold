import crypto from 'crypto'
import fs   from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createDiff } from './differ.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const TEMPLATES_DIR = path.resolve(__dirname, '../templates')
export const MANIFEST_FILE = path.resolve(__dirname, '../scaffold.manifest.json')
export const SCAFFOLD_VERSION_FILE = '.claude/.scaffold-version'
export const LEGACY_VERSION_FILE = '.ai/.scaffold-version'
export const SCAFFOLD_VERSION = '2.7.0'

/** Three-way classification against the installed base (ADR-006).
 *  clean      = local untouched, upstream changed   → safe fast-forward
 *  customized = local changed, upstream unchanged   → skipped, nothing new
 *  conflict   = both changed                        → never auto-applied
 *  unknown    = no base recorded (pre-2.3 install)  → legacy behavior */
export type MergeState = 'clean' | 'customized' | 'conflict' | 'unknown'

export interface FileAction {
  type: 'create' | 'update' | 'skip'
  src:  string
  dest: string
  diff?: string
  merge?: MergeState
  /** Present on install-time-generated files; written verbatim instead of copying src. */
  content?: string
}

export interface OptionalModule {
  id:          string
  label:       string
  description: string
  kind:        string
  paths:       string[]
}

/** Per-template metadata from the manifest catalog (ADR-007). */
export interface CatalogEntry {
  path:    string
  kind:    string
  version: string
  updated: string
  hash:    string
  tags?:   string[]
}

interface SkillMeta { name: string; description: string; tier: string }

/**
 * templates/ uses a logical layout (skills/, rules/, context/, root files).
 * This table maps each template-relative path to its install location (ADR-002).
 */
export function mapTemplatePath(rel: string): string {
  const posix = rel.split(path.sep).join('/')
  if (posix.startsWith('skills/')) {
    const name = path.basename(posix, '.md')
    return path.join('.claude', 'skills', name, 'SKILL.md')
  }
  if (posix.startsWith('rules/'))
    return path.join('.claude', 'rules', path.basename(posix))
  if (posix.startsWith('context/'))
    return path.join('.context', posix.slice('context/'.length))
  return rel   // root-level files (CLAUDE.md) install verbatim
}

/** Optional, project-shape-dependent templates. Everything under templates/
 *  NOT claimed by one of these is core and always installed. */
export function loadManifest(): OptionalModule[] {
  if (!fs.existsSync(MANIFEST_FILE)) return []
  try {
    const parsed = JSON.parse(fs.readFileSync(MANIFEST_FILE, 'utf8'))
    return Array.isArray(parsed.optional) ? parsed.optional : []
  } catch {
    return []
  }
}

/** The per-template catalog (every template, core and optional). */
export function loadCatalog(): CatalogEntry[] {
  if (!fs.existsSync(MANIFEST_FILE)) return []
  try {
    const parsed = JSON.parse(fs.readFileSync(MANIFEST_FILE, 'utf8'))
    return Array.isArray(parsed.templates) ? parsed.templates : []
  } catch {
    return []
  }
}

/** Template-relative (logical) paths that should be skipped because their
 *  optional module was not selected. Core paths are never in this set. */
function excludedPaths(selected: string[]): Set<string> {
  const chosen = new Set(selected)
  const excluded = new Set<string>()
  for (const mod of loadManifest()) {
    if (!chosen.has(mod.id)) mod.paths.forEach(p => excluded.add(p))
  }
  return excluded
}

function parseFrontmatter(content: string, field: string): string | null {
  const fm = content.match(/^---\n([\s\S]*?)\n---/)
  if (!fm) return null
  const line = fm[1].match(new RegExp(`^${field}:\\s*(.+)$`, 'm'))
  return line ? line[1].trim() : null
}

/** Skills that will be installed (selection-aware), with their descriptions. */
function collectSkills(excluded: Set<string>): SkillMeta[] {
  const skillsDir = path.join(TEMPLATES_DIR, 'skills')
  const out: SkillMeta[] = []
  if (!fs.existsSync(skillsDir)) return out
  walkDir(skillsDir, (srcPath) => {
    const rel = path.relative(TEMPLATES_DIR, srcPath).split(path.sep).join('/')
    if (excluded.has(rel)) return
    const name = path.basename(srcPath, '.md')
    const content = fs.readFileSync(srcPath, 'utf8')
    const description = parseFrontmatter(content, 'description')
      ?? `Run the ${name} skill for this project.`
    // tier: effort semantics, never a model id (ADR-005); missing → deep
    const tier = parseFrontmatter(content, 'tier') ?? 'deep'
    out.push({ name, description, tier })
  })
  return out.sort((a, b) => a.name.localeCompare(b.name))
}

/** Derived files generated at install time (ADR-002, trimmed by ADR-010 —
 *  Cursor reads .claude/ natively). Content lives in CLAUDE.md and the
 *  skills; these are never stored under templates/. */
function generatedFiles(excluded: Set<string>): Array<{ rel: string; content: string }> {
  const skills = collectSkills(excluded)
  const skillList = skills.map(s => `- \`${s.name}\` (${s.tier}) — ${s.description}`).join('\n')

  const copilot = `# Copilot instructions

> Generated by ai-scaffold — do not edit. The content lives in \`CLAUDE.md\`.

Read \`CLAUDE.md\` (the project context and single source of truth) and follow
every rule in \`.claude/rules/\` before making changes.

Agent skills are discovered natively from \`.claude/skills/\`. The tier marks
effort semantics (\`fast\` = mechanical, \`deep\` = judgment-heavy), useful when
routing work across models:

${skillList}
`

  return [
    { rel: path.join('.github', 'copilot-instructions.md'), content: copilot },
  ]
}

export function hashContent(content: string | Buffer): string {
  return 'sha256:' + crypto.createHash('sha256').update(content).digest('hex')
}

/** Installed base per template (logical path → version/hash), recorded at
 *  install time. null when no base info exists (pre-2.3 install). */
export function readInstalledBases(
  projectRoot: string,
): Record<string, { version: string; hash: string }> | null {
  const data = readVersionData(projectRoot)
  if (data === null || typeof data.templates !== 'object' || data.templates === null)
    return null
  return data.templates as Record<string, { version: string; hash: string }>
}

function planFile(src: string, dest: string, incoming: string, label: string,
                  content?: string, baseHash?: string): FileAction {
  if (!fs.existsSync(dest)) return { type: 'create', src, dest, content }
  const current = fs.readFileSync(dest, 'utf8')
  if (current === incoming) return { type: 'skip', src, dest, content }

  if (baseHash) {
    const localModified    = hashContent(current)  !== baseHash
    const upstreamModified = hashContent(incoming) !== baseHash
    if (localModified && !upstreamModified)
      return { type: 'skip', src, dest, content, merge: 'customized' }
    const merge: MergeState = localModified ? 'conflict' : 'clean'
    return { type: 'update', src, dest, content, merge,
      diff: createDiff(current, incoming, label) }
  }

  return { type: 'update', src, dest, content, merge: 'unknown',
    diff: createDiff(current, incoming, label) }
}

/**
 * Plan the install.
 * @param selected ids of optional modules to include. Defaults to core-only.
 */
export function planInstall(projectRoot: string, selected: string[] = []): FileAction[] {
  const actions: FileAction[] = []
  const excluded = excludedPaths(selected)
  const bases = readInstalledBases(projectRoot)

  walkDir(TEMPLATES_DIR, (srcPath) => {
    const rel = path.relative(TEMPLATES_DIR, srcPath).split(path.sep).join('/')
    if (excluded.has(rel)) return            // optional module not selected
    const dest = path.join(projectRoot, mapTemplatePath(rel))
    actions.push(planFile(srcPath, dest, fs.readFileSync(srcPath, 'utf8'), rel,
      undefined, bases?.[rel]?.hash))
  })

  for (const g of generatedFiles(excluded)) {
    const dest = path.join(projectRoot, g.rel)
    actions.push(planFile(g.rel, dest, g.content, g.rel, g.content))
  }

  return actions
}

export function applyAction(action: FileAction): void {
  if (action.type === 'skip') return
  fs.mkdirSync(path.dirname(action.dest), { recursive: true })
  // A legacy install may have left a symlink here (e.g. CLAUDE.md →
  // .ai/AI_CONTEXT.md); replace the link itself, never write through it.
  try {
    if (fs.lstatSync(action.dest).isSymbolicLink()) fs.unlinkSync(action.dest)
  } catch { /* dest does not exist */ }
  if (action.content !== undefined) {
    fs.writeFileSync(action.dest, action.content)
    return
  }
  fs.copyFileSync(action.src, action.dest)
}

export function writeVersionFile(projectRoot: string, selected: string[] = []): void {
  const p = path.join(projectRoot, SCAFFOLD_VERSION_FILE)
  fs.mkdirSync(path.dirname(p), { recursive: true })

  // Installed base per template (ADR-007): lets update/diff reason per file
  // (installed base vs local file vs incoming template) instead of globally.
  const excluded = excludedPaths(selected)
  const templates: Record<string, { version: string; hash: string }> = {}
  for (const entry of loadCatalog()) {
    if (excluded.has(entry.path)) continue
    templates[entry.path] = { version: entry.version, hash: entry.hash }
  }

  fs.writeFileSync(p, JSON.stringify({
    version:     SCAFFOLD_VERSION,
    installedAt: new Date().toISOString(),
    optional:    selected,
    templates,
  }, null, 2))
}

/** Current location first, then the pre-2.0 legacy location. */
function readVersionData(projectRoot: string): Record<string, unknown> | null {
  for (const rel of [SCAFFOLD_VERSION_FILE, LEGACY_VERSION_FILE]) {
    const p = path.join(projectRoot, rel)
    if (!fs.existsSync(p)) continue
    try { return JSON.parse(fs.readFileSync(p, 'utf8')) }
    catch { return null }
  }
  return null
}

export function readVersionFile(projectRoot: string): string | null {
  const data = readVersionData(projectRoot)
  return typeof data?.version === 'string' ? data.version : null
}

/** Optional module ids recorded at install time. null = not installed yet,
 *  [] = installed core-only (or an older version file without the field). */
export function readInstalledSelection(projectRoot: string): string[] | null {
  const data = readVersionData(projectRoot)
  if (data === null) return null
  return Array.isArray(data.optional) ? data.optional as string[] : []
}

function walkDir(dir: string, cb: (f: string) => void): void {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) walkDir(full, cb)
    else cb(full)
  }
}
