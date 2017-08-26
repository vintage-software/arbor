import { Injectable } from '@angular/core';

import { getStatusText } from '../../common/helpers/progress.helpers';
import { RunningTask, } from './../../common/interfaces/running-task';
import { ConsoleService } from './../../common/services/console.service';

@Injectable()
export class ProgressService {

  constructor(private console: ConsoleService) { }

  updateRunningTasks(runningTasks: RunningTask[]) {
    if (process.send) {
      process.send({ type: 'running-tasks', runningTasks });
    }

    const output = runningTasks
      .map(runningTask => `  ${runningTask.project.name}: ${getStatusText(runningTask)}`)
      .join('\n');

    this.console.progress(output);
  }

  finalizeRunningTasks() {
    this.console.finalizeProgress();
  }
}
