import { Injectable } from '@angular/core';
import * as chalk from 'chalk';
import * as firebase from 'firebase';
import * as firebaseAdmin from 'firebase-admin';

import { toColdObservable } from './../../web/app/common/core/helpers/observable.helpers';
import { firebaseAppInitConfigFilename, firebaseServiceAccountFilename, FirebaseConfigService } from './firebase-config.service';

@Injectable()
export class FirebaseInitService {
  readonly app: firebase.app.App;

  private readonly adminApp: firebaseAdmin.app.App;

  constructor(private firebaseConfig: FirebaseConfigService) {
    this.app = firebase.initializeApp(this.firebaseConfig.firebaseAppInitConfig);

    if (this.firebaseConfig.firebaseAppInitConfig && this.firebaseConfig.firebaseServiceAccount) {
      this.adminApp = firebaseAdmin.initializeApp({
        credential: firebaseAdmin.credential.cert(this.firebaseConfig.firebaseServiceAccount),
        databaseURL: this.firebaseConfig.firebaseAppInitConfig.databaseURL
      });
    }
  }

  initialize(agentName: string) {
    if (this.firebaseConfig.firebaseAppInitConfig === undefined) {
      console.log(chalk.red(`ERROR: ${firebaseAppInitConfigFilename} not found. This file must contain your firebase app initialization settings.`));
      process.exit(1);
    } else if (this.firebaseConfig.firebaseServiceAccount === undefined) {
      console.log(chalk.red(`ERROR: ${firebaseServiceAccountFilename} not found. This file must contain your service credentials.`));
      process.exit(1);
    } else {
      this.app.database().goOnline();

      return this.signInAgent(agentName);
    }
  }

  private signInAgent(agentName: string) {
    const agentUid = `agent-${agentName}`;

    return toColdObservable(this.adminApp.auth().createCustomToken(agentUid))
      .switchMap(authToken => this.app.auth().signInWithCustomToken(authToken))
      .do((user: firebase.User) => { console.log(`Agent signed into Firebase UID ${user.uid}.`); });
  }
}
