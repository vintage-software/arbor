import * as fs from 'fs';
import * as path from 'path';

import { Injectable } from '@angular/core';

import { Project } from '../helpers/project';

@Injectable()
export class ProjectService {
  constructor() {
  }

  getProjects() {
    let configFiles = this.getConfigs('./');
    return this.readProjects(configFiles);
  }

  private getConfigs(dir: string, filelist: string[] = []): string[] {
    let filePaths = fs.readdirSync(dir);
    for (let filePath of filePaths) {
      let absolutePath = path.join(dir, filePath);
      if (fs.statSync(absolutePath).isDirectory() && !absolutePath.includes('node_modules')) {
        filelist = this.getConfigs(absolutePath, filelist);
      } else if (absolutePath.endsWith('arbor.json')) {
        filelist = filelist.concat(absolutePath);
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
