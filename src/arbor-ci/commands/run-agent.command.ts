import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';

import { environment } from './../../common/environments/environment';
import { AgentStatus } from './../../common/interfaces/agent';
import { Command } from './../../common/interfaces/command';
import { AgentService } from './../services/agent.service';
import { BuildService } from './../services/build.service';

@Injectable()
export class RunAgentCommand implements Command {
  private buildLoopSubscription: Subscription;

  constructor(private agentService: AgentService, private buildService: BuildService) { }

  run() {
    console.log(`Arbor-CI v${environment.version}: Running build agent.`);
    console.log();

    const buildLoop: Observable<void> = this.agentService.getNextQueuedBuild()
      .switchMap(build => this.buildService.runBuild(build))
      .switchMap(() => buildLoop);

    this.buildLoopSubscription = this.agentService.initialize()
      .switchMap(() => this.agentService.setAgentStatus(AgentStatus.Idle))
      .switchMap(() => buildLoop)
      .subscribe(() => { });
  }

  stop() {
    return Observable.of(undefined)
      .do(() => { this.buildLoopSubscription.unsubscribe(); })
      .switchMap(() => this.agentService.setAgentStatus(AgentStatus.Offline));
  }
}
