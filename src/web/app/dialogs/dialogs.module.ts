import { NgModule } from '@angular/core';

import { SharedModule } from './../common/shared/shared.module';
import { QueueBuildDialogComponent } from './queue-build-dialog/queue-build-dialog.component';

const dialogs = [
  QueueBuildDialogComponent
];

@NgModule({
  imports: [
    SharedModule
  ],
  declarations: [
    ...dialogs
  ],
  entryComponents: [
    ...dialogs
  ],
  exports: [
    ...dialogs
  ]
})
export class DialogsModule { }
