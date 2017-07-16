import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs/Observable';

import { TaskStatus } from '../../../common/interfaces/running-task';
import { Build, BuildStatus, ProjectTaskProgress } from './../../../common/interfaces/build';
import { BuildsService } from './../shared/services/builds.service';

@Component({
  selector: 'app-build',
  templateUrl: './build.component.html',
  styleUrls: ['./build.component.scss']
})
export class BuildComponent {
  readonly build: Observable<Build>;

  readonly BuildStatus = BuildStatus;

  constructor(private activatedRoute: ActivatedRoute, private buildsService: BuildsService) {
    this.build = this.getBuild().shareReplay(1);
  }

  statusColor(projectTask: ProjectTaskProgress) {
    switch (projectTask.status) {
      case TaskStatus.Waiting:
        return 'gray';
      case TaskStatus.Success:
        return 'green';
      case TaskStatus.Failed:
        return 'red';
      case TaskStatus.DependendecyFailed:
        return 'red';
      case TaskStatus.InProgress:
        return 'yellow';
      default:
        return 'gray';
    }
  }

  private getBuild() {
    return this.activatedRoute.params
      .map(params => +params['buildId'])
      .switchMap(buildId => this.buildsService.getBuild(buildId));
  }
}
