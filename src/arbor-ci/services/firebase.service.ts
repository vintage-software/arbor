import { Injectable } from '@angular/core';
import * as firebase from 'firebase-admin';
import { Observable } from 'rxjs/Observable';

import { readFileIfExists } from '../../common/helpers/fs.helpers';
import { TaskStatus } from '../../common/interfaces/running-task';
import { Build, BuildProgress, BuildStatus, TaskProgress } from './../../common/interfaces/build';
import { BuildConfiguration } from './../../common/interfaces/build-configuration';

const firebaseConfigPath = './arbor-firebase-config.json';

interface FirebaseConfig {
  crendential: firebase.ServiceAccount;
  databaseURL: string;
}

@Injectable()
export class FirebaseService {
  private readonly firebaseDatabase: firebase.database.Database;

  constructor() {
    const firebaseConfigJson = readFileIfExists(firebaseConfigPath);

    if (firebaseConfigJson) {
      const firebaseConfig: FirebaseConfig = JSON.parse(firebaseConfigJson);

      const firebaseApp = firebase.initializeApp({
        credential: firebase.credential.cert(firebaseConfig.crendential),
        databaseURL: firebaseConfig.databaseURL
      });

      this.firebaseDatabase = firebaseApp.database();
      this.firebaseDatabase.goOnline();
    }
  }

  getBuildConfigration(name: string) {
    return new Observable<BuildConfiguration>(observer => {
      this.firebaseDatabase.ref(`build-configurations/${name}`)
        .once('value')
        .then((snapshot: firebase.database.DataSnapshot) => { observer.next(snapshot.val()); observer.complete(); })
        .catch(error => { observer.error(error); });
    });
  }

  getNextQueuedBuild() {
    return new Observable<Build>(observer => {
      const query = this.firebaseDatabase.ref('builds')
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
      this.firebaseDatabase.ref(`builds/${buildId}`)
        .once('value')
        .then((snapshot: firebase.database.DataSnapshot) => { observer.next(snapshot.val()); observer.complete(); })
        .catch(error => { observer.error(error); });
    });
  }

  updateBuildProgress(buildId: number, tasks: TaskProgress[], type: 'checkout' | 'tasks') {
    const updateProgress = new Observable<void>(observer => {
      this.firebaseDatabase.ref(`builds/${buildId}/progress/${type}`).set(tasks)
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
      this.firebaseDatabase.ref(`builds/${buildId}/status`).set(buildStatus)
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
