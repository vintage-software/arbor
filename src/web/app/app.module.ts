import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CoreModule } from './common/core/core.module';
import { SharedModule } from './common/shared/shared.module';
import { DialogsModule } from './dialogs/dialogs.module';
import { PagesModule } from './pages/pages.module';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    AppRoutingModule,
    BrowserAnimationsModule,
    BrowserModule,
    CoreModule.forRoot(),
    DialogsModule,
    PagesModule,
    SharedModule
  ],
  bootstrap: [
    AppComponent
  ]
})
export class AppModule { }
