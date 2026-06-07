#!/usr/bin/env node
/**
 * Generate tool-native adapters from the canonical skill playbooks.
 *
 * Source of truth:  templates/.ai/skills/ (recursive)
 * Generated into templates/ (shipped + installed like any other template):
 *   - .github/agents/<name>.md     → Copilot CLI custom agents   (/agent <name>)
 *   - .claude/commands/<name>.md   → Claude Code slash commands  (/<name>)
 *   - .cursor/rules/ai-scaffold.mdc → Cursor context rule (skills are referenced)
 *
 * Adapters are thin: they point an agentic tool at the canonical playbook so the
 * skill content lives in exactly one place. Re-run after adding/renaming a skill:
 *     node scripts/gen-adapters.mjs
 */
import fs   from 'fs'
import path from 'path'

const ROOT      = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')
const TEMPLATES = path.join(ROOT, 'templates')
const SKILLS    = path.join(TEMPLATES, '.ai/skills')
const AGENTS    = path.join(TEMPLATES, '.github/agents')
const COMMANDS  = path.join(TEMPLATES, '.claude/commands')
const CURSOR    = path.join(TEMPLATES, '.cursor/rules')

/** Curated one-line descriptions (shown in the tool's picker). */
const DESC = {
  'ai-init':        'Analyze the codebase and generate the project-specific .ai/ context (run once).',
  'ticket-clarify': 'Turn any input into a structured technical brief; mark gaps instead of asking.',
  'task-plan':      'Produce a file-level technical plan from an approved brief.',
  'task-implement': 'Execute an approved plan test-first (TDD), without silent deviation.',
  'verify':         "Run build, tests, lint, coverage and audit to prove the change works before a PR.",
  'pr-write':       'Generate a conventional-commits PR description from the diff and brief.',
  'pr-review':      'Review a diff in seven structured passes with actionable findings.',
  'adr-write':      'Record a significant technical decision as an ADR and update the index.',
  'ai-log-write':   'Log a session where AI generated committed code.',
  'context-update': 'Rebuild .context/INDEX.md from sources and surface pending rule updates.',
  'new-endpoint':   'Scaffold a new endpoint following an existing pattern.',
  'test-gen':       "Write tests for a function/module following the project's test conventions.",
  'review':         'Quick review of a diff for rule violations, edge cases, security and tests.',
  'debug':          'Analyze a bug root cause before proposing a fix.',
  'security-review':'Threat-model-style security pass (authz, injection, SSRF, secrets, crypto).',
  'refactor':       'Improve structure without changing behavior, tests-first.',
  'migration':      'Write a safe, reversible, backward-compatible DB/data migration.',
  'incident':       'Handle a production incident: mitigate first, then hotfix and postmortem.',
}

function walk(dir) {
  const out = []
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) out.push(...walk(full))
    else if (e.name.endsWith('.md')) out.push(full)
  }
  return out
}

function descFor(name) {
  return DESC[name] ?? `Run the ${name} skill for this project.`
}

const skills = walk(SKILLS).map(file => {
  const name = path.basename(file, '.md')
  const rel  = path.relative(TEMPLATES, file)   // .ai/skills/workflow/verify.md
  return { name, rel, desc: descFor(name) }
}).sort((a, b) => a.name.localeCompare(b.name))

fs.mkdirSync(AGENTS,   { recursive: true })
fs.mkdirSync(COMMANDS, { recursive: true })
fs.mkdirSync(CURSOR,   { recursive: true })

for (const s of skills) {
  // Copilot CLI custom agent — invoked as `/agent <name>`
  fs.writeFileSync(path.join(AGENTS, `${s.name}.md`),
`---
name: ${s.name}
description: ${s.desc}
---

# ${s.name}

You are running the **${s.name}** skill for this project.

Open and follow the playbook at \`${s.rel}\` exactly — its phases, output format,
and rules are authoritative. Apply the relevant rules in \`.ai/rules/\` and the
project context in \`.ai/AI_CONTEXT.md\`. Do not improvise beyond the playbook.
`)

  // Claude Code slash command — invoked as `/<name>`
  fs.writeFileSync(path.join(COMMANDS, `${s.name}.md`),
`---
description: ${s.desc}
---

Run the **${s.name}** skill. Open and follow the playbook at \`${s.rel}\`
exactly — its phases, output format, and rules are authoritative. Apply the
relevant rules in \`.ai/rules/\` and the context in \`.ai/AI_CONTEXT.md\`.

$ARGUMENTS
`)
}

// Cursor context rule — Cursor has no per-skill invocation, so map names → playbooks.
const list = skills.map(s => `- \`${s.name}\` → \`${s.rel}\``).join('\n')
fs.writeFileSync(path.join(CURSOR, 'ai-scaffold.mdc'),
`---
description: ai-scaffold workflow — rules and skills for this project
alwaysApply: true
---

This project uses ai-scaffold. The single source of truth is
\`.ai/AI_CONTEXT.md\`; always follow the rules in \`.ai/rules/\`.

When asked to run a skill by name, open and follow the matching playbook (if it
is installed):

${list}
`)

console.log(`Generated adapters for ${skills.length} skills:`)
console.log(`  ${AGENTS}`)
console.log(`  ${COMMANDS}`)
console.log(`  ${CURSOR}/ai-scaffold.mdc`)
