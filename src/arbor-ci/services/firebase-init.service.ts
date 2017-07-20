import { Injectable } from '@angular/core';
import * as chalk from 'chalk';
import * as firebase from 'firebase-admin';

import { firebaseAppInitConfigFilename, firebaseServiceAccountFilename, FirebaseAppInitConfig, FirebaseConfigService } from './firebase-config.service';

@Injectable()
export class FirebaseInitService {
  readonly app: firebase.app.App;

  private readonly firebaseAppInitConfig: FirebaseAppInitConfig;
  private readonly firebaseServiceAccount: firebase.ServiceAccount;

  constructor(private configService: FirebaseConfigService) {
    this.firebaseAppInitConfig = this.configService.getFirebaseAppInitConfig();
    this.firebaseServiceAccount = this.configService.getFirebaseServiceAccount();

    if (this.firebaseAppInitConfig && this.firebaseServiceAccount) {
      this.app = firebase.initializeApp({
        credential: firebase.credential.cert(this.firebaseServiceAccount),
        databaseURL: this.firebaseAppInitConfig.databaseURL
      });
    }
  }

  initialize() {
    if (this.firebaseAppInitConfig === undefined) {
      console.log(chalk.red(`ERROR: ${firebaseAppInitConfigFilename} not found. This file must contain your firebase app initialization settings.`));
      process.exit(1);
    } else if (this.firebaseServiceAccount === undefined) {
      console.log(chalk.red(`ERROR: ${firebaseServiceAccountFilename} not found. This file must contain your service credentials.`));
      process.exit(1);
    } else {
      this.app.database().goOnline();
    }
  }
}
