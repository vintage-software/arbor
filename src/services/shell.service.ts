import { spawn, SpawnOptions } from 'child_process';
import * as path from 'path';

import { RunningTask } from '../helpers/running-task';
import { LogService } from './log.service';

export interface ExecResult {
  cwd: string;
  command: string;
  error: any;
  stdout: string;
  stderr: string;
}

export interface RunningProcess {
  runningTask: RunningTask;
  result: ExecResult;
}

export class ShellService {
  static runningProcesses: { [pid: number]: RunningProcess } = {};

  static execute(command: string, options?: SpawnOptions, runningTask: RunningTask = undefined): Promise<ExecResult> {
    let cwd = options.cwd || process.cwd();
    let commandInfo = `${cwd}> ${command}`;

    let commandAndArgs = process.platform === 'win32' ?
      { command: 'cmd', args: ['/c', command] } : { command: 'sh', args: ['-c', command] };

    return new Promise<ExecResult>((resolve, reject) => {
      let result: ExecResult = { cwd, command, stdout: '', stderr: '', error: undefined };
      let runningProcess: RunningProcess = { runningTask, result };
      let spawnedProcess = spawn(commandAndArgs.command, commandAndArgs.args, options);

      ShellService.runningProcesses[spawnedProcess.pid] = runningProcess;
      ShellService.writeLiveLog();

      spawnedProcess.stdout.on('data', data => {
        result.stdout += ShellService.readData(commandInfo, data);
        ShellService.writeLiveLog();
      });

      spawnedProcess.stderr.on('data', data => {
        result.stderr += ShellService.readData(commandInfo, data);
        ShellService.writeLiveLog();
      });

      let done = false;
      let handleResult = (error: Error, code?: number, signal?: string) => {
        if (done === false) {
          result.error = error;

          if (code !== 0) {
            result.error = Object.assign({} , result.error || {}, { code, signal });
          }

          let isError = result.error !== undefined;
          let logText = runningTask ? ShellService.getLogText(runningTask, result) : undefined;
          LogService.log(logText, isError);

          ShellService.runningProcesses[spawnedProcess.pid] = undefined;
          ShellService.writeLiveLog();

          if (isError) {
            reject(result);
          } else {
            resolve(result);
          }

          done = true;
        }
      };

      spawnedProcess.on('error', (error: Error) => { handleResult(error); });
      spawnedProcess.on('exit', (code, signal) => { handleResult(undefined, code, signal); });
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

  private static writeLiveLog() {
    let liveLogText = Object.keys(ShellService.runningProcesses)
      .map(pid => ShellService.runningProcesses[parseInt(pid, 10)])
      .filter(runningProcess => runningProcess !== undefined && runningProcess.runningTask !== undefined)
      .map(runningProcess => ShellService.getLogText(runningProcess.runningTask, runningProcess.result))
      .join('\n');

    LogService.liveLog(liveLogText);
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
