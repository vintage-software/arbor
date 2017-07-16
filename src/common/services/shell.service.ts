import { Injectable } from '@angular/core';
import { spawn, SpawnOptions } from 'child_process';

export interface ExecResult {
  cwd: string;
  command: string;
  error: any;
  stdout: string;
  stderr: string;
}

@Injectable()
export class ShellService {
  constructor() { }

  execute(command: string, options?: SpawnOptions, continuousCallback?: (result: ExecResult) => void): Promise<ExecResult> {
    const cwd = options.cwd || process.cwd();

    const commandAndArgs = process.platform === 'win32' ?
      { command: 'cmd', args: ['/c', command] } : { command: 'sh', args: ['-c', command] };

    return new Promise<ExecResult>((resolve, reject) => {
      const result: ExecResult = { cwd, command, stdout: '', stderr: '', error: undefined };
      const spawnedProcess = spawn(commandAndArgs.command, commandAndArgs.args, options);

      spawnedProcess.stdout.on('data', data => { this.processData(result, data, false, continuousCallback); });
      spawnedProcess.stderr.on('data', data => { this.processData(result, data, true, continuousCallback); });

      let done = false;
      const handleResult = (error: Error, code?: number, signal?: string) => {
        if (done === false) {
          result.error = error;

          if (code !== 0) {
            result.error = Object.assign({} , result.error || {}, { code, signal });
          }

          if (result.error !== undefined) {
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

  private processData(result: ExecResult, data: string | Buffer, error: boolean, continuousCallback: (result: ExecResult) => void) {
    const commandInfo = `${result.cwd}> ${result.command}`;
    const output = this.readData(commandInfo, data);

    if (error) {
      result.stderr += output;
    } else {
      result.stdout += output;
    }

    if (continuousCallback) {
      continuousCallback(result);
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
}
