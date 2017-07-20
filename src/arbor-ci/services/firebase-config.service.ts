import { Injectable } from '@angular/core';
import * as firebase from 'firebase-admin';

import { readFileIfExists } from './../../common/helpers/fs.helpers';

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
  readonly firebaseAppConfigJson: string;
  readonly firebaseAppInitConfigJson: string;
  readonly firebaseServiceAccountJson: string;

  constructor() {
    this.firebaseAppConfigJson = readFileIfExists(firebaseAppConfigFilename);
    this.firebaseAppInitConfigJson = readFileIfExists(firebaseAppInitConfigFilename);
    this.firebaseServiceAccountJson = readFileIfExists(firebaseServiceAccountFilename);
  }

  getFirebaseAppConfig(): FirebaseAppConfig {
    return this.firebaseAppConfigJson ? JSON.parse(this.firebaseAppConfigJson) : undefined;
  }

  getFirebaseAppInitConfig(): FirebaseAppInitConfig {
    return this.firebaseAppInitConfigJson ? JSON.parse(this.firebaseAppInitConfigJson) : undefined;
  }

  getFirebaseServiceAccount(): firebase.ServiceAccount {
    return this.firebaseServiceAccountJson ? JSON.parse(this.firebaseServiceAccountJson) : undefined;
  }
}
