import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Agent } from '../../../../common/interfaces/agent';

import { agentPingTimeout } from './../../../../common/interfaces/agent';
import { DatabaseService } from './database.service';

@Injectable()
export class AgentsService {
  constructor(private database: DatabaseService) { }

  getAgents() {
    const getAgents = this.database.list<Agent>(`agents`).shareReplay(1);

    const getMinUtcLastPingTimestamp = Observable.timer(0, 100)
      .map(() => new Date().getTime() - agentPingTimeout);

    return Observable.combineLatest(getAgents, getMinUtcLastPingTimestamp)
      .map(([agents, minUtcLastPingTimestamp]) => agents.filter(agent => agent.status && agent.utcLastPingTimestamp > minUtcLastPingTimestamp));
  }
}
