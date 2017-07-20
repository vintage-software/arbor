import * as firebase from 'firebase/app';
import { Observable } from 'rxjs/Observable';

export class RxFire {
  constructor(private database: firebase.database.Database) { }

  get<T>(path: string, query?: (ref: firebase.database.Reference) => firebase.database.Query) {
    return new Observable<T>(observer => {
      const ref = this.database.ref(path);
      const queryOrRef = query ? query(ref) : ref;

      const onValue = (snapshot: firebase.database.DataSnapshot) => {
        const value = snapshot.val();

        if (value) {
          observer.next(value);
        }
      };

      queryOrRef.on('value', onValue, (error: any) => { observer.error(error); });

      return () => { queryOrRef.off('value', onValue); };
    });
  }

  set<T>(path: string, value: T) {
    return new Observable<void>(observer => {
      this.database.ref(path).set(value)
        .then(() => { observer.next(void 0); observer.complete(); })
        .catch(error => { observer.error(error); });
    });
  }

  transaction<T>(path: string, update: (value: T) => T) {
    return new Observable<T>(observer => {
      this.database.ref(path).transaction(update, (error, committed, snapshot) => {
        if (committed) {
          observer.next(snapshot.val());
          observer.complete();
        } else {
          observer.error(error);
        }
      });
    });
  }
}
