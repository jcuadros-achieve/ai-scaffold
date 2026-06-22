#!/usr/bin/env node
/**
 * Release helper for @achieve/ai-scaffold — codifies ADR-001 §6 (release flow).
 *
 * Bumps the version, syncs package-lock.json, runs the verification gate
 * (build + tests), commits, tags, and optionally pushes. Delegates the bump +
 * commit + tag to `npm version` (atomic), so the lockfile can never drift from
 * package.json — a manual bump forgot it, which is how the 2.9.0-rc.* left the
 * lockfile stale at 2.8.0.
 *
 * Usage:
 *   node scripts/release.mjs <version> [--no-push] [--yes] [--dry-run]
 *
 *   <version>  explicit ('2.9.0', '2.10.0-rc.1') or a semver keyword
 *              (major | minor | patch | premajor | preminor | prepatch |
 *               prerelease). There is no keyword to drop or add a prerelease
 *              tag — pass the full string ('2.9.0' drops a prerelease).
 *   --no-push  skip the push step (commit + tag stay local)
 *   --yes      push without prompting (non-interactive / CI)
 *   --dry-run  run the pre-flight checks and print the plan, then stop
 *
 * Tags carry no `v` prefix (--tag-version-prefix=''), matching the existing
 * convention (2.9.0, 2.9.0-rc.1). Git signing config is respected (npm version
 * creates an annotated tag, which goes through the configured signer).
 *
 * No runtime dependencies: uses only Node built-ins, so it runs without
 * node_modules. This is dev tooling — scripts/ is not in the npm `files`
 * whitelist and never ships to target projects. ADR-001 §4/§6 still apply: the
 * test gate runs before any version change, and the tag is cut on `main`.
 */
import { execSync } from 'child_process'
import fs from 'fs'
import readline from 'readline'

// ─── helpers ─────────────────────────────────────────────────────────────────
const fail = (msg) => {
  console.error(`\n  error: ${msg}\n`)
  process.exit(1)
}
const read = (cmd) =>
  execSync(cmd, { stdio: ['pipe', 'pipe', 'pipe'], encoding: 'utf8' }).trim()
const run = (cmd) => execSync(cmd, { stdio: 'inherit' })

/** Yes/no prompt on stdin. Defaults to yes on empty input; resolves false on
 *  anything that is not y/yes (case-insensitive) or a closed stream. */
function confirm(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })
    rl.question(question, (answer) => {
      rl.close()
      const a = answer.trim().toLowerCase()
      resolve(a === '' || a === 'y' || a === 'yes')
    })
  })
}

// ─── args ────────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2)
const flags = new Set(argv.filter((a) => a.startsWith('--')))
const positional = argv.filter((a) => !a.startsWith('--'))
const versionSpec = positional[0]

const dryRun = flags.has('--dry-run')
const optOut = flags.has('--no-push'); // never push
const autoYes = flags.has('--yes'); // push without prompting

if (!versionSpec)
  fail(
    'Missing <version>. Usage: node scripts/release.mjs <version> [--no-push|--yes|--dry-run]',
  )

// Validate the spec up front: keep it off the shell and fail with a clear error
// instead of a cryptic npm message.
const KEYWORDS = new Set([
  'major',
  'minor',
  'patch',
  'premajor',
  'preminor',
  'prepatch',
  'prerelease',
])
const EXPLICIT = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([\w.]+))?$/
if (!KEYWORDS.has(versionSpec) && !EXPLICIT.test(versionSpec))
  fail(
    `Invalid version '${versionSpec}'. Use an explicit x.y.z[-pre] or one of: ${[...KEYWORDS].join(', ')}.`,
  )

if (optOut && autoYes) fail('--no-push and --yes are mutually exclusive.')

// ─── pre-flight checks ───────────────────────────────────────────────────────
console.log('\nai-scaffold — release\n')

// 1. Releases are cut from main (ADR-001 §6).
const cur = read('git rev-parse --abbrev-ref HEAD')
if (cur !== 'main')
  fail(
    `Releases are cut from 'main' (ADR-001 §6); you are on '${cur}'.\n  Run: git checkout main`,
  )

// 2. Clean working tree — a dirty tree makes the release commit ambiguous, and
//    npm version refuses one anyway.
if (read('git status --porcelain'))
  fail('Working tree is not clean. Commit or stash before releasing.')

// 3. Never release on stale code: local main must not be behind origin.
run('git fetch origin main --quiet')
const behind = parseInt(read('git rev-list --count HEAD..origin/main'), 10)
if (behind > 0)
  fail(
    `Local main is ${behind} commit(s) behind origin/main. Pull first:\n  Run: git pull --ff-only origin main`,
  )

const currentVersion = JSON.parse(
  fs.readFileSync('package.json', 'utf8'),
).version
console.log(`  branch: main (clean, in sync with origin)`)
console.log(`  current version: ${currentVersion}`)
console.log(`  version spec:    ${versionSpec}`)

const pushPlan = optOut
  ? 'no push (--no-push)'
  : autoYes
    ? 'push (--yes)'
    : 'ask to push'
console.log(
  `  plan: npm test → npm version ${versionSpec} (commit + tag) → ${pushPlan}`,
)

if (dryRun) {
  console.log('\n  --dry-run: no changes made.\n')
  process.exit(0)
}

// ─── verification gate (ADR-001 §4) ──────────────────────────────────────────
console.log('\n  running verification gate (npm test)…\n')
try {
  run('npm test')
} catch {
  fail('Tests failed. Release aborted; no version change was made.')
}

// ─── bump + commit + tag (atomic, via npm version) ───────────────────────────
// --tag-version-prefix='' → tag named '<version>' with no `v` (matches 2.9.0).
// -m → the release commit message (%s → new version).
try {
  run(
    `npm version ${versionSpec} --tag-version-prefix='' -m 'chore(release): bump to %s'`,
  )
} catch {
  fail('npm version failed. Check the spec; no commit or tag was created.')
}

const newVersion = JSON.parse(fs.readFileSync('package.json', 'utf8')).version
console.log(`\n  released ${newVersion} (commit + tag created locally).`)

// ─── publish ─────────────────────────────────────────────────────────────────
let push = false
if (optOut) {
  console.log('  --no-push: skipping push.')
} else if (autoYes) {
  push = true
} else if (process.stdin.isTTY) {
  push = await confirm(`\nPush main + tag ${newVersion} to origin? [Y/n] `)
} else {
  console.log('  non-interactive run without --yes: skipping push.')
}

if (push) {
  // --follow-tags pushes the annotated release tag reachable from main.
  run('git push --follow-tags origin main')
  console.log(
    `\n  pushed. npx github:jcuadros-achieve/ai-scaffold#${newVersion} is live.\n`,
  )
} else {
  console.log(`\n  to publish:  git push --follow-tags origin main\n`)
}
