import { Injectable } from '@angular/core';

import { ScriptService } from './../services/script.service';

export interface ScriptOptions {
  output: string;
  dryRun: boolean;
}

@Injectable()
export class ScriptCommand {
  constructor(private scriptService: ScriptService) { }

  run(taskNames: string[], options: ScriptOptions) {
    this.scriptService.generateScript(taskNames, options);
  }
}
