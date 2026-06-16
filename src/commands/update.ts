import path from 'path'
import chalk from 'chalk'
import prompts from 'prompts'
import {
  planInstall, applyAction, writeVersionFile,
  readInstalledSelection, readInstalledMcp, readVersionFile,
  changelogSince, FileAction,
} from '../installer.js'
import { renderDiff } from '../differ.js'

/** `update` is its own operation, distinct from `install` (ADR-017): it pulls
 *  upstream changes to the *already-installed* selection — no module/MCP wizard,
 *  no commit prompt. Seed templates (CLAUDE.md, rules) are install-once and never
 *  reconciled here; their upstream changes surface only in the changelog. To add
 *  or drop a module, re-run `install`. */
export async function update(): Promise<void> {
  const root    = process.cwd()
  const autoYes = process.argv.slice(3).some(a => a === '--yes' || a === '-y')
  console.log(chalk.bold('\nai-scaffold — update\n'))

  const installedVersion = readVersionFile(root)
  if (!installedVersion) {
    console.log(chalk.red('  Not installed.'))
    console.log(chalk.gray('  Run: npx github:jcuadros-achieve/ai-scaffold install\n'))
    return
  }

  const selected = readInstalledSelection(root) ?? []
  const mcp      = readInstalledMcp(root)

  printChangelog(installedVersion)

  const actions   = planInstall(root, selected)
  const toCreate  = actions.filter(a => a.type === 'create')
  const updates   = actions.filter(a => a.type === 'update')
  const toUpdate  = updates.filter(a => a.merge !== 'conflict')
  const conflicts = updates.filter(a => a.merge === 'conflict')

  if (!toCreate.length && !updates.length) {
    console.log(chalk.green('  No new or changed files to apply.'))
    console.log(chalk.gray('  (Seed files like CLAUDE.md and rules are yours — never overwritten by update.)\n'))
    writeVersionFile(root, selected, mcp)   // re-record the latest catalog base
    return
  }

  console.log(chalk.green(`  ${toCreate.length} new files`))
  console.log(chalk.yellow(`  ${toUpdate.length} files with changes`))
  if (conflicts.length)
    console.log(chalk.red(`  ${conflicts.length} conflicts (customized locally AND changed upstream)`))
  console.log()

  const autoApply = autoYes || !process.stdin.isTTY

  if (toUpdate.length) {
    console.log(chalk.bold('Files with changes:\n'))
    for (const a of toUpdate) {
      console.log(chalk.yellow(`  ${path.relative(root, a.dest)}`))
      console.log(renderDiff(a.diff!))
      console.log()
    }
  }

  if (conflicts.length) {
    console.log(chalk.bold(chalk.red('Conflicts — customized locally AND changed upstream:\n')))
    for (const a of conflicts) {
      console.log(chalk.red(`  ${path.relative(root, a.dest)}`) +
        chalk.gray('  (diff is local vs incoming; merge manually if you want both)'))
      console.log(renderDiff(a.diff!))
      console.log()
    }
  }

  const approved: FileAction[] = [...toCreate]

  for (const a of toUpdate) {
    if (autoApply) { approved.push(a); continue }
    const { choice } = await prompts({
      type: 'select', name: 'choice',
      message: `  ${path.relative(root, a.dest)}:`,
      choices: [
        { title: 'Apply incoming version', value: 'apply' },
        { title: 'Keep current version',   value: 'keep'  },
      ],
    })
    if (choice === 'apply') approved.push(a)
  }

  // Conflicts are never auto-applied (ADR-006): a known customization is
  // overwritten only by an explicit, per-file human choice.
  for (const a of conflicts) {
    if (autoApply) {
      console.log(chalk.gray(`  kept (conflict): ${path.relative(root, a.dest)}`))
      continue
    }
    const { choice } = await prompts({
      type: 'select', name: 'choice',
      message: `  ${path.relative(root, a.dest)} ${chalk.red('(conflict)')}:`,
      choices: [
        { title: 'Keep current version (recommended — merge manually)', value: 'keep'  },
        { title: 'Overwrite with incoming (discards local changes)',    value: 'apply' },
      ],
    })
    if (choice === 'apply') approved.push(a)
  }

  for (const a of approved) {
    applyAction(a)
    const icon = a.type === 'create' ? chalk.green('  created') : chalk.yellow('  updated')
    console.log(`${icon}  ${path.relative(root, a.dest)}`)
  }

  writeVersionFile(root, selected, mcp)
  console.log(chalk.bold('\nDone.\n'))
}

/** Print the file changes between the installed version and the latest (ADR-017),
 *  calling out seed-file changes the update will deliberately not apply. */
function printChangelog(installedVersion: string): void {
  const releases = changelogSince(installedVersion)
  if (!releases.length) return

  console.log(chalk.bold(`What changed since ${installedVersion}:\n`))
  for (const r of releases) {
    console.log(chalk.cyan(`  ${r.version}`) + chalk.gray(`  (${r.date})`))
    for (const c of r.changes) {
      const tag  = c.track === 'seed' ? chalk.magenta('[seed]') : chalk.gray('[reconcile]')
      const verb = c.kind === 'added'   ? chalk.green('added   ')
                 : c.kind === 'removed' ? chalk.red('removed ')
                 :                        chalk.yellow('modified')
      console.log(`    ${verb} ${tag} ${c.path}`)
    }
  }

  const changedSeed = releases
    .flatMap(r => r.changes)
    .filter(c => c.track === 'seed' && c.kind === 'modified')
  if (changedSeed.length)
    console.log(chalk.gray(
      `\n  ${changedSeed.length} seed file(s) changed upstream. Your copies are kept untouched —\n` +
      '  review the changelog and pull anything you want by hand.'))
  console.log()
}
