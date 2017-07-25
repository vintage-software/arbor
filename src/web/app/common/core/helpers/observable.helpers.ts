import { SimpleChanges } from '@angular/core';
import * as firebase from 'firebase';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';

export function getChangesObservable<T>(changes: Observable<SimpleChanges>, name: string): Observable<T> {
  return changes
    .map(change => change[name] && change[name].currentValue)
    .filter(value => value);
}

export function unsubscribeFromAll(subscriptions: Subscription[]) {
  for (const subscription of subscriptions) {
    if (subscription) {
      subscription.unsubscribe();
    }
  }

  return undefined as Subscription[];
}

export function toColdObservable<T>(promise: Promise<T> | firebase.Promise<T>) {
  return new Observable<T>(observer => {

    if (!promise) {
      console.error(promise, promise);
    }

    if (promise instanceof firebase.Promise) {
      promise
        .then(result => { observer.next(result); observer.complete(); })
        .catch(error => { observer.error(error); });
    } else {
      promise
        .then(result => { observer.next(result); observer.complete(); })
        .catch(error => { observer.error(error); });
    }
  });
}
