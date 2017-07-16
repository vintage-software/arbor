import { Injectable } from '@angular/core';
import * as program from 'commander';

import { environment } from './../../common/environments/environment';
import { VersionService } from './../../common/services/version.service';

@Injectable()
export class ArborCiProgramService {
  constructor(
    private versionService: VersionService
  ) { }

  run() {
    this.mapVersionFlag();
    this.registerCommands();

    this.versionService.checkForUpdate('arbor-ci')
      .then(() => { program.parse(process.argv); });
  }

  private registerCommands() {
    program.version(environment.version);
  }

  private mapVersionFlag() {
    const vPos = process.argv.indexOf('-v');

    if (vPos > -1) {
      process.argv[vPos] = '-V';
    }
  }
}
