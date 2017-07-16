import { Injectable } from '@angular/core';
import { spawn, SpawnOptions } from 'child_process';
import * as path from 'path';

import { RunningTask } from './../helpers/running-task';
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

  execute(command: string, options?: SpawnOptions, runningTask?: RunningTask): Promise<ExecResult> {
    const cwd = options.cwd || process.cwd();

    const commandAndArgs = process.platform === 'win32' ?
      { command: 'cmd', args: ['/c', command] } : { command: 'sh', args: ['-c', command] };

    return new Promise<ExecResult>((resolve, reject) => {
      const result: ExecResult = { cwd, command, stdout: '', stderr: '', error: undefined };
      const runningProcess: RunningProcess = { runningTask, result };
      const spawnedProcess = spawn(commandAndArgs.command, commandAndArgs.args, options);

      this.runningProcesses[spawnedProcess.pid] = runningProcess;

      spawnedProcess.stdout.on('data', data => { this.processData(result, runningTask, data, false); });
      spawnedProcess.stderr.on('data', data => { this.processData(result, runningTask, data, true); });

      let done = false;
      const handleResult = (error: Error, code?: number, signal?: string) => {
        if (done === false) {
          result.error = error;

          if (code !== 0) {
            result.error = Object.assign({} , result.error || {}, { code, signal });
          }

          const isError = result.error !== undefined;
          const logText = runningTask ? this.getLogText(runningTask, result) : undefined;
          this.logService.log(logText, isError);

          this.runningProcesses[spawnedProcess.pid] = undefined;

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

  private processData(result: ExecResult, runningTask: RunningTask, data: string | Buffer, error: boolean) {
    const commandInfo = `${result.cwd}> ${result.command}`;
    const output = this.readData(commandInfo, data);

    if (error) {
      result.stderr += output;
    } else {
      result.stdout += output;
    }

    if (runningTask) {
      this.updateProgressLogLine(runningTask, result);
    }
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

  private updateProgressLogLine(runningTask: RunningTask, result: ExecResult) {
    const progressPattern = /[0-9]+%/;

    const output = this.formatOutput(result.stdout).trim();
    const lastLine = output.substring(output.lastIndexOf('\n'));

    const stderr = this.formatOutput(result.stderr).trim();
    const lastErrorLine = stderr.substring(stderr.lastIndexOf('\n'));

    runningTask.progressLogLine = progressPattern.test(lastErrorLine) ?
      lastErrorLine.trim() :
      (lastLine ? lastLine.trim() : undefined);
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
