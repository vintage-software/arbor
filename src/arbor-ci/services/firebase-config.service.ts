import { Injectable } from '@angular/core';
import * as firebase from 'firebase-admin';

import { readJsonFileIfExists } from './../../common/helpers/fs.helpers';

export const firebaseAppConfigFilename = 'firebase.json';
export const firebaseAppInitConfigFilename = 'firebase-app-init-config.json';
export const firebaseServiceAccountFilename = 'firebase-service-account.json';

export interface FirebaseAppConfig {
  hosting: {
    public: string;
  };
}

export interface FirebaseAppInitConfig {
  apiKey: string;
  authDomain: string;
  databaseURL: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
}

@Injectable()
export class FirebaseConfigService {
  readonly firebaseAppConfig: FirebaseAppConfig;
  readonly firebaseAppInitConfig: FirebaseAppInitConfig;
  readonly firebaseServiceAccount: firebase.ServiceAccount;

  constructor() {
    this.firebaseAppConfig = Object.freeze(readJsonFileIfExists<FirebaseAppConfig>(firebaseAppConfigFilename));
    this.firebaseAppInitConfig = Object.freeze(readJsonFileIfExists<FirebaseAppInitConfig>(firebaseAppInitConfigFilename));
    this.firebaseServiceAccount = Object.freeze(readJsonFileIfExists<firebase.ServiceAccount>(firebaseServiceAccountFilename));
  }
}
