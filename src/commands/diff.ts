import path from 'path'
import chalk from 'chalk'
import { readState, reconcile } from '../installer.js'
import { createDiff, renderDiff } from '../differ.js'

/** `diff` shows, per installed entry (ADR-017 §3), the change between the
 *  on-disk file and the incoming catalog body. Conflicts are flagged. */
export async function diff(): Promise<void> {
  const root = process.cwd()
  console.log(chalk.bold('\nai-scaffold — diff\n'))

  if (!readState(root)) {
    console.log(chalk.red('  Not installed.\n'))
    return
  }

  const recon = reconcile(root).filter(
    r => r.dest && r.incoming !== undefined && r.current !== undefined && r.current !== r.incoming)
  const changed   = recon.filter(r => r.merge !== 'conflict')
  const conflicts = recon.filter(r => r.merge === 'conflict')

  if (!changed.length && !conflicts.length) {
    console.log(chalk.green('  All installed entries up to date.\n'))
    return
  }

  if (changed.length) {
    console.log(chalk.yellow(`Changed entries (${changed.length}):\n`))
    for (const r of changed) {
      console.log(chalk.yellow(`  ${r.id}  ${chalk.gray(path.relative(root, r.dest!))}`))
      console.log(renderDiff(createDiff(r.current!, r.incoming!, path.relative(root, r.dest!))))
      console.log()
    }
  }

  if (conflicts.length) {
    console.log(chalk.red(`Conflicts — customized locally AND changed upstream (${conflicts.length}):\n`))
    for (const r of conflicts) {
      console.log(chalk.red(`  ${r.id}  ${chalk.gray(path.relative(root, r.dest!))}`))
      console.log(renderDiff(createDiff(r.current!, r.incoming!, path.relative(root, r.dest!))))
      console.log()
    }
  }
}
