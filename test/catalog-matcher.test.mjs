import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  appliesToWorkspace, suggest, detectConflicts,
} from '../dist/catalog.js'

// --- Catalog fixtures (shape mirrors catalog.index.json, ADR-018 §2) ----------

const postgres = {
  id: 'skill/postgres-patterns', surface: 'skill', title: 'Postgres patterns',
  summary: 'Kysely/pg', body: 'skills/postgres-patterns.md',
  appliesWhen: { any: [{ dep: 'pg' }, { dep: 'kysely' }] },
  conflictsWith: ['skill/mysql-patterns'], rationale: 'pg-specific',
  stability: 'stable',
}
const mysql = {
  id: 'skill/mysql-patterns', surface: 'skill', title: 'MySQL patterns',
  summary: 'sequelize/mysql', body: 'skills/mysql-patterns.md',
  appliesWhen: { any: [{ dep: 'mysql2' }, { dep: 'sequelize' }] },
  conflictsWith: ['skill/postgres-patterns'], rationale: 'mysql-specific',
  stability: 'stable',
}
const security = {
  id: 'rule/security', surface: 'rule', title: 'Security', summary: 'universal',
  body: 'rules/security.md', rationale: 'transversal', stability: 'stable',
}
const rust = {
  id: 'skill/rust-patterns', surface: 'skill', title: 'Rust patterns',
  summary: 'rust', body: 'skills/rust-patterns.md',
  appliesWhen: { lang: 'rust' }, rationale: 'rust-specific', stability: 'stable',
}
const seed = {
  id: 'skill/ai-init', surface: 'skill', title: 'ai-init', summary: 'keystone',
  body: 'skills/ai-init.md', rationale: 'bootstrap', seed: true, stability: 'stable',
}
const catalog = [postgres, mysql, security, rust, seed]

const wsPg = {
  path: 'session-store', languages: ['typescript'], deps: ['express', 'kysely', 'pg'],
  archetype: 'service',
}
const wsMysql = {
  path: 'growth-partners-api', languages: ['typescript'],
  deps: ['express', 'sequelize', 'mysql2'], archetype: 'service',
}

// --- appliesToWorkspace --------------------------------------------------------

test('absent appliesWhen is universal', () => {
  assert.equal(appliesToWorkspace(undefined, wsPg), true)
  assert.equal(appliesToWorkspace(security.appliesWhen, wsMysql), true)
})

test('any-group matches when one predicate holds', () => {
  assert.equal(appliesToWorkspace(postgres.appliesWhen, wsPg), true)
  assert.equal(appliesToWorkspace(postgres.appliesWhen, wsMysql), false)
})

test('all-group requires every predicate', () => {
  const aw = { all: [{ dep: 'express' }, { lang: 'typescript' }] }
  assert.equal(appliesToWorkspace(aw, wsPg), true)
  assert.equal(appliesToWorkspace({ all: [{ dep: 'express' }, { dep: 'pg' }] }, wsMysql), false)
})

test('multi-key predicate ANDs its keys', () => {
  const ws = {
    path: 'x', languages: ['typescript'], deps: ['@prisma/client'],
    files: ['db/schema.prisma'],
    fileContents: { 'db/schema.prisma': 'provider = "postgresql"\n' },
  }
  const aw = { dep: '@prisma/client', file: '**/schema.prisma', contains: 'postgresql' }
  assert.equal(appliesToWorkspace(aw, ws), true)
  // same file, wrong provider → no match
  const wsMy = { ...ws, fileContents: { 'db/schema.prisma': 'provider = "mysql"\n' } }
  assert.equal(appliesToWorkspace(aw, wsMy), false)
  // dep absent → no match even though file matches
  assert.equal(appliesToWorkspace(aw, { ...ws, deps: [] }), false)
})

test('file glob matches nested and root paths', () => {
  const ws = { path: 'x', languages: [], deps: [], files: ['pkg/tsconfig.json'] }
  assert.equal(appliesToWorkspace({ file: '**/tsconfig.json' }, ws), true)
  assert.equal(appliesToWorkspace({ file: '**/tsconfig.json' },
    { path: 'y', languages: [], deps: [], files: ['tsconfig.json'] }), true)
  assert.equal(appliesToWorkspace({ file: '**/tsconfig.json' },
    { path: 'z', languages: [], deps: [], files: ['tsconfig.base.json'] }), false)
})

test('one-level nested group', () => {
  const aw = { any: [{ lang: 'rust' }, { all: [{ dep: 'kysely' }, { dep: 'pg' }] }] }
  assert.equal(appliesToWorkspace(aw, wsPg), true)      // via the all-branch
  assert.equal(appliesToWorkspace(aw, wsMysql), false)
})

// --- suggest: the canonical achieve monorepo case (ADR-020) -------------------

test('suggest attributes per workspace and coexists pg+mysql across the union', () => {
  const profile = { root: '/repo', workspaces: [wsPg, wsMysql] }
  const candidates = suggest(profile, catalog)
  const byId = Object.fromEntries(candidates.map(c => [c.id, c]))

  // postgres only in the pg workspace, mysql only in the mysql one
  assert.deepEqual(byId['skill/postgres-patterns'].workspaces, ['session-store'])
  assert.deepEqual(byId['skill/mysql-patterns'].workspaces, ['growth-partners-api'])
  // both survive in the curated union (ADR-020 §3)
  assert.ok(byId['skill/postgres-patterns'] && byId['skill/mysql-patterns'])
  // universal attaches to every workspace
  assert.deepEqual(byId['rule/security'].workspaces.sort(),
    ['growth-partners-api', 'session-store'])
  // unmatched stack never offered
  assert.equal(byId['skill/rust-patterns'], undefined)
})

test('suggest never offers seed entries (laid by install, ADR-017)', () => {
  const profile = { root: '/repo', workspaces: [wsPg] }
  const candidates = suggest(profile, catalog)
  assert.equal(candidates.find(c => c.id === 'skill/ai-init'), undefined)
})

// --- detectConflicts: within a workspace, not globally (ADR-020 §3) -----------

test('no global conflict when pg and mysql live in different workspaces', () => {
  const profile = { root: '/repo', workspaces: [wsPg, wsMysql] }
  const conflicts = detectConflicts(suggest(profile, catalog))
  assert.deepEqual(conflicts, [])
})

test('conflict detected when both apply in the SAME workspace', () => {
  const polyglot = {
    path: 'mixed', languages: ['typescript'],
    deps: ['kysely', 'pg', 'sequelize', 'mysql2'], archetype: 'service',
  }
  const conflicts = detectConflicts(suggest({ root: '/r', workspaces: [polyglot] }, catalog))
  assert.equal(conflicts.length, 1)
  assert.equal(conflicts[0].workspace, 'mixed')
  assert.deepEqual([...conflicts[0].ids].sort(),
    ['skill/mysql-patterns', 'skill/postgres-patterns'])
})
