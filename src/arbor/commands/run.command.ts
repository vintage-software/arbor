import { Injectable } from '@angular/core';

import { TaskRunnerService } from './../services/task-runner.service';

export interface RunOptions {
  cwd: string;
}

@Injectable()
export class RunCommand {
  constructor(private taskRunner: TaskRunnerService) { }

  run(taskFlags: string[], options: RunOptions) {
    if (options.cwd && options.cwd.length) {
      this.chdir(options.cwd);
    }

    this.taskRunner.runTasks(taskFlags, options);
  }

  private chdir(cwd: string) {
    try {
      process.chdir(cwd);
    } catch (e) {
      console.log(`fatal: error changing directory to ${cwd}.`);
      process.exit(1);
    }
  }
}
