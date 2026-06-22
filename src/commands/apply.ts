import fs   from 'fs'
import path from 'path'
import chalk from 'chalk'
import { apply as applyPlan, loadCatalogIndex } from '../installer.js'
import type { ApplyItem } from '../installer.js'
import { SCAFFOLD_DIR } from './suggest.js'

export const PLAN_FILE = 'install-plan.json'

interface PlanItem { id: string; workspaces?: string[] }

/**
 * `apply` is the single writer (ADR-017 §2/§5). It reads the curated plan
 * `ai-init` wrote (entry ids + the workspaces that justified each), resolves
 * each id against the catalog, and hands them to the installer's `apply` — which
 * classifies three-way per id (ADR-006), merges mcp add-only, and records state.
 * The agent decides; the CLI executes. Conflicts are never auto-applied.
 */
export async function apply(): Promise<void> {
  const root = process.cwd()
  console.log(chalk.bold('\nai-scaffold — apply\n'))

  const planPath = path.join(root, SCAFFOLD_DIR, PLAN_FILE)
  if (!fs.existsSync(planPath)) {
    console.log(chalk.red(`  Missing ${SCAFFOLD_DIR}/${PLAN_FILE}.`))
    console.log(chalk.gray('  Run ai-init (it writes the plan) or ai-scaffold suggest first.\n'))
    return
  }

  let plan: { items?: PlanItem[] }
  try { plan = JSON.parse(fs.readFileSync(planPath, 'utf8')) }
  catch { console.log(chalk.red(`  ${SCAFFOLD_DIR}/${PLAN_FILE} is not valid JSON.\n`)); return }

  const planItems = Array.isArray(plan.items) ? plan.items : []
  if (!planItems.length) { console.log(chalk.gray('  Plan is empty — nothing to apply.\n')); return }

  const byId = new Map(loadCatalogIndex().map(e => [e.id, e]))
  const items: ApplyItem[] = []
  for (const it of planItems) {
    const entry = byId.get(it.id)
    if (!entry) { console.log(chalk.yellow(`  Ignoring unknown entry: ${it.id}`)); continue }
    items.push({ entry, workspaces: it.workspaces ?? [] })
  }
  if (!items.length) { console.log(chalk.red('  No known entries in the plan.\n')); return }

  const result = applyPlan(root, items)

  for (const a of result.actions) {
    const rel = a.dest === '.mcp.json' ? '.mcp.json' : path.relative(root, a.dest)
    if (a.type === 'create') console.log(chalk.green('  created') + `  ${a.id}  ${chalk.gray(rel)}`)
    else if (a.type === 'update') console.log(chalk.yellow('  updated') + `  ${a.id}  ${chalk.gray(rel)}`)
    else if (a.merge === 'conflict') console.log(chalk.red('  conflict') + `  ${a.id} ${chalk.gray('(kept local — merge manually)')}`)
    else if (a.merge === 'customized') console.log(chalk.gray(`  customized  ${a.id} (kept local)`))
    else console.log(chalk.gray(`  unchanged   ${a.id}`))
  }

  if (result.mcp.invalid)
    console.log(chalk.yellow('  .mcp.json could not be parsed — left untouched; add the servers manually.'))
  if (result.mcp.added.length)
    console.log(chalk.gray('  MCP servers use OAuth or ${ENV_VAR} placeholders — no credentials were written.'))

  console.log(chalk.bold('\nApplied. The scaffold now reflects the curated plan.\n'))
}
