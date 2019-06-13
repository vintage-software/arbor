import { Injectable } from '@angular/core';
import * as chalk from 'chalk';
import { writeFileSync } from 'fs';
import * as path from 'path';

import { ScriptOptions } from './../commands/script.command';
import { Project } from './../interfaces/project';
import { DependencyGraphService } from './dependency-graph.service';
import { ProjectService } from './project.service';
import { TaskService } from './task.service';
import { VersionService } from './version.service';

@Injectable()
export class ScriptService {
  constructor(
    private dependencyGraphService: DependencyGraphService,
    private projectService: ProjectService,
    private taskService: TaskService) { }

  generateScript(taskFlags: string[], options: ScriptOptions) {
    if (options.output === undefined) {
      console.log(chalk.red('output path is required.'));
    }

    if (taskFlags.length) {
      console.log(`Arbor v${VersionService.version}: scripting tasks ${taskFlags.join(', ')} in ${process.cwd()}`);

      this.projectService.getProjects()
        .then(projects => this.taskService.matchTasks(projects, taskFlags))
        .then(projects => {
          let script = 'echo off';

          for (const taskFlag of taskFlags) {
            script += this.generateTaskScript(taskFlag, projects);
          }

          script += `
goto success

:error
echo;
echo ${this.colorEcho('*** There was an error in the above task. Exiting... ***', 31)}
exit /b 1

:success
exit /b`;

          if (options.dryRun) {
            console.log();
            console.log(chalk.green(`Dry run. '${options.output}' was not written.`));
          } else {
            writeFileSync(options.output, script);

            console.log();
            console.log(chalk.green(`'${options.output}' has been written.`));
          }
        });
    }
  }

  private generateTaskScript(taskFlag: string, allProjects: Project[]) {
    let script = '';

    console.log();
    console.log(`scripting ${taskFlag}:`);

    const projects = this.dependencyGraphService.orderProjectsByDependencyGraph(allProjects.filter(project => project.tasks[taskFlag] !== undefined));

    for (const project of projects) {
      const task = project.tasks[taskFlag];

      script += `
echo;
echo ${this.colorEcho(`*** Running task "${taskFlag}" in project "${project.name}." ***`, 32)}`;

      for (const command of task) {
        let cwd: string;

        if (command.cwd) {
          cwd = path.normalize(path.join(project.projectPath, command.cwd));
        } else if (project.cwd) {
          cwd = path.normalize(path.join(project.projectPath, project.cwd));
        } else {
          cwd = project.projectPath;
        }

        console.log(`${chalk.gray(cwd)}> ${command.command}`);

        script += `
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
