import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import {
  planInstall, applyAction, writeVersionFile, readVersionFile,
  readInstalledSelection, loadManifest, SCAFFOLD_VERSION, SCAFFOLD_VERSION_FILE,
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

test('loadManifest returns the optional modules with their paths', () => {
  const modules = loadManifest()
  assert.ok(modules.length > 0)
  const ids = modules.map(m => m.id)
  assert.ok(ids.includes('migration'))
  assert.ok(ids.includes('observability'))
  for (const m of modules) {
    assert.ok(Array.isArray(m.paths) && m.paths.length > 0, `${m.id} has paths`)
  }
})

test('fresh core-only plan creates everything except optional-module paths', () => {
  const root = tmpProject()
  const actions = planInstall(root, [])

  assert.ok(actions.every(a => a.type === 'create' || a.type === 'symlink'))

  const dests = destsOf(actions)
  for (const mod of loadManifest()) {
    for (const rel of mod.paths) {
      assert.ok(!dests.has(path.join(root, rel)), `${rel} must be excluded core-only`)
    }
  }

  const symlinks = actions.filter(a => a.type === 'symlink')
  assert.deepEqual(
    symlinks.map(a => path.relative(root, a.dest)).sort(),
    ['.cursorrules', 'CLAUDE.md'],
  )
})

test('selecting a module includes its paths; unselected modules stay excluded', () => {
  const root = tmpProject()
  const dests = destsOf(planInstall(root, ['observability']))

  assert.ok(dests.has(path.join(root, '.ai/rules/observability.md')))
  assert.ok(!dests.has(path.join(root, '.ai/skills/migration.md')))
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

  const target = path.join(root, '.ai/AI_CONTEXT.md')
  fs.appendFileSync(target, '\nlocal customization\n')

  const updates = planInstall(root, []).filter(a => a.type === 'update')
  assert.equal(updates.length, 1)
  assert.equal(updates[0].dest, target)
  assert.ok(typeof updates[0].diff === 'string' && updates[0].diff.length > 0)
})

test('symlink actions point CLAUDE.md and .cursorrules at .ai/AI_CONTEXT.md', () => {
  const root = tmpProject()
  planInstall(root, []).forEach(applyAction)

  for (const link of ['CLAUDE.md', '.cursorrules']) {
    const p = path.join(root, link)
    assert.ok(fs.lstatSync(p).isSymbolicLink(), `${link} is a symlink`)
    assert.equal(fs.readlinkSync(p), '.ai/AI_CONTEXT.md')
  }
})

test('version file round-trips version and module selection', () => {
  const root = tmpProject()
  writeVersionFile(root, ['observability', 'incident'])

  assert.equal(readVersionFile(root), SCAFFOLD_VERSION)
  assert.deepEqual(readInstalledSelection(root), ['observability', 'incident'])
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

test('a pre-optional-modules version file reads as core-only selection', () => {
  const root = tmpProject()
  const p = path.join(root, SCAFFOLD_VERSION_FILE)
  fs.mkdirSync(path.dirname(p), { recursive: true })
  fs.writeFileSync(p, JSON.stringify({ version: '1.0.0', installedAt: 'x' }))

  assert.equal(readVersionFile(root), '1.0.0')
  assert.deepEqual(readInstalledSelection(root), [])
})
