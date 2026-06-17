import path from 'path'
import chalk from 'chalk'
import prompts from 'prompts'
import {
  apply as applyPlan,
  getRemoteVersion,
  getCurrentPackageVersion,
  loadCatalogIndex,
  readState,
  readVersion,
  reconcile,
  writeVersion
} from '../installer.js'
import type { ApplyItem } from '../installer.js'

/**
 * `update` reconciles the installed entries against the latest catalog (ADR-017
 * §3): the catalog moved on, so re-apply each installed id through the single
 * writer. Clean changes fast-forward; customized files are left untouched;
 * conflicts are never auto-applied (and re-recording the base means a declined
 * conflict is not re-nagged until upstream moves again). Detecting *new*
 * applicable entries (the project changed) is `ai-init`'s job — re-run it.
 */
export async function update(): Promise<void> {
  const root = process.cwd()
  console.log(chalk.bold('\nai-scaffold — update\n'))

  const state = readState(root)
  if (!state) {
    console.log(chalk.red('  Not installed (no .claude/.scaffold-state.json).'))
    console.log(chalk.gray('  Run: npx github:jcuadros-achieve/ai-scaffold install\n'))
    return
  }

  // Check for ai-scaffold version updates
  const localVersion = readVersion(root)
  const remoteVersion = await getRemoteVersion()
  const currentVersion = getCurrentPackageVersion()

  if (localVersion && remoteVersion && currentVersion) {
    const localVer = localVersion.version
    console.log(chalk.gray(`  Current version: ${localVer}`))

    if (remoteVersion !== localVer) {
      console.log(chalk.yellow(`  New version available: ${remoteVersion}`))

      const autoApply = !process.stdin.isTTY
      if (!autoApply) {
        const { upgrade } = await prompts({
          type: 'confirm',
          name: 'upgrade',
          message: '\nUpgrade ai-scaffold to the latest version?',
          initial: true,
        })
        if (!upgrade) {
          console.log(chalk.gray('\nSkipping ai-scaffold upgrade. Continuing with catalog update...\n'))
        } else {
          // Update the version file
          writeVersion(root, {
            version: remoteVersion,
            installedAt: new Date().toISOString()
          })
          console.log(chalk.green(`\n  Upgraded to version ${remoteVersion}`))
          console.log(chalk.yellow('  Note: Use npx github:jcuadros-achieve/ai-scaffold@latest for commands\n'))
        }
      }
    } else {
      console.log(chalk.green('  ai-scaffold is up to date'))
    }
  }

  console.log('')

  const catalog = loadCatalogIndex()
  const recon   = reconcile(root, catalog)
  const changed   = recon.filter(r => r.type === 'update' && r.merge === 'clean')
  const conflicts = recon.filter(r => r.merge === 'conflict')
  const missing   = recon.filter(r => r.type === 'missing')

  if (!changed.length && !conflicts.length) {
    console.log(chalk.green('  All installed entries are up to date.'))
    if (missing.length)
      console.log(chalk.gray(`  ${missing.length} installed id(s) no longer in the catalog (left in place).`))
    console.log(chalk.gray('\n  Re-run ai-init to pick up entries newly applicable to the project.\n'))
    return
  }

  console.log(chalk.yellow(`  ${changed.length} entr(ies) with upstream changes`))
  changed.forEach(r => console.log(chalk.yellow(`    ${r.id}`) + (r.dest ? chalk.gray(`  ${path.relative(root, r.dest)}`) : '')))
  if (conflicts.length) {
    console.log(chalk.red(`\n  ${conflicts.length} conflict(s) (customized locally AND changed upstream) — kept, never auto-applied:`))
    conflicts.forEach(r => console.log(chalk.red(`    ${r.id}`)))
  }

  const autoApply = !process.stdin.isTTY
  if (!autoApply) {
    const { proceed } = await prompts({
      type: 'confirm', name: 'proceed',
      message: '\nApply the clean upstream changes?', initial: true,
    })
    if (!proceed) { console.log(chalk.gray('\nAborted.')); return }
  }

  // Re-apply every installed id still in the catalog. The single writer skips
  // customized/conflict on its own; clean changes fast-forward.
  const byId  = new Map(catalog.map(e => [e.id, e]))
  const items: ApplyItem[] = []
  for (const [id, entry] of Object.entries(state.installed)) {
    const cat = byId.get(id)
    if (cat) items.push({ entry: cat, workspaces: entry.workspaces })
  }
  const result = applyPlan(root, items)

  const updated = result.actions.filter(a => a.type === 'update')
  for (const a of updated)
    console.log(chalk.yellow('  updated') + `  ${a.id}`)
  console.log(chalk.bold(`\nDone. ${updated.length} updated.\n`))
}
