import { Injectable } from '@angular/core';
import * as chalk from 'chalk';
import * as path from 'path';

import { RunOptions } from './../helpers/options';
import { Project } from './../helpers/project';
import { RunningTask, TaskStatus } from './../helpers/running-task';
import { ConsoleService } from './console.service';
import { DependencyGraphService } from './dependency-graph.service';
import { LogService } from './log.service';
import { ProjectService } from './project.service';
import { ExecResult, ShellService } from './shell.service';
import { currentVersion } from './version.service';

@Injectable()
export class TaskRunnerService {
  constructor(
    private console: ConsoleService,
    private dependencyGraphService: DependencyGraphService,
    private logService: LogService,
    private projectService: ProjectService,
    private shell: ShellService) {
  }

  runTasks(taskNames: string[], options: RunOptions) {
    this.console.log(`Arbor v${currentVersion}: running tasks ${taskNames.join(', ')} in ${process.cwd()}`);

    if (options.liveLog) {
      this.console.log('Live log is enabled.');
    }

    this.console.log();

    this.logService.deleteLogs();

    if (taskNames.length) {
      this.projectService.getProjects()
        .then(projects => {
          const next = () => {
            taskNames.shift();

            if (taskNames.length) {
              this.runTask(projects, taskNames[0], options, next);
            }
          };

          this.runTask(projects, taskNames[0], options, next);
        });
    }
  }

  runTask(projects: Project[], taskName: string, options: RunOptions, next: () => void, projectNames?: string[]) {
    if (options.progress) {
      this.console.log(`Task: ${taskName}`);
    }

    this.startTasks(projects, taskName, options, projectNames)
      .then(runningTasks => this.waitUntilTaskIsComplete(runningTasks, options.progress))
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
              const failedProjectNames = runningTasks
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
    projectNames?: string[]): Promise<RunningTask[]> {
    return Promise.resolve(allProjects)
      .then(projects => projects.filter(project => project.tasks[taskName] !== undefined))
      .then(projects => projectNames === undefined ? projects : projects.filter(project => projectNames.some(n => project.name === n)))
      .then(projects => this.dependencyGraphService.orderProjectsByDependencyGraph(projects))
      .then(projects => {
        const runningTasks: RunningTask[] = projects
          .map(project => ({ project, taskName, status: TaskStatus.Waiting }));

        const getRunningTask = (projectName: string) => runningTasks.find(runningTask => runningTask.project.name === projectName);

        const next = () => {
          const waitingTasks = runningTasks
            .filter(runningTask =>  runningTask.status === TaskStatus.Waiting);

          for (const runningTask of waitingTasks) {
            const dependencies = (runningTask.project.dependencies ? runningTask.project.dependencies : [])
              .map(dependency => getRunningTask(dependency))
              .filter(dependency => dependency !== undefined);

            const allDepenendenciesSucceeded = dependencies.length === 0 ||
              dependencies.every(dependency => dependency.status === TaskStatus.Success);

            const anyDepenendenciesFailed = dependencies.length > 0 &&
              dependencies.some(dependency => dependency.status === TaskStatus.Failed);

            const anyDepenendenciesBlocked = dependencies.length > 0 &&
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

    const task = runningTask.project.tasks[runningTask.taskName];

    const commands = (Array.isArray(task) ? task : [task])
      .map(command => typeof command === 'string' ? { command } : command);

    let runCommands = Promise.resolve(undefined);

    for (const command of commands) {
      runCommands = runCommands
        .then(() => {
          runningTask.statusText = command.status;
        })
        .then(() => {
          const project = runningTask.project;
          let cwd: string;

          if (command.cwd) {
            cwd = path.normalize(path.join(runningTask.project.projectPath, command.cwd));
          } else if (project.cwd) {
            cwd = path.normalize(path.join(runningTask.project.projectPath, project.cwd));
          } else {
            cwd = runningTask.project.projectPath;
          }

          return Promise.resolve(undefined)
            .then(() => { runningTask.currentCommand = command; })
            .then(() => this.shell.execute(command.command, { cwd }, options.liveLog, runningTask))
            .then(({logText}) => {
              if (options.progress === false) {
                this.console.log(logText);
              }
            });
        });
    }

    return runCommands;
  }

  private waitUntilTaskIsComplete(runningTasks: RunningTask[], progress: boolean): Promise<RunningTask[]> {
    return new Promise<RunningTask[]>((resolve, reject) => {
      const interval = setInterval(() => {
        const output = runningTasks
          .map(runningTask => `  ${runningTask.project.name}: ${this.getStatusText(runningTask)}`)
          .join('\n');

        if (progress) {
          this.console.progress(output);
        }

        const completedTasks = runningTasks
          .filter(runningTask => runningTask.status !== TaskStatus.Waiting && runningTask.status !== TaskStatus.InProcess);

        if (completedTasks.length === runningTasks.length) {
          if (progress) {
            this.console.finalizeProgress();
          }

          clearInterval(interval);

          const allTasksSucceeded = runningTasks.every(runningTask => runningTask.status === TaskStatus.Success);

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
    const defaultStatus = this.getDefaultStatusText(runningTask.taskName);

    let statusText;

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
        const showProgress = runningTask.currentCommand.noProgress !== true;
        const status = `${runningTask.statusText ? runningTask.statusText : defaultStatus}...`;
        const progress = showProgress && runningTask.progressLogLine ? runningTask.progressLogLine : '';

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
