import chalk from 'chalk'
import path  from 'path'
import { planInstall, readVersionFile, readInstalledSelection, SCAFFOLD_VERSION } from '../installer.js'

export async function status(): Promise<void> {
  const root = process.cwd()
  console.log(chalk.bold('\nai-scaffold — status\n'))

  const installed = readVersionFile(root)
  if (!installed) {
    console.log(chalk.red('  Not installed.'))
    console.log(chalk.gray('  Run: npx github:jcuadros-achieve/ai-scaffold install\n'))
    return
  }

  const selected = readInstalledSelection(root) ?? []
  console.log(`  Installed: ${chalk.green(installed)}`)
  console.log(`  Latest:    ${chalk.green(SCAFFOLD_VERSION)}`)
  console.log(`  Optional modules: ${selected.length ? selected.join(', ') : chalk.gray('core only')}`)
  if (installed !== SCAFFOLD_VERSION)
    console.log(chalk.yellow('  Update available — run: ai-scaffold update'))

  const actions    = planInstall(root, selected)
  const updates    = actions.filter(a => a.type === 'update')
  const changed    = updates.filter(a => a.merge !== 'conflict')
  const conflicts  = updates.filter(a => a.merge === 'conflict')
  const missing    = actions.filter(a => a.type === 'create')
  const customized = actions.filter(a => a.type === 'skip' && a.merge === 'customized')

  if (customized.length)
    console.log(chalk.gray(`  ${customized.length} customized files (no upstream changes)`))

  if (!updates.length && !missing.length) {
    console.log(chalk.green('\n  All files up to date.\n'))
    return
  }
  if (missing.length) {
    console.log(chalk.yellow(`\n  ${missing.length} missing files:`))
    missing.forEach(a => console.log(chalk.yellow(`    ${path.relative(root, a.dest)}`)))
  }
  if (changed.length) {
    console.log(chalk.yellow(`\n  ${changed.length} files differ (safe to update):`))
    changed.forEach(a => console.log(chalk.yellow(`    ${path.relative(root, a.dest)}`)))
  }
  if (conflicts.length) {
    console.log(chalk.red(`\n  ${conflicts.length} conflicts (customized locally AND changed upstream):`))
    conflicts.forEach(a => console.log(chalk.red(`    ${path.relative(root, a.dest)}`)))
  }
  console.log(chalk.gray('\n  Run: ai-scaffold diff    to see changes'))
  console.log(chalk.gray('  Run: ai-scaffold update  to apply them\n'))
}
