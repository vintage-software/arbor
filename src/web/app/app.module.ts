import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AngularFireModule } from 'angularfire2';
import { AngularFireAuthModule } from 'angularfire2/auth';
import { AngularFireDatabaseModule } from 'angularfire2/database';

import { AppMaterialModule } from './app-material.module';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BuildComponent } from './build/build.component';
import { BuildsComponent } from './builds/builds.component';
import { firebaseAppInitConfig } from './firebase-app-config';
import { LoginComponent } from './login/login.component';
import { BuildsTableComponent } from './shared/components/builds-table/builds-table.component';
import { QueueBuildDialogComponent } from './shared/components/queue-build-dialog/queue-build-dialog.component';
import { EnumValuePipe } from './shared/pipes/enum-value.pipe';
import { AgentsService } from './shared/services/agents.service';
import { AuthService } from './shared/services/auth.service';
import { BuildsService } from './shared/services/builds.service';
import { DatabaseService } from './shared/services/database.service';
import { GitHubApiService } from './shared/services/github-api.service';
import { GitHubService } from './shared/services/github.service';
import { NavigationService } from './shared/services/navigation.service';
import { SettingsService } from './shared/services/settings.service';

@NgModule({
  declarations: [
    AppComponent,
    BuildComponent,
    BuildsComponent,
    BuildsTableComponent,
    EnumValuePipe,
    LoginComponent,
    QueueBuildDialogComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpModule,
    ReactiveFormsModule,
    AngularFireModule.initializeApp(firebaseAppInitConfig),
    AngularFireDatabaseModule,
    AngularFireAuthModule,
    AppRoutingModule,
    AppMaterialModule
  ],
  providers: [
    AgentsService,
    AuthService,
    BuildsService,
    DatabaseService,
    GitHubApiService,
    GitHubService,
    NavigationService,
    SettingsService
  ],
  entryComponents: [
    QueueBuildDialogComponent
  ],
  bootstrap: [
    AppComponent
  ]
})
export class AppModule { }
