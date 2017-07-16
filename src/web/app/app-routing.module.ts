import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { BuildComponent } from './build/build.component';
import { BuildsComponent } from './builds/builds.component';

const routes: Routes = [
  { path: 'builds/:buildId', component: BuildComponent },
  { path: '', component: BuildsComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
