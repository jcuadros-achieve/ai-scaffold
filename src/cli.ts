#!/usr/bin/env node
import { install } from './commands/install.js'
import { update }  from './commands/update.js'
import { diff }    from './commands/diff.js'
import { status }  from './commands/status.js'
import chalk from 'chalk'

const [,, command = 'install'] = process.argv

const commands: Record<string, () => Promise<void>> = {
  install: () => install(),
  update:  () => update(),
  diff:    () => diff(),
  status:  () => status(),
}

if (!commands[command]) {
  console.error(chalk.red(`Unknown command: ${command}`))
  console.log('Usage: ai-scaffold [install|update|diff|status]')
  process.exit(1)
}

commands[command]().catch(err => {
  console.error(chalk.red('Error:'), err.message)
  process.exit(1)
})
