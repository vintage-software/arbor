import { Injectable } from '@angular/core';
import * as path from 'path';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';

import { deleteFolder } from '../../common/helpers/fs.helpers';
import { TaskProgress } from '../../common/interfaces/build';
import { TaskStatus } from '../../common/interfaces/running-task';
import { ProgressService } from './../../arbor/services/progress.service';
import { BuildConfiguration } from './../../common/interfaces/build-configuration';
import { Project } from './../../common/interfaces/project';
import { RunningTask } from './../../common/interfaces/running-task';
import { ShellService } from './../../common/services/shell.service';
import { FirebaseService } from './firebase.service';

const checkoutPath = './checkout/';
const maxParallelOperations = 3;

@Injectable()
export class GitService {
  constructor(private firebase: FirebaseService, private shell: ShellService) { }

  cloneRepos(buildId: number, configuration: BuildConfiguration) {
    let checkoutProgress: TaskProgress[] = [];

    const updateTaskStatus = (task: RunningTask, status: TaskStatus, runningTasks: RunningTask[]) => {
      return Observable.of(undefined)
        .switchMap(() => {
          task.status = status;
          checkoutProgress = ProgressService.computeUpdatedProgress(checkoutProgress, runningTasks);
          return this.firebase.updateBuildProgress(buildId, checkoutProgress, 'checkout');
        });
    };

    return this.firebase.updateBuildProgress(buildId, checkoutProgress, 'checkout')
      .switchMap(() => {
        const cleanTask: RunningTask = {
          taskName: 'clean',
          status: TaskStatus.Waiting,
          project: { name: 'all', projectPath: path.resolve(checkoutPath) }
        };

        return this.clean(cleanTask, (status: TaskStatus) => updateTaskStatus(cleanTask, status, [cleanTask]));
      })
      .switchMap(() => {
        const repoProjects = configuration.repos
          .map<Project>(repo => ({ name: repo, projectPath: path.resolve(path.join(checkoutPath, repo)) }));

        const runningTasks: RunningTask[] = repoProjects
          .map(project => ({ project, taskName: 'clone', status: TaskStatus.Waiting }));

        const cloneSources = runningTasks
          .map(task => this.clone(task, (status: TaskStatus) => updateTaskStatus(task, status, runningTasks)));

        return this.forkJoinWithLimit(cloneSources, maxParallelOperations);
      });
  }

  private clean(task: RunningTask, updateThisTaskStatus: (status: TaskStatus) => Observable<void>) {
    return updateThisTaskStatus(TaskStatus.InProgress)
      .switchMap(() => deleteFolder(task.project.projectPath))
      .switchMap(() => updateThisTaskStatus(TaskStatus.Success))
      .catch(error => updateThisTaskStatus(TaskStatus.Failed).switchMapTo(Observable.throw(error)));
  }

  private clone(task: RunningTask, updateThisTaskStatus: (status: TaskStatus) => Observable<void>) {
    const repo = task.project.name;
    const clonePath = task.project.projectPath;
    const url = `https://github.com/${repo}.git`;

    return updateThisTaskStatus(TaskStatus.InProgress)
      .switchMap(() => this.shell.execute(`git clone --depth 1 ${url} ${clonePath}`))
      .switchMap(() => updateThisTaskStatus(TaskStatus.Success))
      .catch(error => updateThisTaskStatus(TaskStatus.Failed).switchMapTo(Observable.throw(error)));
  }

  private forkJoinWithLimit(sources: Observable<void>[], limit: number) {
    return new Observable<void>(observer => {
      if (sources.length === 0) {
        observer.next(void 0);
        observer.complete();
      }

      const subscriptions: Subscription[] = [];

      let completed = 0;
      const queue = [ ...sources ];

      const destroy = () => {
        for (const subscription of subscriptions) {
          if (subscription && subscription.closed === false) {
            subscription.unsubscribe();
          }
        }
      };

      const handleCompletion = () => {
        completed++;

        if (completed === sources.length) {
          observer.next(void 0);
          observer.complete();
        }
      };

      const next = () => {
        if (queue.length) {
          subscriptions.push(queue.shift()
            .subscribe(() => { handleCompletion(); next(); }, error => { observer.error(error); destroy(); }));
        }
      };

      for (let i = 0; i < limit; i++) {
        next();
      }

      return destroy;
    });
  }
}
