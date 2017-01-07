import { ShellService } from './shell.service';

export class VersionService {
  static getLatestVersion() {
    return ShellService.execute('npm show arbor version', {})
      .then(result => result.stdout.replace(/(\r\n|\n|\r)/gm, ''));
  }
}
