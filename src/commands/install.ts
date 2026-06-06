import path from 'path'
import chalk from 'chalk'
import prompts from 'prompts'
import { execSync } from 'child_process'
import { planInstall, applyAction, writeVersionFile, FileAction } from '../installer.js'
import { renderDiff } from '../differ.js'

export async function install(): Promise<void> {
  const root = process.cwd()
  console.log(chalk.bold('\nai-scaffold — install\n'))

  const actions  = planInstall(root)
  const toCreate = actions.filter(a => a.type === 'create')
  const toUpdate = actions.filter(a => a.type === 'update')
  const toLink   = actions.filter(a => a.type === 'symlink')
  const skipped  = actions.filter(a => a.type === 'skip')

  console.log(chalk.green(`  ${toCreate.length} files to create`))
  console.log(chalk.yellow(`  ${toUpdate.length} files with changes`))
  console.log(chalk.blue(`  ${toLink.length} symlinks to create`))
  console.log(chalk.gray(`  ${skipped.length} files unchanged\n`))

  if (!toCreate.length && !toUpdate.length && !toLink.length) {
    console.log(chalk.gray('Nothing to do.'))
    return
  }

  if (toUpdate.length > 0) {
    console.log(chalk.bold('Files with changes:\n'))
    for (const a of toUpdate) {
      console.log(chalk.yellow(`  ${path.relative(root, a.dest)}`))
      console.log(renderDiff(a.diff!))
      console.log()
    }
  }

  const { proceed } = await prompts({
    type: 'confirm', name: 'proceed',
    message: 'Apply these changes?', initial: true,
  })
  if (!proceed) { console.log(chalk.gray('\nAborted.')); return }

  const approved: FileAction[] = [...toCreate, ...toLink]

  for (const a of toUpdate) {
    const rel = path.relative(root, a.dest)
    const { choice } = await prompts({
      type: 'select', name: 'choice',
      message: `  ${rel}:`,
      choices: [
        { title: 'Apply incoming version', value: 'apply' },
        { title: 'Keep current version',   value: 'keep'  },
      ],
    })
    if (choice === 'apply') approved.push(a)
  }

  for (const a of approved) {
    applyAction(a)
    const rel  = path.relative(root, a.dest)
    const icon = a.type === 'create'  ? chalk.green('  created') :
                 a.type === 'symlink' ? chalk.blue('  symlink') :
                 chalk.yellow('  updated')
    console.log(`${icon}  ${rel}`)
  }

  writeVersionFile(root)

  const { doCommit } = await prompts({
    type: 'confirm', name: 'doCommit',
    message: '\nCreate initial commit for .ai/ and .context/?', initial: true,
  })

  if (doCommit) {
    try {
      execSync(
        'git add .ai/ .context/ CLAUDE.md .cursorrules .github/ 2>/dev/null || true',
        { cwd: root, stdio: 'pipe' }
      )
      execSync(
        'git commit -m "chore: initialize AI scaffold (.ai/ and .context/)"',
        { cwd: root, stdio: 'pipe' }
      )
      console.log(chalk.green('\n  committed: chore: initialize AI scaffold'))
    } catch {
      console.log(chalk.yellow('\n  Could not commit — stage manually.'))
    }
  }

  console.log(chalk.bold('\nDone. Run ai-init in your AI agent to populate AI_CONTEXT.md.\n'))
}
