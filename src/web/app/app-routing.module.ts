import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { BuildComponent } from './build/build.component';
import { BuildsComponent } from './builds/builds.component';
import { LoginComponent } from './login/login.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'builds/:buildId', component: BuildComponent },
  { path: '', component: BuildsComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
