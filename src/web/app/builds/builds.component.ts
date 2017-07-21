import { Component } from '@angular/core';
import { MdDialog } from '@angular/material';
import { Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';

import { AgentStatus } from '../../../common/interfaces/agent';
import { Build, BuildOptions, BuildStatus } from './../../../common/interfaces/build';
import { QueueBuildDialogComponent } from './../shared/components/queue-build-dialog/queue-build-dialog.component';
import { AgentsService } from './../shared/services/agents.service';
import { BuildsService } from './../shared/services/builds.service';

@Component({
  selector: 'app-builds',
  templateUrl: './builds.component.html',
  styleUrls: ['./builds.component.scss']
})
export class BuildsComponent {
  readonly busyAgentCount: Observable<number>;
  readonly totalAgentCount: Observable<number>;
  readonly agentBarProgress: Observable<number>;
  readonly queuedBuildCount: Observable<number>;
  readonly inProgressBuilds: Observable<Build[]>;

  constructor(
    private dialog: MdDialog,
    private router: Router,
    private agentsService: AgentsService,
    private buildsService: BuildsService) {

    const getAgents = this.agentsService.getAgents().shareReplay(1);

    this.busyAgentCount = getAgents
      .map(agents => agents.filter(agent => agent.status === AgentStatus.Busy).length)
      .shareReplay(1);

    this.totalAgentCount = getAgents
      .map(agents => agents.length)
      .shareReplay(1);

    this.agentBarProgress = Observable.combineLatest(this.busyAgentCount, this.totalAgentCount)
      .map(([busyAgentCount, totalAgentCount]) => totalAgentCount ? busyAgentCount / totalAgentCount * 100 : 0)
      .shareReplay(1);

    this.queuedBuildCount = this.buildsService.getBuildsByStatus(BuildStatus.Queued)
      .map(builds => builds.length)
      .shareReplay(1);

    this.inProgressBuilds = this.buildsService.getBuildsByStatus(BuildStatus.InProgress)
      .shareReplay(1);
  }

  queueBuild() {
    const queueBuildDialogRef = QueueBuildDialogComponent.showDialog(this.dialog);

    queueBuildDialogRef.afterClosed()
      .filter(buildOptions => buildOptions !== undefined)
      .switchMap((buildOptions: BuildOptions) => this.buildsService.queueBuild(buildOptions))
      .switchMap(buildId => this.router.navigate(['/builds', buildId]))
      .subscribe(() => { });
  }
}
