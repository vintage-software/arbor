import chalk = require('chalk');
import { Injectable } from 'injection-js';

import { ConsoleService } from './console.service';
import { ShellService } from './shell.service';

@Injectable()
export class VersionService {
  static readonly version: string = require('./../../package.json').version;

  constructor(private console: ConsoleService, private shell: ShellService) {
  }

  checkForUpdate(packageName: string) {
    return this.shell.execute(`npm show ${packageName} version`, {})
      .then(result => result.stdout.replace(/(\r\n|\n|\r)/gm, ''))
      .then(latestVersion => { this.showUpdateMessage(latestVersion, packageName); })
      .catch(() => Promise.resolve(void 0))
      .then(() => Promise.resolve(void 0));
  }

  private showUpdateMessage(latestVersion: string, packageName: string) {
    if (VersionService.version !== latestVersion) {
      this.console.log(`
  New version available. Run ${chalk.yellow(`npm install -g ${packageName}`)} to update.
  Local Version: ${VersionService.version}
  Latest Version: ${latestVersion}
      `);
    }
  }
}
