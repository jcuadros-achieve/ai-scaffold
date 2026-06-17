import fs   from 'fs'
import path from 'path'
import chalk from 'chalk'
import { loadCatalogIndex } from '../installer.js'
import { suggest as matchCatalog, detectConflicts } from '../catalog.js'
import type { ProjectProfile } from '../catalog.js'

export const SCAFFOLD_DIR  = '.scaffold'
export const PROFILE_FILE    = 'project-profile.json'
export const CANDIDATES_FILE = 'candidates.json'

/**
 * `suggest` is the mechanical filter step (ADR-017 §2). It reads the project
 * profile that `ai-init` produced (the sole agent→CLI boundary), runs the pure
 * `appliesWhen` matcher against the catalog, and writes candidates.json for the
 * agent to rank and justify. It trusts the profile's facts and never re-derives
 * them — that keeps the matcher pure and testable.
 */
export async function suggest(): Promise<void> {
  const root = process.cwd()
  console.log(chalk.bold('\nai-scaffold — suggest\n'))

  const profilePath = path.join(root, SCAFFOLD_DIR, PROFILE_FILE)
  if (!fs.existsSync(profilePath)) {
    console.log(chalk.red(`  Missing ${SCAFFOLD_DIR}/${PROFILE_FILE}.`))
    console.log(chalk.gray('  Run ai-init in your AI agent first — it scans the project and writes the profile.\n'))
    return
  }

  let profile: ProjectProfile
  try {
    profile = JSON.parse(fs.readFileSync(profilePath, 'utf8'))
  } catch {
    console.log(chalk.red(`  ${SCAFFOLD_DIR}/${PROFILE_FILE} is not valid JSON.\n`))
    return
  }
  if (!Array.isArray(profile.workspaces) || profile.workspaces.length === 0) {
    console.log(chalk.red('  The profile has no workspaces[]. ai-init must emit at least one.\n'))
    return
  }

  const catalog    = loadCatalogIndex()
  const candidates = matchCatalog(profile, catalog)
  const conflicts  = detectConflicts(candidates)

  const outPath = path.join(root, SCAFFOLD_DIR, CANDIDATES_FILE)
  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath,
    JSON.stringify({ generatedFrom: PROFILE_FILE, candidates, conflicts }, null, 2) + '\n')

  console.log(`  ${chalk.green(candidates.length)} candidate entries across ${profile.workspaces.length} workspace(s)`)
  if (conflicts.length)
    console.log(chalk.yellow(`  ${conflicts.length} same-workspace conflict(s) to resolve`))
  console.log(chalk.gray(`  Wrote ${SCAFFOLD_DIR}/${CANDIDATES_FILE} — ai-init ranks and justifies, then writes install-plan.json.\n`))
}
