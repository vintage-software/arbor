import { Injectable } from '@angular/core';
import { AngularFireAuth } from 'angularfire2/auth';
import * as firebase from 'firebase/app';
import { Observable } from 'rxjs/Observable';

import { toColdObservable } from '../helpers/observable.helpers';
import { NavigationService } from './navigation.service';

@Injectable()
export class AuthService {
  readonly user: Observable<firebase.User>;

  constructor(private firebaseAuth: AngularFireAuth, private navigationService: NavigationService) {
    this.user = firebaseAuth.authState;
  }

  login() {
    return toColdObservable(this.firebaseAuth.auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()));
  }

  logout() {
    return toColdObservable(this.firebaseAuth.auth.signOut())
      .switchMap(() => this.navigationService.navigateToLogin());
  }
}
