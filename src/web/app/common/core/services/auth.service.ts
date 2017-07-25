import { Injectable } from '@angular/core';
import { AngularFireAuth } from 'angularfire2/auth';
import * as firebase from 'firebase/app';
import { Observable } from 'rxjs/Observable';

import { toColdObservable } from './../helpers/observable.helpers';
import { DatabaseService } from './database.service';
import { NavigationService } from './navigation.service';

export interface SignInResult {
  credential: {
    accessToken: string;
    providerId: string;
  };
  user: firebase.User;
}

export interface User {
  uid: string;
  displayName: string;
  photoURL: string;
  githubAccessToken: string;
}

@Injectable()
export class AuthService {
  readonly user: Observable<User>;

  constructor(
    private firebaseAuth: AngularFireAuth,
    private database: DatabaseService,
    private navigationService: NavigationService
  ) {
    this.user = firebaseAuth.authState
      .switchMap(user => user ? database.object<User>(`users/${user.uid}`) : Observable.of(undefined))
      .shareReplay(1);
  }

  login() {
    const githubAuthProvider = new firebase.auth.GithubAuthProvider();
    githubAuthProvider.addScope('repo');

    return toColdObservable(this.firebaseAuth.auth.signInWithPopup(githubAuthProvider))
      .map((result: SignInResult) => ({
        uid: result.user.uid,
        displayName: result.user.displayName,
        photoURL: result.user.providerData[0].photoURL,
        githubAccessToken: result.credential.accessToken
      } as User))
      .switchMap(user => this.database.set(`users/${user.uid}`, user))
      .catch(error => { console.log('login error', error); return Observable.throw(error); });
  }

  logout() {
    return toColdObservable(this.firebaseAuth.auth.signOut())
      .switchMap(() => this.navigationService.navigateToLogin());
  }
}
