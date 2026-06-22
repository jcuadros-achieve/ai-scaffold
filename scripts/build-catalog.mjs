#!/usr/bin/env node
/**
 * Compile catalog entry frontmatter into catalog.index.json (ADR-018 §1).
 *
 * Each catalog entry carries its metadata as frontmatter next to its body:
 *   - skills / rules / agents → `.md` with a YAML frontmatter envelope
 *     (id, surface, title, summary, tags, appliesWhen, conflictsWith,
 *      requires, rationale, stability, seed, and agent-only effort/readOnly/tools)
 *   - mcp servers (no body)   → a small JSON file under templates/mcp/
 *
 * This dev build joins all of them into a single shippable index. Per-entry
 * `version` is the fine update signal (replaces the coarse SCAFFOLD_VERSION,
 * ADR-018 §7): patch-bumped when the body hash changes, like update-catalog.mjs.
 *
 * Run after ANY change to an entry's frontmatter or body.
 * test/catalog-index.test.mjs fails the suite when the index drifts.
 * Never hand-edit catalog.index.json.
 */
import crypto from 'crypto'
import fs     from 'fs'
import path   from 'path'
import yaml   from 'js-yaml'

const ROOT      = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')
const TEMPLATES = path.join(ROOT, 'templates')
const INDEX     = path.join(ROOT, 'catalog.index.json')
const TODAY     = new Date().toISOString().slice(0, 10)

function walk(dir) {
  const out = []
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) out.push(...walk(full))
    else out.push(full)
  }
  return out
}

const logical = file => path.relative(TEMPLATES, file).split(path.sep).join('/')
const sha     = buf  => 'sha256:' + crypto.createHash('sha256').update(buf).digest('hex')
const bump    = v    => {
  if (!v) return '1.0.0'
  const [a, b, c] = v.split('.').map(Number)
  return `${a}.${b}.${c + 1}`
}

function parseFrontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---/)
  if (!m) return null
  try { return yaml.load(m[1]) } catch { return null }
}

// Previous index → preserve version/date when the body hash is unchanged.
const prev = {}
if (fs.existsSync(INDEX)) {
  try {
    for (const e of JSON.parse(fs.readFileSync(INDEX, 'utf8')).entries ?? []) prev[e.id] = e
  } catch { /* regenerate from scratch */ }
}

/** Stamp version/updated/hash, preserving prior values on an unchanged body. */
function stamp(entry, hash) {
  const p = prev[entry.id]
  const unchanged = p && p.hash === hash
  return {
    ...entry,
    version: unchanged ? p.version : bump(p?.version),
    updated: unchanged ? p.updated : TODAY,
    hash,
  }
}

const entries = []

// --- .md entries (skills, rules, agents) --------------------------------------
for (const file of walk(TEMPLATES).filter(f => f.endsWith('.md'))) {
  const text = fs.readFileSync(file, 'utf8')
  const fm = parseFrontmatter(text)
  if (!fm || !fm.id || !fm.surface) continue   // not a catalog entry

  const entry = {
    id:        fm.id,
    surface:   fm.surface,
    title:     fm.title ?? fm.name ?? fm.id,
    summary:   fm.summary ?? fm.description ?? '',
    body:      logical(file),
    tags:      fm.tags ?? [],
    rationale: fm.rationale ?? '',
    stability: fm.stability ?? 'stable',
  }
  if (fm.appliesWhen)   entry.appliesWhen   = fm.appliesWhen
  if (fm.conflictsWith) entry.conflictsWith = fm.conflictsWith
  if (fm.requires)      entry.requires      = fm.requires
  if (fm.seed)          entry.seed          = true
  if (fm.surface === 'agent') {
    if (fm.effort)            entry.effort   = fm.effort
    if (fm.readOnly !== undefined) entry.readOnly = fm.readOnly
    if (fm.tools)             entry.tools    = fm.tools
  }
  entries.push(stamp(entry, sha(text)))
}

// --- mcp entries (no body; a JSON file under templates/mcp/) -------------------
const mcpDir = path.join(TEMPLATES, 'mcp')
if (fs.existsSync(mcpDir)) {
  for (const file of walk(mcpDir).filter(f => f.endsWith('.json'))) {
    const raw = fs.readFileSync(file, 'utf8')
    const fm  = JSON.parse(raw)
    if (!fm.id || fm.surface !== 'mcp') continue
    const entry = {
      id:        fm.id,
      surface:   'mcp',
      title:     fm.title ?? fm.id,
      summary:   fm.summary ?? '',
      tags:      fm.tags ?? [],
      rationale: fm.rationale ?? '',
      stability: fm.stability ?? 'stable',
      server:    fm.server,
    }
    if (fm.appliesWhen) entry.appliesWhen = fm.appliesWhen
    entries.push(stamp(entry, sha(raw)))
  }
}

entries.sort((a, b) => a.id.localeCompare(b.id))
fs.writeFileSync(INDEX, JSON.stringify({ schemaVersion: 1, entries }, null, 2) + '\n')
console.log(`catalog.index.json: ${entries.length} entries`)
