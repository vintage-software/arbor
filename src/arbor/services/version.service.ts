import { Injectable } from '@angular/core';
import * as chalk from 'chalk';

import { ConsoleService } from './console.service';
import { ShellService } from './shell.service';

export const currentVersion = require('./../../../package.json').version;

@Injectable()
export class VersionService {
  constructor(private console: ConsoleService, private shell: ShellService) {
  }

  checkForUpdate() {
    return this.shell.execute('npm show arbor version', {})
      .then(result => result.stdout.replace(/(\r\n|\n|\r)/gm, ''))
      .then(latestVersion => { this.showUpdateMessage(latestVersion); })
      .catch(() => Promise.resolve(void 0))
      .then(() => Promise.resolve(void 0));
  }

  private showUpdateMessage(latestVersion: string) {
    if (currentVersion !== latestVersion) {
      this.console.log(`
  New version available. Run ${chalk.yellow('npm install -g arbor')} to update.
  Local Version: ${currentVersion}
  Latest Version: ${latestVersion}
      `);
    }
  }
}
