import { Injectable } from '@angular/core';
import * as crypto from 'crypto';
import * as os from 'os';
import { Observable } from 'rxjs/Observable';

import { TaskStatus } from '../../common/interfaces/running-task';
import { mapToArray, SimpleMap } from './../../common/helpers/object.helpers';
import { RxFire } from './../../common/helpers/rx-fire';
import { agentPingDelay, Agent, AgentStatus } from './../../common/interfaces/agent';
import { Build, BuildProgress, BuildStatus, TaskProgress } from './../../common/interfaces/build';
import { BuildConfiguration } from './../../common/interfaces/build-configuration';
import { FirebaseInitService } from './firebase-init.service';

@Injectable()
export class AgentService {
  readonly agentName: string;

  private readonly rxFire: RxFire;

  constructor(private firebase: FirebaseInitService) {
    const cwd = process.cwd();
    const hostname = os.hostname();
    const cwdHash = crypto.createHash('md5').update(cwd).digest('hex').substr(0, 5);

    this.agentName = `${hostname}-${cwdHash}`;
    this.rxFire = new RxFire(firebase.app.database());
  }

  initialize() {
    return this.firebase.initialize(this.agentName)
      .do(() => { this.pingFirebaseContinuously(); });
  }

  setAgentStatus(agentStatus: AgentStatus, buildId: number = null) {
    const agent: Agent = {
      name: this.agentName,
      status: agentStatus,
      buildId: buildId,
      utcLastPingTimestamp: new Date().getTime()
    };

    return this.rxFire.set(`agents/${this.agentName}`, agent);
  }

  getBuildConfigration(name: string) {
    return this.rxFire.get<BuildConfiguration>(`build-configurations/${name}`).first();
  }

  getNextQueuedBuild(): Observable<Build> {
    const nextQueuedBuildQuery = (ref: firebase.database.Reference) => ref
      .orderByChild('status')
      .equalTo(BuildStatus.Queued)
      .limitToFirst(1);

    const setBuildAgent = (build: Build) => ({ ...build, agent: build.agent || this.agentName });

    return this.rxFire.get<SimpleMap<Build>>('builds', nextQueuedBuildQuery)
      .first()
      .map(buildMap => mapToArray(buildMap)[0])
      .switchMap(build => this.rxFire.transaction<Build>(`builds/${build.buildId}`, setBuildAgent))
      .switchMap(build => build.agent === this.agentName ? Observable.of(build) : this.getNextQueuedBuild())
      .catch(() => this.getNextQueuedBuild());
  }

  updateBuildProgress(buildId: number, tasks: TaskProgress[], type: 'checkout' | 'tasks') {
    return this.rxFire.set(`builds/${buildId}/progress/${type}`, tasks)
      .switchMap(() => this.updateBuildStatus(buildId, true))
      .mapTo(void 0);
  }

  updateBuildStatus(buildId: number, inProgress: boolean) {
    return this.getBuild(buildId)
      .map(build => this.calculateBuildStatus(inProgress, build.progress))
      .switchMap(buildStatus => this.setBuildStatus(buildId, buildStatus).mapTo(buildStatus));
  }

  setBuildStatus(buildId: number, buildStatus: BuildStatus) {
    return this.rxFire.set(`builds/${buildId}/status`, buildStatus);
  }

  private getBuild(buildId: number) {
    return this.rxFire.get<Build>(`builds/${buildId}`).first();
  }

  private calculateBuildStatus(inProgress: boolean, buildProgress: BuildProgress) {
    const taskStatuses = (buildProgress ? buildProgress.tasks || [] : [])
      .map(task => task.projects.map(taskProject => taskProject.status))
      .reduce((all, current) => all.concat(current), []);

    const someTasksFailed = taskStatuses.some(taskStatus => [TaskStatus.Failed, TaskStatus.DependendecyFailed].includes(taskStatus));

    if (inProgress) {
      return BuildStatus.InProgress;
    } else if (someTasksFailed) {
      return BuildStatus.Failed;
    } else {
      return BuildStatus.Passed;
    }
  }

  private pingFirebaseContinuously() {
    Observable.timer(0, agentPingDelay)
      .switchMap(() => this.rxFire.set(`/agents/${this.agentName}/utcLastPingTimestamp`, new Date().getTime()))
      .subscribe(() => { });
  }
}
