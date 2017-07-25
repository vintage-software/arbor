import { NgModule } from '@angular/core';

import { SharedModule } from './../common/shared/shared.module';
import { BuildPageComponent } from './build-page/build-page.component';
import { HomePageComponent } from './home-page/home-page.component';
import { LoginPageComponent } from './login-page/login-page.component';

const pages = [
  BuildPageComponent,
  HomePageComponent,
  LoginPageComponent
];

@NgModule({
  imports: [
    SharedModule
  ],
  declarations: [
    ...pages
  ],
  exports: [
    ...pages
  ]
})
export class PagesModule { }
