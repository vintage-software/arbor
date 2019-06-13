import { Injectable } from '@angular/core';
import * as fs from 'fs';
import * as path from 'path';

import { bail } from './../helpers/error.helpers';
import { ProjectSchema } from './../interfaces/project';

@Injectable()
export class ProjectService {
  constructor() {
  }

  getProjects() {
    const configFiles = this.getConfigs('./');

    return this.readProjects(configFiles)
      .then(projects => this.validateProjects(projects));
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

  private readProjects(configFiles: string[]): Promise<ProjectSchema[]> {
    return new Promise<ProjectSchema[]>((resolve, reject) => {
      const promises = configFiles
        .map(configFile => this.readConfig(configFile));

      Promise.all(promises)
        .then(projects => resolve([].concat.apply([], projects)))
        .catch(error => reject(error));
    });
  }

  private readConfig(configFile: string): Promise<ProjectSchema[]> {
    return new Promise<ProjectSchema[]>((resolve, reject) => {
      fs.readFile(configFile, (error, data) => {
        if (error) {
          reject(error);
        } else {
          const projectPath = path.resolve(path.dirname(configFile));

          let projects: ProjectSchema[] = JSON.parse(data.toString());
          projects = Array.isArray(projects) ? projects : [projects];

          for (const project of projects) {
            project.projectPath = projectPath;
          }

          resolve(projects);
        }
      });
    });
  }

  private validateProjects(projects: ProjectSchema[]) {
    const namePattern = /^[a-z0-9 -]+$/i;
    const nameRule = 'must contain only letters, numbers, spaces, and dashes';

    const taskOptionPattern = /^[a-z0-9,]+$/i;
    const taskOptionRule = 'must contain only letters, numbers, and commas (for separation)';

    for (const project of projects) {
      if (namePattern.test(project.name) === false) {
        bail(`Project names ${nameRule}. (project '${project.name}')`);
      }

      for (const taskName of Object.keys(project.tasks)) {
        if (namePattern.test(taskName) === false) {
          bail(`Task names ${nameRule}. ('${project.name}' project, '${taskName}' task)`);
        }

        const task = project.tasks[taskName];

        const taskCommands = (Array.isArray(task) ? task : [task])
          .map(command => typeof command === 'string' ? { command } : command);

        for (const taskCommand of taskCommands) {
          if (typeof taskCommand.command !== 'string') {
            if (Object.keys(taskCommand.command).includes('') === false) {
              bail(`Task must define a default command. ('${project.name}' project, '${taskName}' task)`);
            }

            for (const taskOption of Object.keys(taskCommand.command)) {
              if (taskOption !== '' && taskOptionPattern.test(taskOption) === false) {
                bail(`Task options ${taskOptionRule}. ('${project.name}' project, '${taskName}' task, '${taskOption}' option)`);
              }
            }
          }
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

    return projects;
  }
}
