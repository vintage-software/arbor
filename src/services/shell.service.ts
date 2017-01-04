import { exec, ExecOptions } from 'child_process';

export interface ExecResult {
  error: Error;
  stdout: string;
  stderr: string;
}

export class ShellService {
  static execute(command: string, options: ExecOptions): Promise<ExecResult> {
    return new Promise<ExecResult>((resolve, reject) => {
      exec(command, options, (error, stdout, stderr) => {
        let result: ExecResult = { error, stdout, stderr };

        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      });
    });
  }
}
