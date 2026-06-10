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
      updated: today, hash, tags: tagsOf(rel, modulesByPath) })
    changes.added.push(rel)
  } else if (entry.hash !== hash) {
    entry.version = bumpPatch(entry.version)
    entry.updated = today
    entry.hash    = hash
    changes.updated.push(`${rel} → ${entry.version}`)
  }
}

for (const rel of [...byPath.keys()]) {
  if (!seen.has(rel)) {
    byPath.delete(rel)
    changes.removed.push(rel)
  }
}

manifest.templates = [...byPath.values()].sort((a, b) => a.path.localeCompare(b.path))
fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n')

const total = changes.added.length + changes.updated.length + changes.removed.length
if (total === 0) {
  console.log('Catalog up to date.')
} else {
  for (const r of changes.added)   console.log(`  added    ${r}`)
  for (const r of changes.updated) console.log(`  updated  ${r}`)
  for (const r of changes.removed) console.log(`  removed  ${r}`)
  console.log(`${manifest.templates.length} entries.`)
}
