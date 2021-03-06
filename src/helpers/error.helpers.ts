
import chalk from 'chalk';

export function bail(message: string) {
  console.error(chalk.red(`Error: ${message}`));
  process.exit(1);
}
