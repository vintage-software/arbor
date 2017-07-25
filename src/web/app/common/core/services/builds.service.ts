import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { Build, BuildOptions, BuildStatus } from './../../../../../common/interfaces/build';
import { DatabaseService } from './database.service';

@Injectable()
export class BuildsService {
  constructor(private database: DatabaseService) { }

  getBuild(buildId: number) {
    return this.database.object<Build>(`builds/${buildId}`);
  }

  getBuildsByStatus(status: BuildStatus) {
    return this.database.list('builds', {
      query: {
        orderByChild: 'status',
        equalTo: status
      }
    }) as Observable<Build[]>;
  }

  queueBuild(buildOptions: BuildOptions) {
    return this.database.transaction<number>('counters/builds', value => (value || 0) + 1)
      .map(buildId => ({
        buildId,
        status: BuildStatus.Queued,
        ...buildOptions
      }))
      .switchMap(build => this.database.set(`builds/${build.buildId}`, build).mapTo(build.buildId));
  }
}
