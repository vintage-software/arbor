import { Injectable } from '@angular/core';
import { AngularFireDatabase } from 'angularfire2/database';
import { Observable } from 'rxjs/Observable';

import { Build, BuildStatus } from '../../../../common/interfaces/build';

@Injectable()
export class BuildsService {
  constructor(private firebaseDatabase: AngularFireDatabase) {
  }

  getBuild(buildId: number) {
    return this.firebaseDatabase.object(`builds/${buildId}`) as Observable<Build>;
  }

  getBuildsByStatus(status: BuildStatus) {
    return this.firebaseDatabase.list('builds', {
      query: {
        orderByChild: 'status',
        equalTo: status
      }
    }) as Observable<Build[]>;
  }

  queueBuild() {
    return new Observable<number>(observer => {
      this.firebaseDatabase.database.ref('counters/builds')
        .transaction(buildCounter => (buildCounter || 0) + 1, (transactionError, committed, snapshot) => {
          if (committed) {
            const buildId = snapshot.val();

            const build: Build = {
              buildId,
              configuration: 'default',
              status: BuildStatus.Queued
            };

            this.firebaseDatabase.database.ref(`builds/${buildId}`).set(build)
              .then(() => observer.next(buildId))
              .catch(error => observer.error(error));
          } else {
            observer.error(transactionError);
          }
        });
      });
  }
}
