import path from 'path'
import chalk from 'chalk'
import { planInstall, readInstalledSelection } from '../installer.js'
import { renderDiff }  from '../differ.js'

export async function diff(): Promise<void> {
  const root = process.cwd()
  console.log(chalk.bold('\nai-scaffold — diff\n'))

  const selected   = readInstalledSelection(root) ?? []
  const actions    = planInstall(root, selected)
  const toCreate   = actions.filter(a => a.type === 'create')
  const updates    = actions.filter(a => a.type === 'update')
  const toUpdate   = updates.filter(a => a.merge !== 'conflict')
  const conflicts  = updates.filter(a => a.merge === 'conflict')
  const customized = actions.filter(a => a.type === 'skip' && a.merge === 'customized')

  if (!toCreate.length && !updates.length) {
    console.log(chalk.green('  Project is up to date.'))
    if (customized.length)
      console.log(chalk.gray(`  (${customized.length} customized files, no upstream changes)`))
    return
  }

  if (toCreate.length) {
    console.log(chalk.green(`New files (${toCreate.length}):`))
    toCreate.forEach(a => console.log(chalk.green(`  + ${path.relative(root, a.dest)}`)))
    console.log()
  }

  if (toUpdate.length) {
    console.log(chalk.yellow(`Changed files (${toUpdate.length}):\n`))
    for (const a of toUpdate) {
      console.log(chalk.yellow(`  ${path.relative(root, a.dest)}`))
      console.log(renderDiff(a.diff!))
      console.log()
    }
  }

  if (conflicts.length) {
    console.log(chalk.red(`Conflicts — customized locally AND changed upstream (${conflicts.length}):\n`))
    for (const a of conflicts) {
      console.log(chalk.red(`  ${path.relative(root, a.dest)}`))
      console.log(renderDiff(a.diff!))
      console.log()
    }
  }

  if (customized.length)
    console.log(chalk.gray(`${customized.length} customized files untouched (no upstream changes).`))
}
