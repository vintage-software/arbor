import { Injectable } from 'injection-js';

import { getStatusText } from '../helpers/progress.helpers';
import { RunningTask, } from './../interfaces/running-task';
import { ConsoleService } from './../services/console.service';

@Injectable()
export class ProgressService {

  constructor(private console: ConsoleService) { }

  updateRunningTasks(runningTasks: RunningTask[]) {
    const output = runningTasks
      .map(runningTask => `  ${runningTask.project.name}: ${getStatusText(runningTask)}`)
      .join('\n');

    this.console.progress(output);
  }

  finalizeRunningTasks() {
    this.console.finalizeProgress();
  }
}
