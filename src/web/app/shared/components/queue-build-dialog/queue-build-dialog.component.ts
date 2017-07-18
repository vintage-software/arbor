import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MdDialog, MdDialogRef } from '@angular/material';
import { Observable } from 'rxjs/Observable';

import { BuildOptions } from '../../../../../common/interfaces/build';
import { BuildConfiguration } from './../../../../../common/interfaces/build-configuration';
import { SettingsService } from './../../services/settings.service';

const controls = {
  buildConfiguration: 'buildConfiguration'
};

const defaultValues = {
  buildConfiguration: 'default'
};

@Component({
  selector: 'app-queue-build-dialog',
  templateUrl: './queue-build-dialog.component.html',
  styleUrls: ['./queue-build-dialog.component.scss']
})
export class QueueBuildDialogComponent implements OnInit {
  readonly buildConfigurations: Observable<BuildConfiguration[]>;
  readonly selectedBuildConfiguration: Observable<BuildConfiguration>;

  readonly form: FormGroup;
  readonly controls = controls;

  constructor (
    private formBuilder: FormBuilder,
    private dialogRef: MdDialogRef<QueueBuildDialogComponent>,
    private settings: SettingsService) {

    this.form = this.formBuilder.group({
      [controls.buildConfiguration]: [defaultValues.buildConfiguration, [Validators.required]]
    });

    this.buildConfigurations = this.settings.getBuildConfigurations().shareReplay(1);
    this.selectedBuildConfiguration = this.getSelectedBuildConfiguration().shareReplay(1);
  }

  static showDialog(dialogService: MdDialog) {
    return dialogService.open(QueueBuildDialogComponent, { width: '500px', position: { top: '100px' } });
  }

  ngOnInit() {
  }

  submit() {
    const buildOptions: BuildOptions = {
      configuration: this.form.controls[controls.buildConfiguration].value as string
    };

    this.dialogRef.close(buildOptions);
  }

  private getSelectedBuildConfiguration() {
    const valueChanges = (this.form.controls[controls.buildConfiguration].valueChanges as Observable<string>)
      .startWith(defaultValues.buildConfiguration);

    return Observable.combineLatest(this.buildConfigurations, valueChanges)
      .map(([buildConfigurations, name]) => buildConfigurations.find(buildConfiguration => buildConfiguration.name === name));
  }
}
