import path from 'path'
import chalk from 'chalk'
import prompts from 'prompts'
import { execSync } from 'child_process'
import {
  planInstall, applyAction, writeVersionFile, loadManifest,
  readInstalledSelection, FileAction, OptionalModule,
} from '../installer.js'
import { renderDiff } from '../differ.js'

interface Flags { yes: boolean; all: boolean; modules: string[] | null }

function parseFlags(argv: string[]): Flags {
  const flags: Flags = { yes: false, all: false, modules: null }
  for (const arg of argv) {
    if (arg === '--yes' || arg === '-y') flags.yes = true
    else if (arg === '--all') flags.all = true
    else if (arg === '--core') flags.modules = []
    else if (arg.startsWith('--modules='))
      flags.modules = arg.slice('--modules='.length).split(',').map(s => s.trim()).filter(Boolean)
  }
  return flags
}

/** Decide which optional modules to install: explicit flags win; otherwise
 *  prompt interactively (pre-selecting what's already installed); otherwise
 *  core-only. Returns null if the user cancelled. */
async function resolveSelection(
  optional: OptionalModule[],
  flags: Flags,
  previous: string[],
): Promise<string[] | null> {
  const ids = new Set(optional.map(m => m.id))

  if (flags.all)             return optional.map(m => m.id)
  if (flags.modules !== null) {
    const unknown = flags.modules.filter(m => !ids.has(m))
    if (unknown.length) console.log(chalk.yellow(`  Ignoring unknown modules: ${unknown.join(', ')}`))
    return flags.modules.filter(m => ids.has(m))
  }

  const interactive = !flags.yes && Boolean(process.stdin.isTTY)
  if (!interactive || optional.length === 0) return previous   // core-only on fresh, keep on update

  const preset = new Set(previous)
  const res = await prompts({
    type: 'multiselect',
    name: 'modules',
    message: 'Optional modules to add (core is always installed)',
    instructions: false,
    hint: '- space to toggle, enter to confirm',
    choices: optional.map(m => ({
      title:       m.label,
      description: m.description,
      value:       m.id,
      selected:    preset.has(m.id),
    })),
  })
  if (res.modules === undefined) return null   // cancelled
  return res.modules as string[]
}

export async function install(): Promise<void> {
  const root  = process.cwd()
  const flags = parseFlags(process.argv.slice(3))
  console.log(chalk.bold('\nai-scaffold — install\n'))

  const optional = loadManifest()
  const previous = readInstalledSelection(root) ?? []
  const selected = await resolveSelection(optional, flags, previous)
  if (selected === null) { console.log(chalk.gray('\nAborted.')); return }

  console.log(`  Optional modules: ${selected.length ? selected.join(', ') : chalk.gray('core only')}\n`)

  const actions  = planInstall(root, selected)
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
    writeVersionFile(root, selected)        // still record selection
    return
  }

  const autoApply = flags.yes || !process.stdin.isTTY

  if (toUpdate.length > 0) {
    console.log(chalk.bold('Files with changes:\n'))
    for (const a of toUpdate) {
      console.log(chalk.yellow(`  ${path.relative(root, a.dest)}`))
      console.log(renderDiff(a.diff!))
      console.log()
    }
  }

  if (!autoApply) {
    const { proceed } = await prompts({
      type: 'confirm', name: 'proceed',
      message: 'Apply these changes?', initial: true,
    })
    if (!proceed) { console.log(chalk.gray('\nAborted.')); return }
  }

  const approved: FileAction[] = [...toCreate, ...toLink]

  for (const a of toUpdate) {
    if (autoApply) { approved.push(a); continue }
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

  writeVersionFile(root, selected)

  if (!autoApply) {
    const { doCommit } = await prompts({
      type: 'confirm', name: 'doCommit',
      message: '\nCreate initial commit for .ai/ and .context/?', initial: true,
    })
    if (doCommit) commitScaffold(root)
  }

  console.log(chalk.bold('\nDone. Run ai-init in your AI agent to populate AI_CONTEXT.md.\n'))
}

function commitScaffold(root: string): void {
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
