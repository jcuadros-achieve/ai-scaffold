import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Payload-wide invariants that survive the catalog redesign (formerly in
// catalog.test.mjs). These cover the shipped templates regardless of how the
// catalog index is compiled.
const ROOT      = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const TEMPLATES = path.join(ROOT, 'templates')

function walk(dir) {
  const out = []
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) out.push(...walk(full))
    else out.push(full)
  }
  return out
}

const files = walk(TEMPLATES).map(f => path.relative(TEMPLATES, f).split(path.sep).join('/'))

test('every skill template declares a valid tier (ADR-005)', () => {
  for (const f of files.filter(f => f.startsWith('skills/') && f.endsWith('.md'))) {
    const content = fs.readFileSync(path.join(TEMPLATES, f), 'utf8')
    const tier = content.match(/^---\n[\s\S]*?^tier:\s*(\S+)$[\s\S]*?\n---/m)?.[1]
    assert.ok(tier === 'fast' || tier === 'deep',
      `${f} must declare tier: fast | deep (got: ${tier})`)
  }
})

test('every skill template carries its help card (ADR-016)', () => {
  for (const f of files.filter(f => f.startsWith('skills/') && f.endsWith('.md'))) {
    const name = path.basename(f, '.md')
    const content = fs.readFileSync(path.join(TEMPLATES, f), 'utf8')
    assert.ok(content.includes(`> **\`/${name} help\`**`),
      `${f} must open with its help card (\`/${name} help\` — ADR-016)`)
  }
})

test('no model IDs anywhere in the payload (ADR-005)', () => {
  for (const f of files) {
    const content = fs.readFileSync(path.join(TEMPLATES, f), 'utf8')
    assert.ok(!/claude-(opus|sonnet|haiku|fable)|gpt-\d|gemini-/i.test(content),
      `${f} contains a model ID — declare a tier instead`)
  }
})
