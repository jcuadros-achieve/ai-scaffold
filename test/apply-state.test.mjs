import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import {
  apply, readState, writeState, hashContent, mapTemplatePath,
  SCAFFOLD_STATE_FILE, STATE_SCHEMA_VERSION,
} from '../dist/installer.js'

const tmpDirs = []
function tmpProject() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-scaffold-state-'))
  tmpDirs.push(dir)
  return dir
}
after(() => { for (const d of tmpDirs) fs.rmSync(d, { recursive: true, force: true }) })

// A body-bearing entry whose body is a real template file, so apply can read it.
function bodyEntry(id, body, surface = 'skill') {
  const src = path.resolve('templates', body)
  const text = fs.readFileSync(src, 'utf8')
  return {
    entry: {
      id, surface, body,
      title: id, summary: '', rationale: 'test', stability: 'stable',
      version: '1.0.0', hash: hashContent(text),
    },
    workspaces: ['.'],
  }
}

function readDest(root, body) {
  return fs.readFileSync(path.join(root, mapTemplatePath(body)), 'utf8')
}

test('readState returns null when no state file exists', () => {
  assert.equal(readState(tmpProject()), null)
})

test('apply creates files, writes id-keyed state, and reports create actions', () => {
  const root = tmpProject()
  const item = bodyEntry('skill/verify', 'skills/workflow/verify.md')
  const result = apply(root, [item])

  // file written to its install location
  const installed = readDest(root, 'skills/workflow/verify.md')
  assert.ok(installed.includes('# Skill: verify'))

  // action reported
  assert.equal(result.actions.length, 1)
  assert.equal(result.actions[0].id, 'skill/verify')
  assert.equal(result.actions[0].type, 'create')
  assert.equal(result.actions[0].merge, 'clean')

  // state persisted, keyed by id (not path)
  const state = readState(root)
  assert.equal(state.schemaVersion, STATE_SCHEMA_VERSION)
  assert.ok(state.installed['skill/verify'])
  assert.equal(state.installed['skill/verify'].version, '1.0.0')
  assert.equal(state.installed['skill/verify'].hash, item.entry.hash)
  assert.deepEqual(state.installed['skill/verify'].workspaces, ['.'])

  // the state file lives at the documented path
  assert.ok(fs.existsSync(path.join(root, SCAFFOLD_STATE_FILE)))
})

test('re-apply of an unchanged entry skips (identical) and stays clean', () => {
  const root = tmpProject()
  const item = bodyEntry('skill/verify', 'skills/workflow/verify.md')
  apply(root, [item])
  const result = apply(root, [item])
  assert.equal(result.actions[0].type, 'skip')
  assert.equal(result.actions[0].merge, 'clean')
})

test('a locally-customized entry with unchanged upstream is skipped as customized', () => {
  const root = tmpProject()
  const item = bodyEntry('skill/verify', 'skills/workflow/verify.md')
  apply(root, [item])

  // user edits the installed file; upstream (same item) is unchanged
  const dest = path.join(root, mapTemplatePath('skills/workflow/verify.md'))
  fs.writeFileSync(dest, '# my local edits\n')

  const result = apply(root, [item])
  assert.equal(result.actions[0].type, 'skip')
  assert.equal(result.actions[0].merge, 'customized')
  // the user's edit is preserved
  assert.equal(fs.readFileSync(dest, 'utf8'), '# my local edits\n')
})

test('both-changed is a conflict and is never auto-applied', () => {
  const root = tmpProject()
  const body = 'skills/workflow/verify.md'
  const item = bodyEntry('skill/verify', body)
  const dest = path.join(root, mapTemplatePath(body))

  // base = some older upstream; disk has local drift away from it; the incoming
  // template differs from base too → both changed.
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.writeFileSync(dest, '# my local edits\n')
  writeState(root, {
    schemaVersion: STATE_SCHEMA_VERSION,
    installedAt: new Date(0).toISOString(),
    installed: { 'skill/verify':
      { version: '0.9.0', hash: hashContent('# old upstream\n'), merge: 'clean', workspaces: ['.'] } },
  })

  const result = apply(root, [item])
  assert.equal(result.actions[0].type, 'skip')
  assert.equal(result.actions[0].merge, 'conflict')
  // conflict is not overwritten
  assert.equal(fs.readFileSync(dest, 'utf8'), '# my local edits\n')
})

test('a clean upstream change fast-forwards the file', () => {
  const root = tmpProject()
  const body = 'skills/workflow/verify.md'
  const item = bodyEntry('skill/verify', body)
  const dest = path.join(root, mapTemplatePath(body))

  // base = older upstream; disk still equals that base (local untouched); the
  // incoming template differs → clean fast-forward.
  const oldBody = '# old upstream\n'
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.writeFileSync(dest, oldBody)
  writeState(root, {
    schemaVersion: STATE_SCHEMA_VERSION,
    installedAt: new Date(0).toISOString(),
    installed: { 'skill/verify':
      { version: '0.9.0', hash: hashContent(oldBody), merge: 'clean', workspaces: ['.'] } },
  })

  const result = apply(root, [item])
  assert.equal(result.actions[0].type, 'update')
  assert.equal(result.actions[0].merge, 'clean')
  assert.ok(readDest(root, body).includes('# Skill: verify'))
})

test('prior state for ids not in the plan is preserved', () => {
  const root = tmpProject()
  apply(root, [bodyEntry('skill/verify', 'skills/workflow/verify.md')])
  apply(root, [bodyEntry('skill/debug', 'skills/debug.md')])
  const state = readState(root)
  assert.ok(state.installed['skill/verify'], 'first id kept')
  assert.ok(state.installed['skill/debug'], 'second id kept')
})

test('an unknown base (state written without a hash) is classified unknown', () => {
  const root = tmpProject()
  const body = 'skills/workflow/verify.md'
  // create the file out-of-band, then record state with no hash
  const dest = path.join(root, mapTemplatePath(body))
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.writeFileSync(dest, '# pre-existing\n')
  writeState(root, {
    schemaVersion: STATE_SCHEMA_VERSION,
    installedAt: new Date(0).toISOString(),
    installed: { 'skill/verify': { version: '', hash: '', merge: 'unknown', workspaces: [] } },
  })
  const result = apply(root, [bodyEntry('skill/verify', body)])
  assert.equal(result.actions[0].merge, 'unknown')
  assert.equal(result.actions[0].type, 'update')
})

test('an mcp entry merges add-only and is tracked by id', () => {
  const root = tmpProject()
  const item = {
    entry: {
      id: 'mcp/atlassian', surface: 'mcp',
      title: 'atlassian', summary: '', rationale: 'test', stability: 'stable',
      version: '1.0.0', hash: 'sha256:abc',
      server: { command: 'npx', args: ['-y', 'mcp-atlassian'] },
    },
    workspaces: ['.'],
  }
  const result = apply(root, [item])
  assert.deepEqual(result.mcp.added, ['mcp/atlassian'])
  const mcpFile = JSON.parse(fs.readFileSync(path.join(root, '.mcp.json'), 'utf8'))
  assert.ok(mcpFile.mcpServers.atlassian)

  // re-apply: existing server wins, reported skipped
  const again = apply(root, [item])
  assert.deepEqual(again.mcp.skipped, ['mcp/atlassian'])
  assert.deepEqual(again.mcp.added, [])

  const state = readState(root)
  assert.ok(state.installed['mcp/atlassian'])
})
