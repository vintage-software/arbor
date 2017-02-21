import { spawn, SpawnOptions } from 'child_process';
import * as path from 'path';

import { Injectable } from '@angular/core';

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

@Injectable()
export class ShellService {
  runningProcesses: { [pid: number]: RunningProcess } = {};

  constructor(private logService: LogService) {
  }

  execute(command: string, options?: SpawnOptions, runningTask: RunningTask = undefined): Promise<ExecResult> {
    let cwd = options.cwd || process.cwd();
    let commandInfo = `${cwd}> ${command}`;

    let commandAndArgs = process.platform === 'win32' ?
      { command: 'cmd', args: ['/c', command] } : { command: 'sh', args: ['-c', command] };

    return new Promise<ExecResult>((resolve, reject) => {
      let result: ExecResult = { cwd, command, stdout: '', stderr: '', error: undefined };
      let runningProcess: RunningProcess = { runningTask, result };
      let spawnedProcess = spawn(commandAndArgs.command, commandAndArgs.args, options);

      this.runningProcesses[spawnedProcess.pid] = runningProcess;
      this.writeLiveLog();

      spawnedProcess.stdout.on('data', data => {
        result.stdout += this.readData(commandInfo, data);
        this.writeLiveLog();
      });

      spawnedProcess.stderr.on('data', data => {
        result.stderr += this.readData(commandInfo, data);
        this.writeLiveLog();
      });

      let done = false;
      let handleResult = (error: Error, code?: number, signal?: string) => {
        if (done === false) {
          result.error = error;

          if (code !== 0) {
            result.error = Object.assign({} , result.error || {}, { code, signal });
          }

          let isError = result.error !== undefined;
          let logText = runningTask ? this.getLogText(runningTask, result) : undefined;
          this.logService.log(logText, isError);

          this.runningProcesses[spawnedProcess.pid] = undefined;
          this.writeLiveLog();

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

  private readData(commandInfo: string, buffer: string | Buffer) {
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

  private writeLiveLog() {
    let liveLogText = Object.keys(this.runningProcesses)
      .map(pid => this.runningProcesses[parseInt(pid, 10)])
      .filter(runningProcess => runningProcess !== undefined && runningProcess.runningTask !== undefined)
      .map(runningProcess => this.getLogText(runningProcess.runningTask, runningProcess.result))
      .join('\n');

    this.logService.liveLog(liveLogText);
  }

  private getLogText(runningTask: RunningTask, result: ExecResult) {
    return `
------------------------------------------------------------------------------------------
Config: ${path.join(runningTask.project.projectPath, 'arbor.json')}
Project: ${runningTask.project.name}
Task: ${runningTask.taskName}
Command: ${result.cwd}> ${result.command}

${result.error ? `* Error:\n${JSON.stringify(result.error)}\n` : ''}
${result.stdout ? `* Standard Output:\n${this.formatOutput(result.stdout)}\n` : ''}
${result.stderr ? `* Standard Error:\n${this.formatOutput(result.stderr)}\n` : ''}
------------------------------------------------------------------------------------------`;
  }

  private formatOutput(output: string) {
    const backspaces = /[\b][\b|\s]+[\b]/g;

    return output
      .replace(backspaces, '\n')
      .trim();
  }
}
