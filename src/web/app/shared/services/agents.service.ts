import { Injectable } from '@angular/core';

import { Agent } from './../../../../common/interfaces/agent';
import { DatabaseService } from './database.service';

@Injectable()
export class AgentsService {
  constructor(private database: DatabaseService) { }

  getAgents() {
    return this.database.list<Agent>(`agents`)
      .map(agents => agents.filter(agent => agent.status));
  }
}
