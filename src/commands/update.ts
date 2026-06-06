import chalk from 'chalk'
import { install } from './install.js'

export async function update(): Promise<void> {
  console.log(chalk.bold('\nai-scaffold — update\n'))
  console.log(chalk.gray('Showing diff against latest templates...\n'))
  await install()
}
