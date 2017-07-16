import { existsSync, readFileSync, statSync } from 'fs';

export function readFileIfExists(filename: string) {
  return existsSync(filename) && statSync(filename).isFile() ? readFileSync(filename).toString() : undefined;
}
