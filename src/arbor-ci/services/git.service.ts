import { Injectable } from '@angular/core';
import * as path from 'path';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';

import { ProgressService } from './../../arbor/services/progress.service';
import { deleteFolder } from './../../common/helpers/fs.helpers';
import { TaskProgress } from './../../common/interfaces/build';
import { BuildConfiguration, Repo } from './../../common/interfaces/build-configuration';
import { Project } from './../../common/interfaces/project';
import { TaskStatus } from './../../common/interfaces/running-task';
import { RunningTask } from './../../common/interfaces/running-task';
import { ShellService } from './../../common/services/shell.service';
import { AgentService } from './agent.service';
import { GitHubAppService } from './github-app.service';

const checkoutPath = './checkout/';
const maxParallelOperations = 3;

interface CloneProject extends Project {
  repo: Repo;
}

interface CloneTask extends RunningTask {
  project: CloneProject;
}

@Injectable()
export class GitService {
  constructor(private agentService: AgentService, private githubApp: GitHubAppService, private shell: ShellService) { }

  cloneRepos(buildId: number, branch: string, configuration: BuildConfiguration) {
    let checkoutProgress: TaskProgress[] = [];

    const updateTaskStatus = (task: RunningTask, status: TaskStatus, runningTasks: RunningTask[]) => {
      return Observable.of(undefined)
        .switchMap(() => {
          task.status = status;
          checkoutProgress = ProgressService.computeUpdatedProgress(checkoutProgress, runningTasks);
          return this.agentService.updateBuildProgress(buildId, checkoutProgress, 'checkout');
        });
    };

    return this.agentService.updateBuildProgress(buildId, checkoutProgress, 'checkout')
      .switchMap(() => {
        const cleanTask: RunningTask = {
          taskName: 'clean',
          status: TaskStatus.Waiting,
          project: { name: 'all', projectPath: path.resolve(checkoutPath) }
        };

        return this.clean(cleanTask, (status: TaskStatus) => updateTaskStatus(cleanTask, status, [cleanTask]));
      })
      .switchMap(() => this.githubApp.getAccessToken())
      .switchMap(accessToken => {
        const cloneProjects = configuration.repos
          .map<CloneProject>(repo => ({ repo, name: repo.name, projectPath: path.resolve(path.join(checkoutPath, repo.name)) }));

        const cloneTasks: CloneTask[] = cloneProjects
          .map(project => ({ project, taskName: 'clone', status: TaskStatus.Waiting }));

        const cloneSources = cloneTasks
          .map(task => this.clone(task, branch, accessToken, (status: TaskStatus) => updateTaskStatus(task, status, cloneTasks)));

        return this.forkJoinWithLimit(cloneSources, maxParallelOperations);
      });
  }

  private clean(task: RunningTask, updateThisTaskStatus: (status: TaskStatus) => Observable<void>) {
    return updateThisTaskStatus(TaskStatus.InProgress)
      .switchMap(() => deleteFolder(task.project.projectPath))
      .switchMap(() => updateThisTaskStatus(TaskStatus.Success))
      .catch(error => updateThisTaskStatus(TaskStatus.Failed).switchMapTo(Observable.throw(error)));
  }

  private clone(task: CloneTask, branch: string, accessToken: string, updateThisTaskStatus: (status: TaskStatus) => Observable<void>) {
    const repo = task.project.name;
    const clonePath = task.project.projectPath;
    const url = `https://x-access-token:${accessToken}@github.com/${repo}.git`;

    const cloneCommand = task.project.repo.defaultBranchOnly ?
      `git clone --single-branch --depth 1 ${url} ${clonePath}` :
      `git clone --branch ${branch} --single-branch --depth 1 ${url} ${clonePath}`;

    return updateThisTaskStatus(TaskStatus.InProgress)
      .switchMap(() => this.shell.execute(cloneCommand))
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
