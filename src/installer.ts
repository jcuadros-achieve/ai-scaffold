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
export const SCAFFOLD_VERSION = '2.14.0'

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
}

export interface OptionalModule {
  id:          string
  label:       string
  description: string
  kind:        string
  paths:       string[]
  /** Suggested MCP server ids from the manifest mcp catalog (ADR-008). */
  mcp?:        string[]
}

/** A verified MCP server definition from the manifest catalog (ADR-008). */
export interface McpServer {
  label:       string
  description: string
  docs:        string
  config:      Record<string, unknown>
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

/** The verified MCP server catalog and the ids offered to every project. */
export function loadMcpCatalog(): { base: string[]; servers: Record<string, McpServer> } {
  if (!fs.existsSync(MANIFEST_FILE)) return { base: [], servers: {} }
  try {
    const parsed = JSON.parse(fs.readFileSync(MANIFEST_FILE, 'utf8'))
    return {
      base:    Array.isArray(parsed.mcpBase) ? parsed.mcpBase : [],
      servers: typeof parsed.mcp === 'object' && parsed.mcp !== null ? parsed.mcp : {},
    }
  } catch {
    return { base: [], servers: {} }
  }
}

/** MCP server ids offered for this install: the base set plus the suggestions
 *  of every selected module, deduped, restricted to catalogued servers. */
export function mcpChoicesFor(selected: string[]): string[] {
  const { base, servers } = loadMcpCatalog()
  const chosen = new Set(selected)
  const ids = [...base]
  for (const mod of loadManifest()) {
    if (chosen.has(mod.id)) ids.push(...(mod.mcp ?? []))
  }
  return [...new Set(ids)].filter(id => id in servers)
}

export interface McpMergeResult {
  added:   string[]
  skipped: string[]
  /** true when an existing .mcp.json could not be parsed; nothing was written. */
  invalid: boolean
}

/** Add the chosen servers to the project's .mcp.json (ADR-008). The file is
 *  user-owned: existing entries always win, nothing is updated or removed,
 *  and an unparseable file is left untouched. */
export function mergeMcpServers(projectRoot: string, ids: string[]): McpMergeResult {
  const result: McpMergeResult = { added: [], skipped: [], invalid: false }
  if (ids.length === 0) return result

  const { servers } = loadMcpCatalog()
  const p = path.join(projectRoot, '.mcp.json')

  let data: Record<string, unknown> = {}
  if (fs.existsSync(p)) {
    try { data = JSON.parse(fs.readFileSync(p, 'utf8')) }
    catch { return { added: [], skipped: ids, invalid: true } }
  }
  const mcpServers = (typeof data.mcpServers === 'object' && data.mcpServers !== null
    ? data.mcpServers : {}) as Record<string, unknown>
  data.mcpServers = mcpServers

  for (const id of ids) {
    if (!(id in servers)) continue
    if (id in mcpServers) { result.skipped.push(id); continue }
    mcpServers[id] = servers[id].config
    result.added.push(id)
  }

  if (result.added.length) fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n')
  return result
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
                  baseHash?: string): FileAction {
  if (!fs.existsSync(dest)) return { type: 'create', src, dest }
  const current = fs.readFileSync(dest, 'utf8')
  if (current === incoming) return { type: 'skip', src, dest }

  if (baseHash) {
    const localModified    = hashContent(current)  !== baseHash
    const upstreamModified = hashContent(incoming) !== baseHash
    if (localModified && !upstreamModified)
      return { type: 'skip', src, dest, merge: 'customized' }
    const merge: MergeState = localModified ? 'conflict' : 'clean'
    return { type: 'update', src, dest, merge,
      diff: createDiff(current, incoming, label) }
  }

  return { type: 'update', src, dest, merge: 'unknown',
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
      bases?.[rel]?.hash))
  })

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
  fs.copyFileSync(action.src, action.dest)
}

export function writeVersionFile(projectRoot: string, selected: string[] = [],
                                 mcp: string[] = []): void {
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
    mcp,
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

/** MCP server ids chosen at install time ([] when none or pre-2.9 install). */
export function readInstalledMcp(projectRoot: string): string[] {
  const data = readVersionData(projectRoot)
  return Array.isArray(data?.mcp) ? data.mcp as string[] : []
}

function walkDir(dir: string, cb: (f: string) => void): void {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) walkDir(full, cb)
    else cb(full)
  }
}
