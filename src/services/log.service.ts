import * as fs from 'fs';

const errorLogFile = 'arbor-error.log';
const infoLogFile = 'arbor-info.log';

export class LogService {
  static log(output: string, error: boolean) {
    let file = error ? errorLogFile : infoLogFile;
    let outputToWrite = output.replace(/\r\n|\r|\n/g, '\r\n');

    fs.appendFileSync(file, outputToWrite);
  }

  static deleteLogs() {
    if (fs.existsSync(errorLogFile)) {
      fs.unlinkSync(errorLogFile);
    }

    if (fs.existsSync(infoLogFile)) {
      fs.unlinkSync(infoLogFile);
    }
  }
}
