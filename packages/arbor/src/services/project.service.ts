import { Injectable } from '@angular/core';
import * as fs from 'fs';
import * as path from 'path';

import { Project } from './../helpers/project';

@Injectable()
export class ProjectService {
  constructor() {
  }

  getProjects() {
    const configFiles = this.getConfigs('./');
    return this.readProjects(configFiles);
  }

  private getConfigs(dir: string, filelist: string[] = []): string[] {
    const filePaths = fs.readdirSync(dir);
    for (const filePath of filePaths) {
      const absolutePath = path.join(dir, filePath);
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
      const promises = configFiles
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
          const projectPath = path.resolve(path.dirname(configFile));

          let projects: Project[] = JSON.parse(data.toString());
          projects = Array.isArray(projects) ? projects : [projects];

          for (const project of projects) {
            project.projectPath = projectPath;
          }

          resolve(projects);
        }
      });
    });
  }
}
