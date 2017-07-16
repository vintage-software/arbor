import { Injectable } from '@angular/core';
import * as path from 'path';

import { environment } from './../../common/environments/environment';
import { RunOptions } from './../commands/run.command';
import { Project } from './../helpers/project';
import { RunningTask, TaskStatus } from './../helpers/running-task';
import { ConsoleService } from './console.service';
import { DependencyGraphService } from './dependency-graph.service';
import { LogService } from './log.service';
import { ProgressService } from './progress.service';
import { ProjectService } from './project.service';
import { ExecResult, ShellService } from './shell.service';

@Injectable()
export class TaskRunnerService {
  constructor(
    private console: ConsoleService,
    private dependencyGraphService: DependencyGraphService,
    private logService: LogService,
    private progressService: ProgressService,
    private projectService: ProjectService,
    private shell: ShellService) {
  }

  runTasks(taskNames: string[], options: RunOptions) {
    this.console.log(`Arbor v${environment.version}: running tasks ${taskNames.join(', ')} in ${process.cwd()}`);

    this.logService.deleteLogs();

    if (taskNames.length) {
      this.projectService.getProjects()
        .then(projects => {
          const next = () => {
            let taskPromise = Promise.resolve(void 0);

            taskNames.shift();

            if (taskNames.length) {
              taskPromise = this.runTask(projects, taskNames[0], options, next);
            }

            return taskPromise;
          };

          return this.runTask(projects, taskNames[0], options, next);
        });
    }
  }

  runTask(projects: Project[], taskName: string, options: RunOptions, next: () => Promise<void>, projectNames?: string[]) {
    this.console.log(`Task: ${taskName}`);

    return this.startTasks(projects, taskName, projectNames)
      .then(runningTasks => this.waitUntilTaskIsComplete(runningTasks))
      .then(() => next())
      .catch((runningTasks: RunningTask[]) => {
        if (Array.isArray(runningTasks) === false) {
          // `runningTasks` is actually an unhandled error.
          console.log(runningTasks.toString());
          process.exit(1);
        }

        return this.console.question('Task failed. Press "y" to restart all projects. Press "f" to restart failed projects. ')
          .then(response => ({ runningTasks, response }));
      })
      .then(retry => {
        if (retry) {
          const response = retry.response;
          const runningTasks = retry.runningTasks;

          let taskPromise = Promise.resolve(void 0);

          if (response === 'y') {
            console.log('');
            taskPromise = this.runTask(projects, taskName, options, next);
          } else if (response === 'f') {
            const failedProjectNames = runningTasks
              .filter(runningTask => runningTask.status === TaskStatus.Failed || runningTask.status === TaskStatus.DependendecyFailed)
              .map(runningTask => runningTask.project.name);

            console.log('');
            taskPromise = this.runTask(projects, taskName, options, next, failedProjectNames);
          } else {
            process.exit(1);
          }

          return taskPromise;
        }
      });
  }

  private startTasks(
    allProjects: Project[],
    taskName: string,
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
              this.startTask(runningTask)
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

  private startTask(runningTask: RunningTask): Promise<ExecResult> {
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
            .then(() => this.shell.execute(command.command, { cwd }, runningTask));
        });
    }

    return runCommands;
  }

  private waitUntilTaskIsComplete(runningTasks: RunningTask[]): Promise<RunningTask[]> {
    return new Promise<RunningTask[]>((resolve, reject) => {
      const interval = setInterval(() => {
        this.progressService.updateRunningTasks(runningTasks);

        const completedTasks = runningTasks
          .filter(runningTask => runningTask.status !== TaskStatus.Waiting && runningTask.status !== TaskStatus.InProcess);

        if (completedTasks.length === runningTasks.length) {
          this.progressService.finalizeRunningTasks();

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
}
