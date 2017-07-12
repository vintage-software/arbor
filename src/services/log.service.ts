import { Injectable } from '@angular/core';
import * as fs from 'fs';

const errorLogFile = 'arbor-error.log';
const infoLogFile = 'arbor-info.log';
const liveLogFile = 'arbor-live.log';

@Injectable()
export class LogService {
  log(output: string, error: boolean) {
    if (output) {
      const file = error ? errorLogFile : infoLogFile;
      const outputToWrite = output.replace(/\r\n|\r|\n/g, '\r\n');

      fs.appendFileSync(file, outputToWrite);
    }
  }

  liveLog(output: string) {
    if (output) {
      const outputToWrite = output.replace(/\r\n|\r|\n/g, '\r\n');
      fs.writeFileSync(liveLogFile, outputToWrite);
    } else if (fs.existsSync(liveLogFile)) {
      fs.unlinkSync(liveLogFile);
    }
  }

  deleteLogs() {
    for (const file of [errorLogFile, infoLogFile, liveLogFile]) {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    }
  }
}
