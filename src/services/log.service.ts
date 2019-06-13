import * as fs from 'fs';
import { Injectable } from 'injection-js';

const errorLogFile = 'arbor-error.log';
const infoLogFile = 'arbor-info.log';

@Injectable()
export class LogService {
  log(output: string, error: boolean) {
    if (output) {
      const file = error ? errorLogFile : infoLogFile;
      const outputToWrite = output.replace(/\r\n|\r|\n/g, '\r\n');

      fs.appendFileSync(file, outputToWrite);
    }
  }

  deleteLogs() {
    for (const file of [errorLogFile, infoLogFile]) {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    }
  }
}
