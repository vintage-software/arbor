/// <reference path="../types/dependency-graph.d.ts" />

import * as chalk from 'chalk';
import * as path from 'path';

import { DepGraph } from 'dependency-graph';

import { Injectable } from '@angular/core';

import { Project } from '../helpers/project';
import { RunOptions } from '../helpers/run-options';
import { RunningTask, TaskStatus } from '../helpers/running-task';

import { ConsoleService } from './console.service';
import { LogService } from './log.service';
import { ExecResult, ShellService } from './shell.service';

@Injectable()
export class TaskRunnerService {
  constructor(private console: ConsoleService, private logService: LogService, private shell: ShellService) {
  }

  runTask(projects: Project[], taskName: string, options: RunOptions, next: () => void, projectNames: string[] = undefined) {
    this.console.log(`Task: ${taskName}`);

    this.startTasks(projects, taskName, options, projectNames)
      .then(runningTasks => this.renderProgress(runningTasks))
      .then(() => next())
      .catch((runningTasks: RunningTask[]) => {
        if (Array.isArray(runningTasks) === false) {
          // `runningTasks` is actually an unhandled error.
          console.log(runningTasks.toString());
          process.exit(1);
        }

        this.console.question('Task failed. Press "y" to restart all projects. Press "f" to restart failed projects. ')
          .then(response => {
            if (response === 'y') {
              console.log('');
              this.runTask(projects, taskName, options, next);
            } else if (response === 'f') {
              let failedProjectNames = runningTasks
                .filter(runningTask => runningTask.status === TaskStatus.Failed || runningTask.status === TaskStatus.DependendecyFailed)
                .map(runningTask => runningTask.project.name);

              console.log('');
              this.runTask(projects, taskName, options, next, failedProjectNames);
            } else {
              process.exit(1);
            }
          });
      });
  }

  private startTasks(
    allProjects: Project[],
    taskName: string,
    options: RunOptions,
    projectNames: string[] = undefined): Promise<RunningTask[]> {
    return Promise.resolve(allProjects)
      .then(projects => projects.filter(project => project.tasks[taskName] !== undefined))
      .then(projects => projectNames === undefined ? projects : projects.filter(project => projectNames.some(n => project.name === n)))
      .then(projects => this.orderProjectsByDependencyGraph(taskName, projects))
      .then(projects => {
        let runningTasks: RunningTask[] = projects
          .map(project => ({ project, taskName, status: TaskStatus.Waiting }));

        let getRunningTask = (projectName: string) => runningTasks.find(runningTask => runningTask.project.name === projectName);

        let next = () => {
          let waitingTasks = runningTasks
            .filter(runningTask =>  runningTask.status === TaskStatus.Waiting);

          for (let runningTask of waitingTasks) {
            let dependencies = (runningTask.project.dependencies ? runningTask.project.dependencies : [])
              .map(dependency => getRunningTask(dependency))
              .filter(dependency => dependency !== undefined);

            let allDepenendenciesSucceeded = dependencies.length === 0 ||
              dependencies.every(dependency => dependency.status === TaskStatus.Success);

            let anyDepenendenciesFailed = dependencies.length > 0 &&
              dependencies.some(dependency => dependency.status === TaskStatus.Failed);

            let anyDepenendenciesBlocked = dependencies.length > 0 &&
              dependencies.some(dependency => dependency.status === TaskStatus.DependendecyFailed);

            if (allDepenendenciesSucceeded) {
              this.startTask(runningTask, options)
                .then(() => {
                  runningTask.status = TaskStatus.Success;
                  next();
                })
                .catch(() => {
                  runningTask.status = TaskStatus.Failed;
                  next();
                });
            } else if (anyDepenendenciesFailed || anyDepenendenciesBlocked) {
              runningTask.status = TaskStatus.DependendecyFailed;
            }
          }
        };

        next();

        return runningTasks;
      });
  }

