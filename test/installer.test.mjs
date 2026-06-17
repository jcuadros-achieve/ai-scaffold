import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import {
  installSeed, reconcile, readState, mapTemplatePath, applyAction,
  loadCatalogIndex, hashContent, writeState,
  SCAFFOLD_STATE_FILE, STATE_SCHEMA_VERSION,
} from '../dist/installer.js'

const tmpDirs = []
function tmpProject() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-scaffold-test-'))
  tmpDirs.push(dir)
  return dir
}
after(() => { for (const d of tmpDirs) fs.rmSync(d, { recursive: true, force: true }) })

test('mapTemplatePath maps the logical layout to install locations', () => {
  assert.equal(mapTemplatePath('CLAUDE.md'), 'CLAUDE.md')
  assert.equal(mapTemplatePath('rules/security.md'),
    path.join('.claude', 'rules', 'security.md'))
  assert.equal(mapTemplatePath('skills/workflow/verify.md'),
    path.join('.claude', 'skills', 'verify', 'SKILL.md'))
  assert.equal(mapTemplatePath('skills/debug.md'),
    path.join('.claude', 'skills', 'debug', 'SKILL.md'))
  assert.equal(mapTemplatePath('agents/code-explorer.md'),
    path.join('.claude', 'agents', 'code-explorer.md'))
  assert.equal(mapTemplatePath('context/adr/ADR-000-index.md'),
    path.join('.context', 'adr', 'ADR-000-index.md'))
})

test('installSeed lays only the seed: infra files + seed catalog entries (ADR-017 §1)', () => {
  const root = tmpProject()
  const { files, apply } = installSeed(root)

  // infra files exist
  assert.ok(fs.existsSync(path.join(root, 'CLAUDE.md')))
  assert.ok(fs.existsSync(path.join(root, '.context/INDEX.md')))
  assert.ok(fs.existsSync(path.join(root, '.context/adr/ADR-000-index.md')))

  // seed catalog entries installed (ai-init skill, context rule)
  assert.ok(fs.existsSync(path.join(root, '.claude/skills/ai-init/SKILL.md')))
  assert.ok(fs.existsSync(path.join(root, '.claude/rules/context.md')))

  // NON-seed catalog entries are NOT laid by the seed
  assert.ok(!fs.existsSync(path.join(root, '.claude/rules/security.md')))
  assert.ok(!fs.existsSync(path.join(root, '.claude/skills/verify/SKILL.md')))

  // every reported action is a create on a fresh project
  assert.ok(files.every(f => f.type === 'create'))
  assert.ok(apply.actions.every(a => a.type === 'create'))
})

test('installSeed records seed entries in id-keyed state', () => {
  const root = tmpProject()
  installSeed(root)
  const state = readState(root)
  assert.equal(state.schemaVersion, STATE_SCHEMA_VERSION)
  assert.ok(state.installed['skill/ai-init'], 'ai-init recorded')
  assert.ok(state.installed['rule/context'], 'context rule recorded')
  // non-seed entries are never recorded by the seed
  assert.ok(!state.installed['rule/security'])
  assert.ok(fs.existsSync(path.join(root, SCAFFOLD_STATE_FILE)))
})

test('installSeed is idempotent — a second run creates nothing', () => {
  const root = tmpProject()
  installSeed(root)
  const { files, apply } = installSeed(root)
  assert.ok(files.every(f => f.type === 'skip'), 'infra files skipped')
  assert.ok(apply.actions.every(a => a.type === 'skip'), 'seed entries skipped')
})

test('installed skills are valid Claude skills (SKILL.md with frontmatter)', () => {
  const root = tmpProject()
  installSeed(root)
  const aiInit = fs.readFileSync(path.join(root, '.claude/skills/ai-init/SKILL.md'), 'utf8')
  assert.match(aiInit, /^---\nname: ai-init\ndescription: .+/m)
})

test('CLAUDE.md installs as a real file', () => {
  const root = tmpProject()
  installSeed(root)
  assert.ok(fs.lstatSync(path.join(root, 'CLAUDE.md')).isFile())
})

test('a legacy CLAUDE.md symlink is replaced, not written through', () => {
  const root = tmpProject()
  fs.mkdirSync(path.join(root, '.ai'), { recursive: true })
  fs.writeFileSync(path.join(root, '.ai/AI_CONTEXT.md'), 'legacy content')
  fs.symlinkSync('.ai/AI_CONTEXT.md', path.join(root, 'CLAUDE.md'))

  // applyAction replaces the link rather than writing through it
  applyAction({ type: 'create',
    src: path.resolve('templates/CLAUDE.md'),
    dest: path.join(root, 'CLAUDE.md') })

  assert.ok(fs.lstatSync(path.join(root, 'CLAUDE.md')).isFile(), 'link replaced by real file')
  assert.equal(fs.readFileSync(path.join(root, '.ai/AI_CONTEXT.md'), 'utf8'),
    'legacy content', 'legacy target untouched')
})

test('reconcile returns [] when nothing is installed', () => {
  assert.deepEqual(reconcile(tmpProject()), [])
})

test('reconcile reports seed entries as up to date after a fresh install', () => {
  const root = tmpProject()
  installSeed(root)
  const recon = reconcile(root)
  const ctx = recon.find(r => r.id === 'rule/context')
  assert.ok(ctx, 'context rule reconciled')
  assert.equal(ctx.type, 'skip')
  assert.equal(ctx.merge, 'clean')
  assert.equal(ctx.upstreamChanged, false)
})

test('reconcile flags an upstream change as an available update (ADR-006)', () => {
  const root = tmpProject()
  installSeed(root)

  // Simulate an older base: disk still matches the recorded base, but the base
  // differs from the current template (upstream moved on).
  const dest = path.join(root, '.claude/rules/context.md')
  const oldBody = '# older context rule\n'
  fs.writeFileSync(dest, oldBody)
  const state = readState(root)
  state.installed['rule/context'].hash = hashContent(oldBody)
  writeState(root, state)

  const r = reconcile(root).find(x => x.id === 'rule/context')
  assert.equal(r.type, 'update')
  assert.equal(r.merge, 'clean')
  assert.ok(r.upstreamChanged)
})

test('reconcile flags both-changed as a conflict (ADR-006)', () => {
  const root = tmpProject()
  installSeed(root)

  const dest = path.join(root, '.claude/rules/context.md')
  fs.writeFileSync(dest, '# locally customized\n')
  const state = readState(root)
  state.installed['rule/context'].hash = hashContent('# some older base\n')
  writeState(root, state)

  const r = reconcile(root).find(x => x.id === 'rule/context')
  assert.equal(r.merge, 'conflict')
})

test('the seed never installs a non-seed catalog entry', () => {
  // Guard: only entries flagged seed:true in the index may be laid by installSeed.
  const seedIds = loadCatalogIndex().filter(e => e.seed).map(e => e.id)
  assert.deepEqual(seedIds.sort(), ['rule/context', 'skill/ai-init'])
})
