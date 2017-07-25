import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { RouterModule } from '@angular/router';

import { BuildsTableComponent } from './components/builds-table/builds-table.component';
import { FirebaseModule } from './modules/firebase.module';
import { MaterialModule } from './modules/material.module';
import { EnumValuePipe } from './pipes/enum-value.pipe';

const modules = [
  CommonModule,
  FirebaseModule,
  HttpModule,
  MaterialModule,
  ReactiveFormsModule,
  RouterModule
];

const components = [
  BuildsTableComponent
];

const pipes = [
  EnumValuePipe
];

@NgModule({
  imports: [
    ...modules
  ],
  declarations: [
    ...components,
    ...pipes
  ],
  providers: [
    ...pipes
  ],
  exports: [
    ...modules,
    ...components,
    ...pipes
  ]
})
export class SharedModule { }
