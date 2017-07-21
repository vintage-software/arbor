import { CdkTableModule } from '@angular/cdk';
import { NgModule } from '@angular/core';
import { MdButtonModule, MdCardModule, MdDialogModule, MdProgressBarModule, MdSelectModule, MdTableModule, MdToolbarModule } from '@angular/material';

const modules = [
  CdkTableModule,
  MdButtonModule,
  MdCardModule,
  MdDialogModule,
  MdProgressBarModule,
  MdSelectModule,
  MdTableModule,
  MdToolbarModule
];

@NgModule({
  imports: [...modules],
  exports: [...modules],
})
export class AppMaterialModule { }
