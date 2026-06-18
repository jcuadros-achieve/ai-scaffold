import { test } from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import yaml from 'js-yaml'

const ROOT      = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const TEMPLATES = path.join(ROOT, 'templates')
const INDEX     = path.join(ROOT, 'catalog.index.json')
const HINT      = 'run `node scripts/build-catalog.mjs` after changing an entry'
const MODEL_ID  = /claude-(opus|sonnet|haiku|fable)|gpt-\d|gemini-/i

const index   = JSON.parse(fs.readFileSync(INDEX, 'utf8'))
const entries = index.entries ?? []
const byId    = new Map(entries.map(e => [e.id, e]))

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
const sha = buf => 'sha256:' + crypto.createHash('sha256').update(buf).digest('hex')
function frontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---/)
  if (!m) return null
  try { return yaml.load(m[1]) } catch { return null }
}

test('the index is non-empty and well-formed (ADR-018 §6)', () => {
  assert.ok(entries.length > 0, 'catalog.index.json has entries')
  for (const e of entries) {
    assert.ok(typeof e.id === 'string' && e.id.length, 'entry has id')
    assert.ok(['skill', 'rule', 'agent', 'mcp'].includes(e.surface), `${e.id} surface`)
    assert.ok(typeof e.rationale === 'string' && e.rationale.length, `${e.id} needs a rationale`)
    assert.ok(['stable', 'experimental'].includes(e.stability), `${e.id} stability`)
    assert.ok(typeof e.title === 'string' && e.title.length, `${e.id} title`)
    assert.ok(typeof e.summary === 'string' && e.summary.length, `${e.id} summary`)
    if (e.surface === 'mcp') assert.ok(e.server, `${e.id} (mcp) needs a server block`)
    else assert.ok(typeof e.body === 'string' && e.body.length, `${e.id} needs a body`)
  }
})

test('entry ids are namespaced by surface and unique', () => {
  const ids = entries.map(e => e.id)
  assert.equal(new Set(ids).size, ids.length, 'no duplicate ids')
  for (const e of entries) {
    assert.ok(e.id.startsWith(`${e.surface}/`), `${e.id} should be namespaced ${e.surface}/…`)
  }
})

test('index drift: every entry-file is indexed with a matching body hash', () => {
  // Every templates .md that declares id+surface frontmatter is in the index…
  for (const file of walk(TEMPLATES).filter(f => f.endsWith('.md'))) {
    const text = fs.readFileSync(file, 'utf8')
    const fm = frontmatter(text)
    if (!fm || !fm.id || !fm.surface) continue
    const e = byId.get(fm.id)
    assert.ok(e, `${fm.id} declared in ${path.relative(ROOT, file)} but missing from the index (${HINT})`)
    assert.equal(e.hash, sha(text), `${fm.id} body changed without a rebuild (${HINT})`)
    assert.equal(e.body, path.relative(TEMPLATES, file).split(path.sep).join('/'), `${fm.id} body path`)
  }
  // …and every non-mcp index entry's body file exists.
  for (const e of entries) {
    if (e.surface === 'mcp') continue
    assert.ok(fs.existsSync(path.join(TEMPLATES, e.body)), `${e.id} body file missing: ${e.body}`)
  }
})

test('agent entries declare effort/tier (never a model id) and a readOnly flag (ADR-019, ADR-021)', () => {
  for (const e of entries.filter(e => e.surface === 'agent')) {
    assert.ok(e.effort, `${e.id} agent must declare effort`)
    assert.ok(!MODEL_ID.test(String(e.effort)), `${e.id} effort is a model id — declare a tier`)
    assert.ok(typeof e.readOnly === 'boolean', `${e.id} agent must declare readOnly: true | false`)
    // Read-only agents keep the ADR-019 tool set; writer agents (readOnly:false,
    // ADR-021) must carry Edit/Write and be marked experimental while unproven.
    const tools = new Set(e.tools ?? [])
    if (e.readOnly === true) {
      assert.ok(!tools.has('Edit') && !tools.has('Write'),
        `${e.id} is readOnly:true but declares a write tool — drop Edit/Write or set readOnly:false`)
    } else {
      assert.ok(tools.has('Edit') && tools.has('Write'),
        `${e.id} is readOnly:false but lacks Edit/Write — a writer needs the write tools`)
      assert.equal(e.stability, 'experimental',
        `${e.id} is a writer (readOnly:false) and must be stability: experimental until proven`)
    }
  }
})

test('mcp entries carry no credential-shaped env values (ADR-008)', () => {
  const CRED = /(sk-|ghp_|xox[baprs]-|AKIA|-----BEGIN|eyJ[A-Za-z0-9_-]{10,}\.)/
  for (const e of entries.filter(e => e.surface === 'mcp')) {
    const env = (e.server && e.server.env) || {}
    for (const [k, v] of Object.entries(env)) {
      assert.ok(!CRED.test(String(v)), `${e.id} env.${k} looks like a credential`)
    }
  }
})

test('conflictsWith and requires reference existing entries', () => {
  for (const e of entries) {
    for (const ref of [...(e.conflictsWith ?? []), ...(e.requires ?? [])]) {
      assert.ok(byId.has(ref), `${e.id} references unknown entry ${ref}`)
    }
  }
})

test('appliesWhen-bearing entries exist and universal entries are allowed', () => {
  assert.ok(entries.some(e => e.appliesWhen), 'at least one filtered entry')
  assert.ok(entries.some(e => !e.appliesWhen && e.surface !== 'mcp'), 'at least one universal entry')
})
