import { Component } from '@angular/core';
import { MdDialog } from '@angular/material';
import { Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';

import { Build, BuildOptions, BuildStatus } from './../../../common/interfaces/build';
import { QueueBuildDialogComponent } from './../shared/components/queue-build-dialog/queue-build-dialog.component';
import { BuildsService } from './../shared/services/builds.service';

@Component({
  selector: 'app-builds',
  templateUrl: './builds.component.html',
  styleUrls: ['./builds.component.scss']
})
export class BuildsComponent {
  readonly queuedBuildCount: Observable<number>;
  readonly inProgressBuilds: Observable<Build[]>;

  constructor(
    private dialog: MdDialog,
    private router: Router,
    private buildsService: BuildsService) {

    this.queuedBuildCount = this.buildsService.getBuildsByStatus(BuildStatus.Queued)
      .map(builds => builds.length)
      .shareReplay(1);

    this.inProgressBuilds = this.buildsService.getBuildsByStatus(BuildStatus.InProgress)
      .shareReplay(1);
  }

  queueBuild() {
    const queueBuildDialogRef = QueueBuildDialogComponent.showDialog(this.dialog);

    queueBuildDialogRef.afterClosed()
      .filter(buildOptions => buildOptions !== undefined)
      .switchMap((buildOptions: BuildOptions) => this.buildsService.queueBuild(buildOptions))
      .switchMap(buildId => this.router.navigate(['/builds', buildId]))
      .subscribe(() => { });
  }
}
