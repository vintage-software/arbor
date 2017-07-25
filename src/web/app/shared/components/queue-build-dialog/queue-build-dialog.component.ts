import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MdDialog, MdDialogRef } from '@angular/material';
import { Observable } from 'rxjs/Observable';

import { BuildOptions } from './../../../../../common/interfaces/build';
import { BuildConfiguration } from './../../../../../common/interfaces/build-configuration';
import { GitHubService } from './../../services/github.service';
import { SettingsService } from './../../services/settings.service';

const controls = {
  branch: 'branch',
  buildConfiguration: 'buildConfiguration'
};

const defaultValues = {
  branch: 'master',
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
  readonly branches: Observable<string[]>;

  readonly form: FormGroup;
  readonly controls = controls;

  constructor (
    private formBuilder: FormBuilder,
    private dialogRef: MdDialogRef<QueueBuildDialogComponent>,
    private settings: SettingsService,
    private github: GitHubService) {

    this.form = this.formBuilder.group({
      [controls.branch]: [defaultValues.branch, [Validators.required]],
      [controls.buildConfiguration]: [defaultValues.buildConfiguration, [Validators.required]]
    });

    this.buildConfigurations = this.settings.getBuildConfigurations().shareReplay(1);
    this.selectedBuildConfiguration = this.getSelectedBuildConfiguration().shareReplay(1);
    this.branches = this.getBranches(this.selectedBuildConfiguration).shareReplay(1);
  }

  static showDialog(dialogService: MdDialog) {
    return dialogService.open(QueueBuildDialogComponent, { width: '500px', position: { top: '100px' } });
  }

  ngOnInit() {
  }

  submit() {
    const buildOptions: BuildOptions = {
      branch: this.form.controls[controls.branch].value as string,
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

  private getBranches(selectedBuildConfiguration: Observable<BuildConfiguration>) {
    return selectedBuildConfiguration
      .switchMap(buildConfiguration => this.github.getBranches(buildConfiguration));
  }
}
