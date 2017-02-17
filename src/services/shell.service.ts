import { spawn, SpawnOptions } from 'child_process';
import * as path from 'path';

import { RunningTask } from '../helpers/running-task';
import { LogService } from './log.service';

export interface ExecResult {
  cwd: string;
  command: string;
  error: Error;
  stdout: string;
  stderr: string;
}

export class ShellService {
  static execute(command: string, options?: SpawnOptions, runningTask: RunningTask = undefined): Promise<ExecResult> {
    let cwd = options.cwd || process.cwd();
    let commandInfo = `${cwd}> ${command}`;

    let commandAndArgs = process.platform === 'win32' ?
      { command: 'cmd', args: ['/c', command] } : { command: 'sh', args: ['-c', command] };

    return new Promise<ExecResult>((resolve, reject) => {
      let spawnedProcess = spawn(commandAndArgs.command, commandAndArgs.args, options);

      let stdout = '';
      let stderr = '';

      spawnedProcess.stdout.on('data', data => { stdout += ShellService.readData(commandInfo, data); });
      spawnedProcess.stderr.on('data', data => { stderr += ShellService.readData(commandInfo, data); });

      spawnedProcess.on('error', (error: Error) => {
        let result: ExecResult = { cwd, command, stdout, stderr, error };

        let logText = runningTask ? ShellService.getLogText(runningTask, result) : undefined;
        LogService.log(logText, true);

        spawnedProcess.kill('SIGINT');

        reject(result);
      });

      spawnedProcess.on('exit', () => {
        let result: ExecResult = { cwd, command, stdout, stderr, error: undefined };

        let logText = runningTask ? ShellService.getLogText(runningTask, result) : undefined;
        LogService.log(logText, false);

        resolve(result);
      });
    });
  }

  private static readData(commandInfo: string, buffer: string | Buffer) {
    let chunk = '';

    if (buffer.length > 0) {
      chunk = '<< String sent back was too long >>';
      try {
        chunk = buffer.toString();
      } catch (e) {
        chunk = `<< Lost chunk of process output for ${commandInfo} - length was ${buffer.length}>>`;
      }
    }

    return chunk;
  }

  private static getLogText(runningTask: RunningTask, result: ExecResult) {
    return `
------------------------------------------------------------------------------------------
Config: ${path.join(runningTask.project.projectPath, 'arbor.json')}
Project: ${runningTask.project.name}
Task: ${runningTask.taskName}
Command: ${result.cwd}> ${result.command}

${result.error ? `* Error:\n${JSON.stringify(result.error)}\n` : ''}
${result.stdout ? `* Standard Output:\n${result.stdout}\n` : ''}
${result.stderr ? `* Standard Error:\n${result.stderr}\n` : ''}
------------------------------------------------------------------------------------------`;
  }
}
