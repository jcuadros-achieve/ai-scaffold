/**
 * Catalog matcher — the pure core of the inverted install flow (ADR-017/018/020).
 *
 * `suggest()` filters the compiled catalog index against a project profile and
 * returns the candidates that apply, each attributed to the workspaces that
 * justified it. This module is PURE: it never touches the filesystem and never
 * re-derives facts — it trusts the profile produced by the `ai-init` scan
 * (ADR-017 §2). That keeps the filter mechanical and fully unit-testable; the
 * agent ranks and justifies on top (ADR-018 §3).
 */

/** A single `appliesWhen` predicate. Multiple keys on one predicate are ANDed
 *  (the entry applies only when all the stated facts hold). */
export interface Predicate {
  /** A package/dependency name declared in the workspace. */
  dep?:       string
  /** A language the workspace uses (e.g. "typescript"). */
  lang?:      string
  /** A framework the workspace uses (e.g. "next", "express"). */
  framework?: string
  /** The workspace archetype (e.g. "service", "library", "cli"). */
  archetype?: string
  /** A glob over the workspace's declared file list (e.g. "**\/tsconfig.json"). */
  file?:      string
  /** A substring that must appear in a `file`-matched file's recorded content
   *  (or, without `file`, in any recorded content). */
  contains?:  string
}

/** A boolean group of predicates/sub-groups. Nestable one level (ADR-018 §3). */
export interface Group {
  any?: Node[]
  all?: Node[]
}

export type Node = Predicate | Group

/** Either a single predicate or a boolean group. Absence on an entry means the
 *  entry is universal — always recommended (ADR-018 §3). */
export type AppliesWhen = Node

export type Surface = 'skill' | 'rule' | 'agent' | 'mcp'
export type Stability = 'stable' | 'experimental'

/** One compiled catalog entry (a row of catalog.index.json, ADR-018 §2). */
export interface CatalogIndexEntry {
  id:             string
  surface:        Surface
  title:          string
  summary:        string
  /** Logical body path (skills/x.md, rules/x.md, agents/x.md). Absent for mcp. */
  body?:          string
  tags?:          string[]
  appliesWhen?:   AppliesWhen
  conflictsWith?: string[]
  requires?:      string[]
  rationale:      string
  /** Part of the ADR-017 bootstrap seed; installed by `install`, not curated. */
  seed?:          boolean
  stability:      Stability
  /** agent surface (ADR-019): tier intent, never a model id. */
  effort?:        string
  readOnly?:      boolean
  tools?:         string[]
  /** mcp surface (ADR-008): the server config block (no body). */
  server?:        Record<string, unknown>
}

/** One workspace's declared facts (ADR-020 §1). In a single-project repo the
 *  profile holds exactly one workspace whose path is the repo root. */
export interface WorkspaceProfile {
  path:          string
  languages:     string[]
  deps:          string[]
  frameworks?:   string[]
  archetype?:    string
  /** Relative paths the scan found, for `file` glob predicates. */
  files?:        string[]
  /** Content the scan recorded for `contains` predicates, keyed by file path. */
  fileContents?: Record<string, string>
  /** Free-form evidence the agent attaches; ignored by the matcher. */
  evidence?:     Record<string, unknown>
}

/** The agent→CLI boundary (ADR-017 §2): a collection of per-workspace facts. */
export interface ProjectProfile {
  root:       string
  workspaces: WorkspaceProfile[]
}

/** A catalog entry that applies, with the workspaces that justified it. */
export interface Candidate {
  id:         string
  entry:      CatalogIndexEntry
  /** Paths of the workspaces where this entry applies (ADR-020 §2). */
  workspaces: string[]
}

/** A same-workspace clash between two conflicting candidates (ADR-020 §3). */
export interface Conflict {
  workspace: string
  ids:       [string, string]
}

const REGEX_SPECIALS = new Set('\\^$.|?+()[]{}')

/** Compile a restricted glob (`*`, `**`, `**\/`) to an anchored RegExp.
 *  `**\/x` matches both `x` and `a/b/x`; `*` does not cross a path separator. */
