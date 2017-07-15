import { NgModule } from '@angular/core';
import { ServerModule } from '@angular/platform-server';

@NgModule({
  imports: [
    ServerModule
  ],
  providers: [
  ]
})
export class AppModule {
  ngDoBootstrap() { }
}
