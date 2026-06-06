import { createTwoFilesPatch } from 'diff'
import chalk from 'chalk'

export function createDiff(oldContent: string, newContent: string, filename: string): string {
  return createTwoFilesPatch(
    `current/${filename}`, `incoming/${filename}`,
    oldContent, newContent, '', '', { context: 3 }
  )
}

export function renderDiff(diffText: string): string {
  return diffText.split('\n').map(line => {
    if (line.startsWith('+++') || line.startsWith('---')) return chalk.bold(line)
    if (line.startsWith('+')) return chalk.green(line)
    if (line.startsWith('-')) return chalk.red(line)
    if (line.startsWith('@@')) return chalk.cyan(line)
    return line
  }).join('\n')
}