function globToRegExp(glob: string): RegExp {
  let re = ''
  let i = 0
  while (i < glob.length) {
    const c = glob[i]
    if (c === '*') {
      if (glob[i + 1] === '*') {
        if (glob[i + 2] === '/') { re += '(?:.*/)?'; i += 3; continue }
        re += '.*'; i += 2; continue
      }
      re += '[^/]*'; i += 1; continue
    }
    re += REGEX_SPECIALS.has(c) ? '\\' + c : c
    i++
  }
  return new RegExp('^' + re + '$')
}

function matchPredicate(p: Predicate, ws: WorkspaceProfile): boolean {
  if (p.dep && !ws.deps.includes(p.dep)) return false
  if (p.lang && !ws.languages.includes(p.lang)) return false
  if (p.framework && !(ws.frameworks ?? []).includes(p.framework)) return false
  if (p.archetype && ws.archetype !== p.archetype) return false

  if (p.file) {
    const re = globToRegExp(p.file)
    const matched = (ws.files ?? []).filter(f => re.test(f))
    if (matched.length === 0) return false
    if (p.contains) {
      const contents = ws.fileContents ?? {}
      if (!matched.some(f => (contents[f] ?? '').includes(p.contains!))) return false
    }
    return true
  }

  if (p.contains) {
    const contents = Object.values(ws.fileContents ?? {})
    if (!contents.some(v => v.includes(p.contains!))) return false
  }
  return true
}

function isGroup(n: Node): n is Group {
  return 'any' in n || 'all' in n
}

function matchNode(n: Node, ws: WorkspaceProfile): boolean {
  if (isGroup(n)) {
    if (n.any) return n.any.some(m => matchNode(m, ws))
    if (n.all) return n.all.every(m => matchNode(m, ws))
    return true   // empty group → vacuously true
  }
  return matchPredicate(n, ws)
}

/** Does an entry apply to one workspace? Absent `appliesWhen` = universal. */
export function appliesToWorkspace(
  appliesWhen: AppliesWhen | undefined, ws: WorkspaceProfile,
): boolean {
  if (!appliesWhen) return true
  return matchNode(appliesWhen, ws)
}

/**
 * Filter the catalog against the profile (ADR-017/020).
 *
 * `appliesWhen` runs per workspace; candidates are unioned and each carries the
 * workspaces that justified it. Universal entries (no `appliesWhen`) attach to
 * every workspace. Conflicts are NOT resolved here — postgres and mysql both
 * legitimately apply in different workspaces and must coexist in the root union
 * (ADR-020 §3). Use `detectConflicts` for same-workspace clashes.
 */
export function suggest(
  profile: ProjectProfile, catalog: CatalogIndexEntry[],
): Candidate[] {
  const candidates: Candidate[] = []
  for (const entry of catalog) {
    if (entry.seed) continue   // the seed is laid by `install`, never curated
    const workspaces = profile.workspaces
      .filter(ws => appliesToWorkspace(entry.appliesWhen, ws))
      .map(ws => ws.path)
    if (workspaces.length > 0) {
      candidates.push({ id: entry.id, entry, workspaces })
    }
  }
  return candidates
}

/**
 * Find same-workspace conflicts among candidates (ADR-020 §3). Two candidates
 * conflict in a workspace when both apply there and one's `conflictsWith` names
 * the other. Conflicts across different workspaces are not reported — they
 * coexist in the curated union, scoped by `Applies to` (ADR-013).
 */
export function detectConflicts(candidates: Candidate[]): Conflict[] {
  const conflicts: Conflict[] = []
  const seen = new Set<string>()
  for (let i = 0; i < candidates.length; i++) {
    for (let j = i + 1; j < candidates.length; j++) {
      const a = candidates[i]
      const b = candidates[j]
      const clashes = (a.entry.conflictsWith ?? []).includes(b.id)
                   || (b.entry.conflictsWith ?? []).includes(a.id)
      if (!clashes) continue
      const shared = a.workspaces.filter(w => b.workspaces.includes(w))
      for (const workspace of shared) {
        const key = `${workspace}::${[a.id, b.id].sort().join('::')}`
        if (seen.has(key)) continue
        seen.add(key)
        conflicts.push({ workspace, ids: [a.id, b.id] })
      }
    }
  }
  return conflicts
}
