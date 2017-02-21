import { Injectable } from '@angular/core';

import { ShellService } from './shell.service';

@Injectable()
export class VersionService {
  constructor(private shell: ShellService) {
  }

  getLatestVersion() {
    return this.shell.execute('npm show arbor version', {})
      .then(result => result.stdout.replace(/(\r\n|\n|\r)/gm, ''));
  }
}
