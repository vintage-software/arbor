/// <reference path="types/dependency-graph.d.ts" />

import * as path from 'path';

import * as chalk from 'chalk';

import { DepGraph } from 'dependency-graph';

import { Project, Task } from './helpers/project';
import { RunningTask } from './helpers/running-task';
import { ConsoleService } from './services/console.service';
import { LogService } from './services/log.service';
import { ExecResult, ShellService } from './services/shell.service';

export class TaskRunner {
  constructor(private projects: Project[]) {
  }

  runTask(taskName: string, next: () => void, projectNames: string[] = undefined) {
    ConsoleService.log(`Task: ${taskName}`);

    this.startTasks(taskName, projectNames)
      .then(runningTasks => this.renderProgress(taskName, runningTasks))
      .then(() => next())
      .catch((runningTasks: RunningTask[]) => {
        ConsoleService.question('Task failed. Press "y" to restart all projects. Press "f" to restart failed projects. ')
          .then(response => {
            if (response === 'y') {
              ConsoleService.log('');
              this.runTask(taskName, next);
            } else if (response === 'f') {
              let failedProjectNames = runningTasks
                .filter(task => task.success === false)
                .map(task => task.projectName);

              ConsoleService.log('');
              this.runTask(taskName, next, failedProjectNames);
            }
          });
      });
  }

  private startTasks(taskName: string, projectNames: string[] = undefined): Promise<RunningTask[]> {
    return Promise.resolve(this.projects)
      .then(projects => projects.filter(project => project.tasks[taskName] !== undefined))
      .then(projects => projectNames === undefined ? projects : projects.filter(p => projectNames.some(n => p.name === n)))
      .then(projects => this.resolveDependencies(taskName, projects))
      .then(projects => {
        let flattenProjects: Project[] = [].concat.apply([], projects);
        let runningTasks: RunningTask[] = flattenProjects
          .map(project => ({ projectName: project.name, waiting: true }));

        if (projects.length) {
          let next = () => {
            projects.shift();

            if (projects.length) {
              this.runProjectGroup(taskName, runningTasks, projects[0], next);
            }
          };

          this.runProjectGroup(taskName, runningTasks, projects[0], next);
        }

        return runningTasks;
      });
  }

  private runProjectGroup(taskName: string, runningTasks: RunningTask[], projects: Project[], next: () => void) {
    let taskPromises: Promise<void>[] = [];

    for (let project of projects) {
      let task = project.tasks[taskName];

      let runningTask = runningTasks.find(t => t.projectName === project.name);
      runningTask.waiting = false;

      let taskPromise = this.runProjectTask(project, task, runningTask)
        .then(() => {
          runningTask.success = true;
        })
        .catch((result: ExecResult) => {
          this.handleError(project, runningTask, result);
        });

      taskPromises.push(taskPromise);
    }

    Promise.all(taskPromises).then(() => next());
  }

  private runProjectTask(project: Project, task: Task, runningTask: RunningTask): Promise<ExecResult> {
    const maxBuffer = 1024 * 500;

    task = Array.isArray(task) ? task : [task];
    let commands = task
      .map(command => typeof command === 'string' ? { command } : command);

    let runCommands = Promise.resolve(undefined);

    for (let command of commands) {
      runCommands = runCommands
        .then(() => {
          runningTask.status = command.status;
        })
        .then(() => {
          let cwd = command.cwd ? path.join(project.projectPath, command.cwd) : project.projectPath;
          return ShellService.execute(command.command, { cwd, maxBuffer });
        });
    }

    return runCommands;
  }

  private resolveDependencies(taskName: string, projects: Project[]): Project[][] {
    let result: Project[][] = [];

    let projectsToConsider = projects;
    do {
      let depGraph = new DepGraph<Project>();

      for (let project of projectsToConsider) {
        depGraph.addNode(project.name);
      }

      for (let dependant of projectsToConsider) {
        if (dependant.dependencies && dependant.dependencies.length) {
          for (let depencency of dependant.dependencies) {
            if (depGraph.hasNode(depencency)) {
              depGraph.addDependency(dependant.name, depencency);
            }
          }
        }
      }

      let leaves = depGraph.overallOrder(true)
        .map(node => projects.find(project => project.name === node));

      result.push(leaves);

      let addedProjects: Project[] = [].concat.apply([], result);
      projectsToConsider = projects
        .filter(project => addedProjects.find(added => added.name === project.name) === undefined);
    }
    while (projectsToConsider.length > 0);

    let logInfo = `
------------------------------------------------------------------------------------------
Task: ${taskName}

Dependency Graph:

${result.map(group => JSON.stringify(group.map(project => project.name))).join('\n')}
------------------------------------------------------------------------------------------`;

    LogService.log(logInfo, false);

    return result;
  }

  private handleError(project: Project, runningTask: RunningTask, result: ExecResult): void {
    runningTask.success = false;

    let errorText = `
------------------------------------------------------------------------------------------
Project: ${path.join(project.projectPath, 'arbor.json')}
Task: ${runningTask.projectName}
Command: ${result.options.cwd}> ${result.command}

${result.stdout ? `* Standard Output:\n${result.stdout}\n` : ''}
${result.stderr ? `* Standard Error:\n${result.stderr}\n` : ''}
------------------------------------------------------------------------------------------`;

    LogService.log(errorText, true);
  }

  private renderProgress(taskName: string, runningTasks: RunningTask[]): Promise<RunningTask[]> {
    return new Promise<RunningTask[]>((resolve, reject) => {
      let defaultStatus = this.getDefaultStatus(taskName);

      let interval = setInterval(() => {
        let output = '';

        for (let task of runningTasks) {
          if (task.waiting) {
            output += `  ${task.projectName}: ${chalk.gray('waiting...')} \n`;
          } else if (task.success !== undefined) {
            output += `  ${task.projectName}: ${task.success ? chalk.green('done!') : chalk.red('failed!')} \n`;
          } else {
            output += `  ${task.projectName}: ${chalk.yellow(`${task.status ? task.status : defaultStatus}...`)} \n`;
          }
        }

        ConsoleService.progress(output);

        let completedTasks = runningTasks
          .filter(task => task.success !== undefined);

        if (completedTasks.length === runningTasks.length) {
          ConsoleService.finalizeProgress();
          clearInterval(interval);

          let success = runningTasks.every(task => task.success === true);

          if (success) {
            resolve(runningTasks);
          } else {
            reject(runningTasks);
          }
        }
      }, 100);
    });
  }

  private getDefaultStatus(taskName: string): string {
    let status = 'processing';

    if (taskName.indexOf('install') > -1) {
      status = 'installing';
    } else if (taskName.indexOf('build') > -1) {
      status = 'building';
    } else if (taskName.indexOf('test') > -1) {
      status = 'testing';
    }

    return status;
  }
}
