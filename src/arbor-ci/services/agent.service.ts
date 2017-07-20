import { Injectable } from '@angular/core';
import * as crypto from 'crypto';
import * as os from 'os';
import { Observable } from 'rxjs/Observable';

import { TaskStatus } from '../../common/interfaces/running-task';
import { Build, BuildProgress, BuildStatus, TaskProgress } from './../../common/interfaces/build';
import { BuildConfiguration } from './../../common/interfaces/build-configuration';
import { FirebaseInitService } from './firebase-init.service';

@Injectable()
export class AgentService {
  readonly agentName: string;

  constructor(private firebase: FirebaseInitService) {
    const cwd = process.cwd();
    const hostname = os.hostname();
    const cwdHash = crypto.createHash('md5').update(cwd).digest('hex').substr(0, 5);

    this.agentName = `${hostname}-${cwdHash}`;
  }

  initialize() {
    return this.firebase.initialize(this.agentName);
  }

  getBuildConfigration(name: string) {
    return new Observable<BuildConfiguration>(observer => {
      this.firebase.app.database().ref(`build-configurations/${name}`)
        .once('value')
        .then((snapshot: firebase.database.DataSnapshot) => { observer.next(snapshot.val()); observer.complete(); })
        .catch(error => { observer.error(error); });
    });
  }

  getNextQueuedBuild() {
    return new Observable<Build>(observer => {
      const query = this.firebase.app.database().ref('builds')
        .orderByChild('status')
        .equalTo(BuildStatus.Queued)
        .limitToFirst(1);

      const handleValue = (snapshot: firebase.database.DataSnapshot) => {
        const value = snapshot.val();

        if (value) {
          const buildId = Object.keys(value)[0];

          observer.next({ buildId, ...value[buildId] });
          observer.complete();

          query.off('value', handleValue);
        }
      };

      query.on('value', handleValue);

      return () => { query.off('value', handleValue); };
    });
  }

  getBuild(buildId: number) {
    return new Observable<Build>(observer => {
      this.firebase.app.database().ref(`builds/${buildId}`)
        .once('value')
        .then((snapshot: firebase.database.DataSnapshot) => { observer.next(snapshot.val()); observer.complete(); })
        .catch(error => { observer.error(error); });
    });
  }

  updateBuildProgress(buildId: number, tasks: TaskProgress[], type: 'checkout' | 'tasks') {
    const updateProgress = new Observable<void>(observer => {
      this.firebase.app.database().ref(`builds/${buildId}/progress/${type}`).set(tasks)
        .then(() => { observer.next(void 0); observer.complete(); })
        .catch(error => { observer.error(error); });
    });

    return updateProgress
      .switchMap(() => this.updateBuildStatus(buildId, true))
      .mapTo(void 0);
  }

  updateBuildStatus(buildId: number, inProgress: boolean) {
    return this.getBuild(buildId)
      .map(build => this.calculateBuildStatus(inProgress, build.progress))
      .switchMap(buildStatus => this.setBuildStatus(buildId, buildStatus).mapTo(buildStatus));
  }

  setBuildStatus(buildId: number, buildStatus: BuildStatus) {
    return new Observable<void>(observer => {
      this.firebase.app.database().ref(`builds/${buildId}/status`).set(buildStatus)
        .then(() => { observer.next(void 0); observer.complete(); })
        .catch(error => { observer.error(error); });
    });
  }

  private calculateBuildStatus(inProgress: boolean, buildProgress: BuildProgress) {
    const taskStatuses = (buildProgress ? buildProgress.tasks || [] : [])
      .map(task => task.projects.map(taskProject => taskProject.status))
      .reduce((all, current) => all.concat(current), []);

    const someTasksFailed = taskStatuses.some(taskStatus => [TaskStatus.Failed, TaskStatus.DependendecyFailed].includes(taskStatus));

    if (inProgress && someTasksFailed) {
      return BuildStatus.Failing;
    } else if (inProgress) {
      return BuildStatus.InProgress;
    } else if (someTasksFailed) {
      return BuildStatus.Failed;
    } else {
      return BuildStatus.Passed;
    }
  }
}
