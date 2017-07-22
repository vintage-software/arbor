import { existsSync, readFileSync, statSync } from 'fs';
import * as rimraf from 'rimraf';
import { Observable } from 'rxjs/Observable';

export function readFileIfExists(filename: string) {
  return existsSync(filename) && statSync(filename).isFile() ? readFileSync(filename).toString() : undefined;
}

export function readJsonFileIfExists<T>(filename: string) {
  const json = readFileIfExists(filename);
  return json ? JSON.parse(json) as T : undefined;
}

export function deleteFolder(folderPath: string) {
  return new Observable<void>(observer => {
    rimraf(folderPath, error => {
      if (error) {
        observer.error(error);
      } else {
        observer.next(void 0);
        observer.complete();
      }
    });
  });
}