  private startTask(runningTask: RunningTask, options: RunOptions): Promise<ExecResult> {
    runningTask.status = TaskStatus.InProcess;

    let task = runningTask.project.tasks[runningTask.taskName];

    task = Array.isArray(task) ? task : [task];
    let commands = task
      .map(command => typeof command === 'string' ? { command } : command);

    let runCommands = Promise.resolve(undefined);

    for (let command of commands) {
      runCommands = runCommands
        .then(() => {
          runningTask.statusText = command.status;
        })
        .then(() => {
          let cwd = command.cwd ? path.join(runningTask.project.projectPath, command.cwd) : runningTask.project.projectPath;

          return Promise.resolve(undefined)
            .then(() => { runningTask.currentCommand = command; })
            .then(() => this.shell.execute(command.command, { cwd }, options.liveLog, runningTask));
        });
    }

    return runCommands;
  }

  private orderProjectsByDependencyGraph(taskName: string, projects: Project[]): Project[] {
    let dependencyGraph = new DepGraph<Project>();

    for (let project of projects) {
      dependencyGraph.addNode(project.name, project);
    }

    for (let dependant of projects) {
      if (dependant.dependencies && dependant.dependencies.length) {
        for (let depencency of dependant.dependencies) {
          if (dependencyGraph.hasNode(depencency)) {
            dependencyGraph.addDependency(dependant.name, depencency);
          }
        }
      }
    }

    let order = dependencyGraph.overallOrder();

    let orderedProjects = order
      .map(projectName => dependencyGraph.getNodeData(projectName));

    let dependencyGraphText = orderedProjects
      .map(project => ({
        project: project,
        orderedDependencies: order.filter(name => project.dependencies &&  project.dependencies.indexOf(name) > -1)
      }))
      .map(item => `${item.project.name}: ${JSON.stringify(item.orderedDependencies)}`)
      .join('\n');

    let logInfo = `
------------------------------------------------------------------------------------------
Task: ${taskName}

Dependency Graph:

${dependencyGraphText}
------------------------------------------------------------------------------------------`;

    this.logService.log(logInfo, false);

    return orderedProjects;
  }

  private renderProgress(runningTasks: RunningTask[]): Promise<RunningTask[]> {
    return new Promise<RunningTask[]>((resolve, reject) => {
      let interval = setInterval(() => {
        let output = runningTasks
          .map(runningTask => `  ${runningTask.project.name}: ${this.getStatusText(runningTask)}`)
          .join('\n');

        this.console.progress(output);

        let completedTasks = runningTasks
          .filter(runningTask => runningTask.status !== TaskStatus.Waiting && runningTask.status !== TaskStatus.InProcess);

        if (completedTasks.length === runningTasks.length) {
          this.console.finalizeProgress();
          clearInterval(interval);

          let allTasksSucceeded = runningTasks.every(runningTask => runningTask.status === TaskStatus.Success);

          if (allTasksSucceeded) {
            resolve(runningTasks);
          } else {
            reject(runningTasks);
          }
        }
      }, 100);
    });
  }

  private getStatusText(runningTask: RunningTask) {
    let defaultStatus = this.getDefaultStatusText(runningTask.taskName);

    let statusText = undefined;

    switch (runningTask.status) {
      case TaskStatus.Waiting:
        statusText = chalk.gray('waiting...');
        break;
      case TaskStatus.Success:
        statusText = chalk.green('done!');
        break;
      case TaskStatus.Failed:
        statusText = chalk.red('failed!');
        break;
      case TaskStatus.DependendecyFailed:
        statusText = chalk.red('dependency failed!');
        break;
      case TaskStatus.InProcess:
        let showProgress = runningTask.currentCommand.noProgress !== true;
        let status = `${runningTask.statusText ? runningTask.statusText : defaultStatus}...`;
        let progress = showProgress && runningTask.progressLogLine ? runningTask.progressLogLine : '';

        statusText = `${chalk.yellow(status)} ${chalk.gray(progress)}`;
        break;
      default:
        throw new Error(`Unkown task status '${runningTask.status}' in project '${runningTask.project.name}.'`);
    }

    return statusText;
}

  private getDefaultStatusText(taskName: string): string {
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
