import { Injectable } from '@angular/core';
import { AngularFireDatabase } from 'angularfire2/database';
import { FirebaseListFactoryOpts, FirebaseObjectFactoryOpts, PathReference } from 'angularfire2/interfaces';
import { Observable } from 'rxjs/Observable';

import { RxFire } from './../../../../../common/helpers/rx-fire';
import { NavigationService } from './navigation.service';

@Injectable()
export class DatabaseService {
  private readonly rxFire: RxFire;

  constructor(private firebaseDatabase: AngularFireDatabase, private navigationService: NavigationService) {
    this.rxFire = new RxFire(this.firebaseDatabase.database);
  }

  object<T>(pathOrRef: PathReference, opts?: FirebaseObjectFactoryOpts) {
    return (this.firebaseDatabase.object(pathOrRef, opts) as Observable<T>)
      .catch(() => this.navigationService.navigateToLogin().switchMapTo(Observable.empty<T>()));
  }

  list<T>(pathOrRef: PathReference, opts?: FirebaseListFactoryOpts) {
    return (this.firebaseDatabase.list(pathOrRef, opts) as Observable<T[]>)
      .catch(() => this.navigationService.navigateToLogin().switchMapTo(Observable.empty<T[]>()));
  }

  set<T>(path: string, value: T) {
    return this.rxFire.set(path, value);
  }

  transaction<T>(path: string, selector: (value: T) => T) {
    return this.rxFire.transaction(path, selector);
  }
}
