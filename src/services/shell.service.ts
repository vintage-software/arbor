import { exec, ExecOptions } from 'child_process';
import * as path from 'path';

import { RunningTask } from '../helpers/running-task';
import { LogService } from './log.service';

export interface ExecResult {
  command: string;
  options: ExecOptions;
  error: Error;
  stdout: string;
  stderr: string;
}

export class ShellService {
  static execute(command: string, options: ExecOptions, runningTask: RunningTask = undefined): Promise<ExecResult> {
    return new Promise<ExecResult>((resolve, reject) => {
      exec(command, options, (error, stdout, stderr) => {
        let result: ExecResult = { command, options, error, stdout, stderr };

        let logText = runningTask ? ShellService.getLogText(runningTask, result) : undefined;

        if (error) {
          LogService.log(logText, true);
          reject(result);
        } else {
          LogService.log(logText, false);
          resolve(result);
        }
      });
    });
  }

  private static getLogText(runningTask: RunningTask, result: ExecResult) {
    return `
------------------------------------------------------------------------------------------
Config: ${path.join(runningTask.project.projectPath, 'arbor.json')}
Project: ${runningTask.project.name}
Task: ${runningTask.taskName}
Command: ${result.options.cwd}> ${result.command}

${result.stdout ? `* Standard Output:\n${result.stdout}\n` : ''}
${result.stderr ? `* Standard Error:\n${result.stderr}\n` : ''}
------------------------------------------------------------------------------------------`;
  }
}
