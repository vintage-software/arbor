import { Injectable } from '@angular/core';
import * as fs from 'fs';
import * as path from 'path';

import { bail } from './../../common/helpers/error.helpers';
import { Project } from './../../common/interfaces/project';

@Injectable()
export class ProjectService {
  constructor() {
  }

  getProjects(taskNames: string[]) {
    const configFiles = this.getConfigs('./');

    return this.readProjects(configFiles)
      .then(projects => this.validateProjects(projects, taskNames));
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

  private validateProjects(projects: Project[], taskNames: string[]) {
    const namePattern = /^[a-z0-9 -]+$/i;
    const nameRule = 'must contain only letters, numbers, spaces, and dashes';

    for (const project of projects) {
      if (namePattern.test(project.name) === false) {
        bail(`Project names ${nameRule}. ('${project.name}')`);
      }

      for (const taskName of Object.keys(project.tasks)) {
        if (namePattern.test(taskName) === false) {
          bail(`Task names ${nameRule}. ('${project.name}: ${taskName}')`);
        }
      }
    }

    const projectTaskNames = projects
      .map(project => Object.keys(project.tasks).map(taskName => `${project.name}: ${taskName}`))
      .reduce((acc, tasks) => acc.concat(tasks), []);

    for (const projectTaskName of projectTaskNames) {
      if (projectTaskNames.indexOf(projectTaskName) !== projectTaskNames.lastIndexOf(projectTaskName)) {
        bail(`Task '${projectTaskName}' has duplicate definitions.`);
      }
    }

    const knownTaskNames = projects
      .map(project => Object.keys(project.tasks))
      .reduce((previous, current) => previous.concat(current), [])
      .filter((value, index, self) => self.indexOf(value) === index);

    for (const taskName of taskNames) {
      if (knownTaskNames.includes(taskName) === false) {
        bail(`Task '${taskName}' is not defined in any project.`);
      }
    }

    return projects;
  }
}
