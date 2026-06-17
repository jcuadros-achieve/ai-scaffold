import path from 'path'
import chalk from 'chalk'
import prompts from 'prompts'
import { execSync } from 'child_process'
import { installSeed } from '../installer.js'

/**
 * `install` lays only the seed (ADR-017 §1): the minimum for `ai-init` to run.
 * No checklist, no module/MCP selection — that decision moves to `ai-init`,
 * which curates with the user after a real scan. This produces a bootstrap,
 * not a usable scaffold.
 */
export async function install(): Promise<void> {
  const root = process.cwd()
  console.log(chalk.bold('\nai-scaffold — install (seed)\n'))

  const { files, apply } = installSeed(root)

  const created = [
    ...files.filter(f => f.type === 'create').map(f => f.dest),
    ...apply.actions.filter(a => a.type === 'create').map(a => a.dest),
  ]
  const total   = files.length + apply.actions.length
  const skipped = total - created.length

  for (const dest of created)
    console.log(chalk.green('  created') + '  ' + path.relative(root, dest))
  if (skipped)
    console.log(chalk.gray(`  ${skipped} files already present (unchanged)`))
  if (!created.length)
    console.log(chalk.gray('  Seed already in place — nothing to create.'))

  const interactive = Boolean(process.stdin.isTTY)
  if (interactive && created.length) {
    const { doCommit } = await prompts({
      type: 'confirm', name: 'doCommit',
      message: '\nCommit the seed scaffold?', initial: true,
    })
    if (doCommit) commitScaffold(root)
  }

  console.log(
    chalk.bold('\nSeed laid. Next: run ') + chalk.cyan('ai-init') +
    chalk.bold(' in your AI agent') +
    chalk.gray(' — it scans the project and curates the scaffold for you.\n'))
}

function commitScaffold(root: string): void {
  try {
    execSync('git add .claude/ .context/ CLAUDE.md 2>/dev/null || true',
      { cwd: root, stdio: 'pipe' })
    execSync('git commit -m "chore: initialize AI scaffold seed (.claude/ and .context/)"',
      { cwd: root, stdio: 'pipe' })
    console.log(chalk.green('\n  committed: chore: initialize AI scaffold seed'))
  } catch {
    console.log(chalk.yellow('\n  Could not commit — stage manually.'))
  }
}
