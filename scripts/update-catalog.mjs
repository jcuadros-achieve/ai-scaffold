#!/usr/bin/env node
/**
 * Maintain the `templates` catalog in scaffold.manifest.json (ADR-007).
 *
 * Walks templates/, then:
 *   - adds entries for new files          (version 1.0.0, today, hash)
 *   - bumps patch + date + hash           for files whose content changed
 *   - drops entries                       for files that no longer exist
 *
 * Run after ANY change under templates/. test/catalog.test.mjs fails the
 * suite when the catalog drifts, so forgetting this script breaks `npm test`.
 * Never hand-edit the `templates` entries.
 */
import crypto from 'crypto'
import fs   from 'fs'
import path from 'path'

const ROOT      = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')
const TEMPLATES = path.join(ROOT, 'templates')
const MANIFEST  = path.join(ROOT, 'scaffold.manifest.json')

function walk(dir) {
  const out = []
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) out.push(...walk(full))
    else out.push(full)
  }
  return out
}

function sha256(file) {
  return 'sha256:' + crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
}

function kindOf(rel) {
  if (rel.startsWith('skills/'))  return 'skill'
  if (rel.startsWith('rules/'))   return 'rule'
  if (rel.startsWith('context/')) return 'context'
  return 'root'
}

function tagsOf(rel, modulesByPath) {
  const tags = []
  if (rel.startsWith('skills/workflow/')) tags.push('workflow')
  if (rel.startsWith('skills/context/'))  tags.push('context-chain')
  const mod = modulesByPath.get(rel)
  if (mod) tags.push(mod)
  return tags
}

function bumpPatch(version) {
  const [maj, min, pat] = version.split('.').map(Number)
  return `${maj}.${min}.${pat + 1}`
}

/** install-once vs base-aware reconcile (ADR-017). seed = the project owns the
 *  content after ai-init (CLAUDE.md, rules) and `update` never reconciles it;
 *  reconcile = three-way base-aware update (ADR-006). Skills/context are
 *  reconcile. This is the single source of the seed/reconcile decision. */
function trackOf(rel) {
  if (rel === 'CLAUDE.md') return 'seed'
  if (rel.startsWith('rules/')) return 'seed'
  return 'reconcile'
}

/** The coarse payload version, read from its single source in installer.ts. */
function readScaffoldVersion() {
  const src = fs.readFileSync(path.join(ROOT, 'src/installer.ts'), 'utf8')
  return src.match(/SCAFFOLD_VERSION\s*=\s*'([^']+)'/)?.[1] ?? '0.0.0'
}

const today    = new Date().toISOString().slice(0, 10)
const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'))
const byPath   = new Map((manifest.templates ?? []).map(t => [t.path, t]))

const modulesByPath = new Map()
for (const mod of manifest.optional ?? []) {
  for (const p of mod.paths) modulesByPath.set(p, mod.id)
}

const seen    = new Set()
const changes = { added: [], updated: [], removed: [] }

for (const file of walk(TEMPLATES)) {
  const rel  = path.relative(TEMPLATES, file).split(path.sep).join('/')
  const hash = sha256(file)
  seen.add(rel)

  const entry = byPath.get(rel)
  if (!entry) {
    byPath.set(rel, { path: rel, kind: kindOf(rel), version: '1.0.0',
      updated: today, hash, tags: tagsOf(rel, modulesByPath), track: trackOf(rel) })
    changes.added.push(rel)
  } else if (entry.hash !== hash) {
    entry.version = bumpPatch(entry.version)
    entry.updated = today
    entry.hash    = hash
    changes.updated.push(rel)
  }
}

for (const rel of [...byPath.keys()]) {
  if (!seen.has(rel)) {
    byPath.delete(rel)
    changes.removed.push(rel)
  }
}

// Backfill / refresh the track mode on every entry (ADR-017): trackOf is the
// single source, so re-deriving it here keeps the catalog authoritative even
// for entries that existed before the field, without touching version/hash.
for (const entry of byPath.values()) entry.track = trackOf(entry.path)

manifest.templates = [...byPath.values()].sort((a, b) => a.path.localeCompare(b.path))

const total = changes.added.length + changes.updated.length + changes.removed.length

// Record this release's file changes under the current SCAFFOLD_VERSION (ADR-017).
// Merged, not replaced, so repeated runs while developing one release accumulate.
if (total > 0) {
  const version  = readScaffoldVersion()
  const log      = manifest.changelog ?? {}
  const entry    = log[version] ?? { date: today, changes: [] }
  const byPathCl = new Map(entry.changes.map(c => [c.path, c]))
  const upsert   = (rel, kind) => byPathCl.set(rel, { path: rel, kind, track: trackOf(rel) })

  for (const rel of changes.added)   upsert(rel, 'added')
  for (const rel of changes.updated) if (byPathCl.get(rel)?.kind !== 'added') upsert(rel, 'modified')
  for (const rel of changes.removed) upsert(rel, 'removed')

  entry.date    = today
  entry.changes = [...byPathCl.values()].sort((a, b) => a.path.localeCompare(b.path))
  log[version]  = entry
  manifest.changelog = log
}

fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n')

if (total === 0) {
  console.log('Catalog up to date.')
} else {
  for (const r of changes.added)   console.log(`  added    ${r}`)
  for (const r of changes.updated) console.log(`  updated  ${r} → ${byPath.get(r).version}`)
  for (const r of changes.removed) console.log(`  removed  ${r}`)
  console.log(`${manifest.templates.length} entries.`)
}
