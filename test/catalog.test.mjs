import { test } from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const ROOT      = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const TEMPLATES = path.join(ROOT, 'templates')
const manifest  = JSON.parse(fs.readFileSync(path.join(ROOT, 'scaffold.manifest.json'), 'utf8'))

const HINT = 'run `node scripts/update-catalog.mjs` after changing templates/'

function walk(dir) {
  const out = []
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) out.push(...walk(full))
    else out.push(full)
  }
  return out
}

const files = walk(TEMPLATES).map(f =>
  path.relative(TEMPLATES, f).split(path.sep).join('/'))
const entries = manifest.templates ?? []
const byPath  = new Map(entries.map(t => [t.path, t]))

test('every template file has a catalog entry, and vice versa', () => {
  const missing = files.filter(f => !byPath.has(f))
  const stale   = entries.filter(t => !files.includes(t.path)).map(t => t.path)
  assert.deepEqual(missing, [], `uncataloged files (${HINT})`)
  assert.deepEqual(stale, [], `catalog entries without files (${HINT})`)
})

test('every catalog hash matches the file content', () => {
  for (const t of entries) {
    const actual = 'sha256:' + crypto.createHash('sha256')
      .update(fs.readFileSync(path.join(TEMPLATES, t.path)))
      .digest('hex')
    assert.equal(actual, t.hash, `${t.path} changed without a catalog bump (${HINT})`)
  }
})

test('catalog entries are well-formed', () => {
  for (const t of entries) {
    assert.match(t.version, /^\d+\.\d+\.\d+$/, `${t.path} version`)
    assert.match(t.updated, /^\d{4}-\d{2}-\d{2}$/, `${t.path} updated`)
    assert.ok(['skill', 'rule', 'context', 'root'].includes(t.kind), `${t.path} kind`)
    assert.ok(Array.isArray(t.tags), `${t.path} tags`)
  }
})

test('every skill template declares a valid tier (ADR-005)', () => {
  for (const f of files.filter(f => f.startsWith('skills/'))) {
    const content = fs.readFileSync(path.join(TEMPLATES, f), 'utf8')
    const tier = content.match(/^---\n[\s\S]*?^tier:\s*(\S+)$[\s\S]*?\n---/m)?.[1]
    assert.ok(tier === 'fast' || tier === 'deep',
      `${f} must declare tier: fast | deep (got: ${tier})`)
  }
})

test('no model IDs anywhere in the payload (ADR-005)', () => {
  for (const f of files) {
    const content = fs.readFileSync(path.join(TEMPLATES, f), 'utf8')
    assert.ok(!/claude-(opus|sonnet|haiku|fable)|gpt-\d|gemini-/i.test(content),
      `${f} contains a model ID — declare a tier instead`)
  }
})

test('module membership lives in optional[].paths, not duplicated in the catalog', () => {
  for (const t of entries) {
    assert.ok(!('module' in t) && !('scope' in t),
      `${t.path} duplicates module membership into the catalog`)
  }
})
