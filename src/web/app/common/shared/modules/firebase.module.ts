import { NgModule } from '@angular/core';
import { AngularFireModule } from 'angularfire2';
import { AngularFireAuthModule } from 'angularfire2/auth';
import { AngularFireDatabaseModule } from 'angularfire2/database';

import { firebaseAppInitConfig } from './../../../firebase-app-config';

@NgModule({
  imports: [
    AngularFireAuthModule,
    AngularFireDatabaseModule,
    AngularFireModule.initializeApp(firebaseAppInitConfig)
  ],
  exports: [
    AngularFireAuthModule,
    AngularFireDatabaseModule,
  ],
})
export class FirebaseModule { }
