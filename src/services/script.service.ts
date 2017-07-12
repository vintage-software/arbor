import { Injectable } from '@angular/core';
import * as path from 'path';

import { Project } from './../helpers/project';
import { DependencyGraphService } from './dependency-graph.service';
import { ProjectService } from './project.service';

@Injectable()
export class ScriptService {
  constructor(
    private dependencyGraphService: DependencyGraphService,
    private projectService: ProjectService) { }

  generateScript(taskNames: string[]) {
    if (taskNames.length) {
      this.projectService.getProjects()
        .then(projects => this.dependencyGraphService.orderProjectsByDependencyGraph(projects))
        .then(projects => {
          console.log('echo off');

          for (const taskName of taskNames) {
            this.generateTaskScript(taskName, projects);
          }

          console.log(`
goto success

:error
echo ${this.colorEcho('There was an error in the above task. Exiting...', 31)}
exit /b 1

:success
exit /b`);
        });
    }
  }

  private generateTaskScript(taskName: string, allProjects: Project[]) {
    const projects = allProjects.filter(project => project.tasks[taskName] !== undefined);

    for (const project of projects) {
      const task = project.tasks[taskName];

      const commands = (Array.isArray(task) ? task : [task])
        .map(command => typeof command === 'string' ? { command } : command);


      for (const command of commands) {
        let cwd: string;

        if (command.cwd) {
          cwd = path.normalize(path.join(project.projectPath, command.cwd));
        } else if (project.cwd) {
          cwd = path.normalize(path.join(project.projectPath, project.cwd));
        } else {
          cwd = project.projectPath;
        }

        console.log(`
echo;
echo ${this.colorEcho(`*** Running task "${taskName} in project "${project.name}" (${cwd}). ***`, 32)}
echo;
echo ${this.colorEcho(`${cwd}^> ${command.command}`, 90)}
pushd ${cwd}
call ${command.command}
if errorlevel 1 goto error
popd`);
      }
    }
  }

  private colorEcho(message: string, color: number) {
    // color code reference: https://gist.github.com/mlocati/fdabcaeb8071d5c75a2d51712db24011#file-win10colors-cmd
    return `[${color}m${message}[0m`;
  }
}
