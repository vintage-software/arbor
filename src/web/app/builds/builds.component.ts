import { Component } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { Build, BuildStatus } from './../../../common/interfaces/build';
import { BuildsService } from './../shared/services/builds.service';

@Component({
  selector: 'app-builds',
  templateUrl: './builds.component.html',
  styleUrls: ['./builds.component.scss']
})
export class BuildsComponent {
  readonly queuedBuildCount: Observable<number>;
  readonly inProgressBuilds: Observable<Build[]>;
  readonly inProgressBuildsDataSource: any;

  constructor(private buildsService: BuildsService) {
    this.queuedBuildCount = this.buildsService.getBuildsByStatus(BuildStatus.Queued)
      .map(builds => builds.length)
      .shareReplay(1);

    this.inProgressBuilds = this.buildsService.getBuildsByStatus(BuildStatus.InProgress)
      .shareReplay(1);

    this.inProgressBuildsDataSource = {
      connect: () => this.inProgressBuilds
    };
  }

  queueBuild() {
    this.buildsService.queueBuild().subscribe(() => { });
  }
}
