import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Guard against the silent-skip class of bug: build-catalog.mjs drops any entry
// whose frontmatter fails to YAML-parse (e.g. an unquoted value containing ": "
// — this bit incident.md and code-explorer). The drift test in
// catalog-index.test.mjs relies on yaml.load too, so it shares the blind spot.
// Here we detect "looks like a catalog entry but is missing from the index"
// WITHOUT parsing YAML — by scanning the raw frontmatter for surface/id lines.
const ROOT      = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const TEMPLATES = path.join(ROOT, 'templates')
const HINT      = 'an unquoted frontmatter value with ": " breaks YAML and build-catalog drops the entry — quote it'

const index = JSON.parse(fs.readFileSync(path.join(ROOT, 'catalog.index.json'), 'utf8'))
const ids   = new Set((index.entries ?? []).map(e => e.id))

function walk(dir) {
  if (!fs.existsSync(dir)) return []
  const out = []
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) out.push(...walk(full))
    else out.push(full)
  }
  return out
}

function rawFrontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---/)
  return m ? m[1] : null
}

test('every .md that declares a catalog surface is in the index (parse-failure guard)', () => {
  for (const file of walk(TEMPLATES).filter(f => f.endsWith('.md'))) {
    const fm = rawFrontmatter(fs.readFileSync(file, 'utf8'))
    if (!fm) continue
    if (!/^surface:\s*(skill|rule|agent)\s*$/m.test(fm)) continue   // not a catalog entry
    const id = fm.match(/^id:\s*(\S+)\s*$/m)?.[1]
    assert.ok(id, `${path.relative(ROOT, file)} declares a surface but no parseable id line`)
    assert.ok(ids.has(id), `${id} (${path.relative(ROOT, file)}) is missing from the index — ${HINT}`)
  }
})

test('every mcp/*.json is in the index (parse-failure guard)', () => {
  for (const file of walk(path.join(TEMPLATES, 'mcp')).filter(f => f.endsWith('.json'))) {
    const id = JSON.parse(fs.readFileSync(file, 'utf8')).id
    assert.ok(ids.has(id), `${id} (${path.relative(ROOT, file)}) is missing from the index`)
  }
})
