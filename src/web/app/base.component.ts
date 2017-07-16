import { OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Subscription } from 'rxjs/Subscription';

import { getChangesObservable, unsubscribeFromAll } from './shared/helpers/observable.helpers';
import { getThisPropertyName } from './shared/helpers/reflection.helpers';

export class BaseComponent implements OnChanges, OnDestroy {
  private readonly changes = new BehaviorSubject<SimpleChanges>({});
  private readonly subscriptions: Subscription[] = [];

  ngOnChanges(simpleChanges: SimpleChanges) {
    this.changes.next(simpleChanges);
  }

  ngOnDestroy() {
    unsubscribeFromAll(this.subscriptions);
  }

  protected getChanges<T>(inputPropertySelector: () => T) {
    return getChangesObservable<T>(this.changes, getThisPropertyName(inputPropertySelector));
  }

  protected addSubscriptions(...subscriptions: Subscription[]) {
    this.subscriptions.push(...subscriptions);
  }
}
