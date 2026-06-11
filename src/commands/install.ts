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

  const actions    = planInstall(root, selected)
  const toCreate   = actions.filter(a => a.type === 'create')
  const updates    = actions.filter(a => a.type === 'update')
  const toUpdate   = updates.filter(a => a.merge !== 'conflict')
  const conflicts  = updates.filter(a => a.merge === 'conflict')
  const customized = actions.filter(a => a.type === 'skip' && a.merge === 'customized')
  const skipped    = actions.filter(a => a.type === 'skip' && a.merge !== 'customized')

  console.log(chalk.green(`  ${toCreate.length} files to create`))
  console.log(chalk.yellow(`  ${toUpdate.length} files with changes`))
  if (conflicts.length)
    console.log(chalk.red(`  ${conflicts.length} conflicts (customized locally AND changed upstream)`))
  if (customized.length)
    console.log(chalk.gray(`  ${customized.length} customized files untouched (no upstream changes)`))
  console.log(chalk.gray(`  ${skipped.length} files unchanged\n`))

  if (!toCreate.length && !toUpdate.length && !conflicts.length) {
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

  if (conflicts.length > 0) {
    console.log(chalk.bold(chalk.red('Conflicts — customized locally AND changed upstream:\n')))
    for (const a of conflicts) {
      console.log(chalk.red(`  ${path.relative(root, a.dest)}`) +
        chalk.gray('  (diff is local vs incoming; merge manually if you want both)'))
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

  const approved: FileAction[] = [...toCreate]

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

  // Conflicts are never auto-applied (ADR-006): a known customization must be
  // overwritten only by an explicit, per-file human choice.
  for (const a of conflicts) {
    if (autoApply) {
      console.log(chalk.gray(`  kept (conflict): ${path.relative(root, a.dest)}`))
      continue
    }
    const rel = path.relative(root, a.dest)
    const { choice } = await prompts({
      type: 'select', name: 'choice',
      message: `  ${rel} ${chalk.red('(conflict)')}:`,
      choices: [
        { title: 'Keep current version (recommended — merge manually)', value: 'keep'  },
        { title: 'Overwrite with incoming (discards local changes)',    value: 'apply' },
      ],
    })
    if (choice === 'apply') approved.push(a)
  }

  for (const a of approved) {
    applyAction(a)
    const rel  = path.relative(root, a.dest)
    const icon = a.type === 'create' ? chalk.green('  created') :
                 chalk.yellow('  updated')
    console.log(`${icon}  ${rel}`)
  }

  writeVersionFile(root, selected)

  if (!autoApply) {
    const { doCommit } = await prompts({
      type: 'confirm', name: 'doCommit',
      message: '\nCreate initial commit for the AI scaffold?', initial: true,
    })
    if (doCommit) commitScaffold(root)
  }

  console.log(chalk.bold('\nDone. Run ai-init in your AI agent to populate CLAUDE.md.\n'))
}

function commitScaffold(root: string): void {
  try {
    execSync(
      'git add .claude/ .context/ CLAUDE.md 2>/dev/null || true',
      { cwd: root, stdio: 'pipe' }
    )
    execSync(
      'git commit -m "chore: initialize AI scaffold (.claude/ and .context/)"',
      { cwd: root, stdio: 'pipe' }
    )
    console.log(chalk.green('\n  committed: chore: initialize AI scaffold'))
  } catch {
    console.log(chalk.yellow('\n  Could not commit — stage manually.'))
  }
}
