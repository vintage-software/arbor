import { Injectable } from '@angular/core';
import * as chalk from 'chalk';
import { writeFileSync } from 'fs';
import * as path from 'path';

import { ScriptOptions } from './../helpers/options';
import { Project } from './../helpers/project';
import { DependencyGraphService } from './dependency-graph.service';
import { ProjectService } from './project.service';
import { currentVersion } from './version.service';

@Injectable()
export class ScriptService {
  constructor(
    private dependencyGraphService: DependencyGraphService,
    private projectService: ProjectService) { }

  generateScript(taskNames: string[], options: ScriptOptions) {
    if (options.output === undefined) {
      console.log(chalk.red('output path is required.'));
    }

    if (taskNames.length) {
      console.log(`Arbor v${currentVersion}: scripting tasks ${taskNames.join(', ')} in ${process.cwd()}`);

      this.projectService.getProjects()
        .then(projects => this.dependencyGraphService.orderProjectsByDependencyGraph(projects))
        .then(projects => {
          let script = 'echo off';

          for (const taskName of taskNames) {
            script += this.generateTaskScript(taskName, projects);
          }

          script += `
goto success

:error
echo ${this.colorEcho('There was an error in the above task. Exiting...', 31)}
exit /b 1

:success
exit /b`;

          writeFileSync(options.output, script);
        });
    }
  }

  private generateTaskScript(taskName: string, allProjects: Project[]) {
    let script = '';

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

        script += `
echo;
echo ${this.colorEcho(`*** Running task "${taskName} in project "${project.name}" (${cwd}). ***`, 32)}
echo;
echo ${this.colorEcho(`${cwd}^> ${command.command}`, 90)}
pushd ${cwd}
call ${command.command}
if errorlevel 1 goto error
popd`;
      }
    }

    return script;
  }

  private colorEcho(message: string, color: number) {
    // color code reference: https://gist.github.com/mlocati/fdabcaeb8071d5c75a2d51712db24011#file-win10colors-cmd
    return `[${color}m${message}[0m`;
  }
}
