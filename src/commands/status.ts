import chalk from 'chalk'
import path  from 'path'
import { readState, reconcile } from '../installer.js'

/** `status` reports the id-keyed install state (ADR-017 §3) against the latest
 *  catalog: what is installed, what has upstream changes, what is customized or
 *  conflicted, and what is no longer in the catalog. Read-only. */
export async function status(): Promise<void> {
  const root = process.cwd()
  console.log(chalk.bold('\nai-scaffold — status\n'))

  const state = readState(root)
  if (!state) {
    console.log(chalk.red('  Not installed.'))
    console.log(chalk.gray('  Run: npx github:jcuadros-achieve/ai-scaffold install\n'))
    return
  }

  const recon = reconcile(root)
  const installedAt = state.installedAt ? state.installedAt.slice(0, 10) : 'unknown'
  console.log(`  Installed entries: ${chalk.green(recon.length)}  ${chalk.gray(`(last write ${installedAt})`)}`)

  const changed    = recon.filter(r => r.type === 'update' && r.merge === 'clean')
  const conflicts  = recon.filter(r => r.merge === 'conflict')
  const customized = recon.filter(r => r.merge === 'customized')
  const missing    = recon.filter(r => r.type === 'missing')

  if (customized.length)
    console.log(chalk.gray(`  ${customized.length} customized (no upstream changes)`))
  if (missing.length)
    console.log(chalk.gray(`  ${missing.length} no longer in the catalog (kept in place)`))

  if (!changed.length && !conflicts.length) {
    console.log(chalk.green('\n  All installed entries up to date.\n'))
    console.log(chalk.gray('  Re-run ai-init to pick up entries newly applicable to the project.\n'))
    return
  }

  if (changed.length) {
    console.log(chalk.yellow(`\n  ${changed.length} with upstream changes (safe to update):`))
    changed.forEach(r => console.log(chalk.yellow(`    ${r.id}`) + (r.dest ? chalk.gray(`  ${path.relative(root, r.dest)}`) : '')))
  }
  if (conflicts.length) {
    console.log(chalk.red(`\n  ${conflicts.length} conflicts (customized locally AND changed upstream):`))
    conflicts.forEach(r => console.log(chalk.red(`    ${r.id}`)))
  }
  console.log(chalk.gray('\n  Run: ai-scaffold diff    to see changes'))
  console.log(chalk.gray('  Run: ai-scaffold update  to apply them\n'))
}
