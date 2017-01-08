import * as fs from 'fs';
import * as path from 'path';

import { Project } from '../helpers/project';

export class ProjectService {
  constructor(private currentWorkingDirectory: string) {
  }

  getProjects() {
    let configFiles = this.getConfigs(this.currentWorkingDirectory);
    return this.readProjects(configFiles);
  }

  private getConfigs(dir: string, filelist: string[] = []): string[] {
    let filePaths = fs.readdirSync(dir);
    for (let filePath of filePaths) {
      if (fs.statSync(path.join(dir, filePath)).isDirectory() && !path.join(dir, filePath).includes('node_modules')) {
        filelist = this.getConfigs(path.join(dir, filePath), filelist);
      } else if (path.join(dir, filePath).endsWith('arbor.json')) {
        filelist = filelist.concat(path.join(dir, filePath));
      }
    }

    return filelist;
  }

  private readProjects(configFiles: string[]): Promise<Project[]> {
    return new Promise<Project[]>((resolve, reject) => {
      let promises = configFiles
        .map(configFile => this.readConfig(configFile));

      Promise.all(promises)
        .then(projects => resolve([].concat.apply([], projects)))
        .catch(error => reject(error));
    });
  }

  private readConfig(configFile: string): Promise<Project[]> {
    return new Promise<Project[]>((resolve, reject) => {
      fs.readFile(configFile, (error, data) => {
        if (error) {
          reject(error);
        } else {
          let projectPath = path.resolve(path.dirname(configFile));

          let projects: Project[] = JSON.parse(data.toString());
          projects = Array.isArray(projects) ? projects : [projects];

          for (let project of projects) {
            project.projectPath = projectPath;
          }

          resolve(projects);
        }
      });
    });
  }

}
