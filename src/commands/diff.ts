import path from 'path'
import chalk from 'chalk'
import { planInstall } from '../installer.js'
import { renderDiff }  from '../differ.js'

export async function diff(): Promise<void> {
  const root = process.cwd()
  console.log(chalk.bold('\nai-scaffold — diff\n'))

  const actions  = planInstall(root)
  const toCreate = actions.filter(a => a.type === 'create')
  const toUpdate = actions.filter(a => a.type === 'update')

  if (!toCreate.length && !toUpdate.length) {
    console.log(chalk.green('  Project is up to date.'))
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
}
