import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import {
  planInstall, applyAction, writeVersionFile, readVersionFile,
  readInstalledSelection, loadManifest, mapTemplatePath,
  SCAFFOLD_VERSION, SCAFFOLD_VERSION_FILE, LEGACY_VERSION_FILE,
} from '../dist/installer.js'

const tmpDirs = []
function tmpProject() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-scaffold-test-'))
  tmpDirs.push(dir)
  return dir
}
after(() => { for (const d of tmpDirs) fs.rmSync(d, { recursive: true, force: true }) })

function destsOf(actions) {
  return new Set(actions.map(a => a.dest))
}

test('loadManifest returns the optional modules with logical paths', () => {
  const modules = loadManifest()
  assert.ok(modules.length > 0)
  const ids = modules.map(m => m.id)
  assert.ok(ids.includes('migration'))
  assert.ok(ids.includes('observability'))
  for (const m of modules) {
    assert.ok(Array.isArray(m.paths) && m.paths.length > 0, `${m.id} has paths`)
    for (const p of m.paths) {
      assert.ok(/^(skills|rules|context)\//.test(p), `${p} is a logical template path`)
    }
  }
})

test('mapTemplatePath maps the logical layout to install locations', () => {
  assert.equal(mapTemplatePath('CLAUDE.md'), 'CLAUDE.md')
  assert.equal(mapTemplatePath('rules/security.md'),
    path.join('.claude', 'rules', 'security.md'))
  assert.equal(mapTemplatePath('skills/workflow/verify.md'),
    path.join('.claude', 'skills', 'verify', 'SKILL.md'))
  assert.equal(mapTemplatePath('skills/debug.md'),
    path.join('.claude', 'skills', 'debug', 'SKILL.md'))
  assert.equal(mapTemplatePath('context/adr/ADR-000-index.md'),
    path.join('.context', 'adr', 'ADR-000-index.md'))
})

test('fresh core-only plan creates mapped + generated files, no optional paths', () => {
  const root = tmpProject()
  const actions = planInstall(root, [])

  assert.ok(actions.every(a => a.type === 'create' || a.type === 'symlink'))

  const dests = destsOf(actions)
  assert.ok(dests.has(path.join(root, 'CLAUDE.md')))
  assert.ok(dests.has(path.join(root, '.claude/rules/code-style.md')))
  assert.ok(dests.has(path.join(root, '.claude/skills/verify/SKILL.md')))
  assert.ok(dests.has(path.join(root, '.context/INDEX.md')))
  assert.ok(dests.has(path.join(root, '.github/copilot-instructions.md')))
  assert.ok(dests.has(path.join(root, '.cursor/rules/ai-scaffold.mdc')))

  for (const mod of loadManifest()) {
    for (const rel of mod.paths) {
      assert.ok(!dests.has(path.join(root, mapTemplatePath(rel))),
        `${rel} must be excluded core-only`)
    }
  }

  const symlinks = actions.filter(a => a.type === 'symlink')
  assert.deepEqual(symlinks.map(a => path.relative(root, a.dest)), ['.cursorrules'])
})

test('selecting a module includes its paths; unselected modules stay excluded', () => {
  const root = tmpProject()
  const dests = destsOf(planInstall(root, ['observability']))

  assert.ok(dests.has(path.join(root, '.claude/rules/observability.md')))
  assert.ok(!dests.has(path.join(root, '.claude/skills/migration/SKILL.md')))
})

test('generated files list only the selected skills', () => {
  const root = tmpProject()
  const cursorOf = (selected) => planInstall(root, selected)
    .find(a => a.dest.endsWith('ai-scaffold.mdc')).content

  assert.ok(!cursorOf([]).includes('`migration`'))
  assert.ok(cursorOf(['migration']).includes('.claude/skills/migration/SKILL.md'))
  assert.ok(cursorOf([]).includes('.claude/skills/verify/SKILL.md'))
})

test('installed skills are valid Claude skills (SKILL.md with frontmatter)', () => {
  const root = tmpProject()
  planInstall(root, []).forEach(applyAction)

  const verify = fs.readFileSync(path.join(root, '.claude/skills/verify/SKILL.md'), 'utf8')
  assert.match(verify, /^---\nname: verify\ndescription: .+/m)
})

test('applying a plan then re-planning yields only skips', () => {
  const root = tmpProject()
  planInstall(root, []).forEach(applyAction)

  const again = planInstall(root, [])
  assert.ok(again.length > 0)
  assert.ok(again.every(a => a.type === 'skip'))
})

test('a locally modified file is re-planned as update with a diff', () => {
  const root = tmpProject()
  planInstall(root, []).forEach(applyAction)

  const target = path.join(root, 'CLAUDE.md')
  fs.appendFileSync(target, '\nlocal customization\n')

  const updates = planInstall(root, []).filter(a => a.type === 'update')
  assert.equal(updates.length, 1)
  assert.equal(updates[0].dest, target)
  assert.ok(typeof updates[0].diff === 'string' && updates[0].diff.length > 0)
})

test('.cursorrules is a symlink to CLAUDE.md; CLAUDE.md is a real file', () => {
  const root = tmpProject()
  planInstall(root, []).forEach(applyAction)

  const link = path.join(root, '.cursorrules')
  assert.ok(fs.lstatSync(link).isSymbolicLink())
  assert.equal(fs.readlinkSync(link), 'CLAUDE.md')
  assert.ok(fs.lstatSync(path.join(root, 'CLAUDE.md')).isFile())
})

test('a legacy CLAUDE.md symlink is replaced, not written through', () => {
  const root = tmpProject()
  fs.mkdirSync(path.join(root, '.ai'), { recursive: true })
  fs.writeFileSync(path.join(root, '.ai/AI_CONTEXT.md'), 'legacy content')
  fs.symlinkSync('.ai/AI_CONTEXT.md', path.join(root, 'CLAUDE.md'))

  const action = planInstall(root, []).find(
    a => a.dest === path.join(root, 'CLAUDE.md'))
  applyAction(action)

  assert.ok(fs.lstatSync(path.join(root, 'CLAUDE.md')).isFile(), 'link replaced by real file')
  assert.equal(fs.readFileSync(path.join(root, '.ai/AI_CONTEXT.md'), 'utf8'),
    'legacy content', 'legacy target untouched')
})

test('version file round-trips version and module selection at the new location', () => {
  const root = tmpProject()
  writeVersionFile(root, ['observability', 'incident'])

  assert.ok(fs.existsSync(path.join(root, SCAFFOLD_VERSION_FILE)))
  assert.equal(readVersionFile(root), SCAFFOLD_VERSION)
  assert.deepEqual(readInstalledSelection(root), ['observability', 'incident'])
})

test('a legacy .ai/.scaffold-version is still readable', () => {
  const root = tmpProject()
  const p = path.join(root, LEGACY_VERSION_FILE)
  fs.mkdirSync(path.dirname(p), { recursive: true })
  fs.writeFileSync(p, JSON.stringify({ version: '1.5.0', optional: ['migration'] }))

  assert.equal(readVersionFile(root), '1.5.0')
  assert.deepEqual(readInstalledSelection(root), ['migration'])
})

test('version helpers return null when not installed', () => {
  const root = tmpProject()
  assert.equal(readVersionFile(root), null)
  assert.equal(readInstalledSelection(root), null)
})

test('version helpers tolerate a corrupted version file', () => {
  const root = tmpProject()
  const p = path.join(root, SCAFFOLD_VERSION_FILE)
  fs.mkdirSync(path.dirname(p), { recursive: true })
  fs.writeFileSync(p, 'not json{{')

  assert.equal(readVersionFile(root), null)
  assert.equal(readInstalledSelection(root), null)
})

test('a version file without the optional field reads as core-only selection', () => {
  const root = tmpProject()
  const p = path.join(root, SCAFFOLD_VERSION_FILE)
  fs.mkdirSync(path.dirname(p), { recursive: true })
  fs.writeFileSync(p, JSON.stringify({ version: '1.0.0', installedAt: 'x' }))

  assert.equal(readVersionFile(root), '1.0.0')
  assert.deepEqual(readInstalledSelection(root), [])
})
