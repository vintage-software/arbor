import { SimpleChanges } from '@angular/core';
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
