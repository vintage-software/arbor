import { CdkTableModule } from '@angular/cdk';
import { NgModule } from '@angular/core';
import { MdButtonModule, MdTableModule, MdToolbarModule } from '@angular/material';

const modules = [
  CdkTableModule,
  MdButtonModule,
  MdTableModule,
  MdToolbarModule
];

@NgModule({
  imports: [...modules],
  exports: [...modules],
})
export class AppMaterialModule { }
