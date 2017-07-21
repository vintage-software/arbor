import { DataSource } from '@angular/cdk';
import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { Build, BuildStatus } from './../../../../../common/interfaces/build';
import { BaseComponent } from './../../../base.component';

@Component({
  selector: 'app-builds-table',
  templateUrl: './builds-table.component.html',
  styleUrls: ['./builds-table.component.scss']
})
export class BuildsTableComponent extends BaseComponent implements OnInit {
  @Input() builds: Build[];

  buildsDataSource: DataSource<Build>;

  readonly BuildStatus = BuildStatus;

  constructor(private router: Router) {
    super();
  }

  ngOnInit() {
    this.buildsDataSource = {
      connect: () => this.getChanges(() => this.builds),
      disconnect: () => { }
    };
  }

  getCurrentTaskIfInProgress(build: Build) {
    const hasTasks = build.progress && build.progress.tasks && build.progress.tasks.length;
    const isInProgress = build.status === BuildStatus.InProgress;

    return hasTasks && isInProgress ? `(Current Task: ${build.progress.tasks[build.progress.tasks.length - 1].taskName})` : undefined;
  }

  navigateToBuild(build: Build) {
    this.router.navigate(['/builds', build.buildId]);
  }
}
