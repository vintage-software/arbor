import { NgModule } from '@angular/core';
import { MdButtonModule, MdToolbarModule } from '@angular/material';

const modules = [
  MdButtonModule,
  MdToolbarModule
];

@NgModule({
  imports: [...modules],
  exports: [...modules],
})
export class AppMaterialModule { }
