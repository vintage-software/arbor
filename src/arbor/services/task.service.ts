import { Injectable } from '@angular/core';

import { bail } from './../../common/helpers/error.helpers';
import { Project } from './../../common/interfaces/project';

@Injectable()
export class TaskService {
  constructor() {
  }

  matchTasks(projects: Project[], taskNames: string[]) {
    const knownTaskNames = projects
      .map(project => Object.keys(project.tasks))
      .reduce((previous, current) => previous.concat(current), [])
      .filter((value, index, self) => self.indexOf(value) === index);

    for (const taskName of taskNames) {
      if (knownTaskNames.includes(taskName) === false) {
        bail(`Task '${taskName}' is not defined in any project.`);
      }
    }

    return projects
      .filter(project => taskNames.some(taskName => Object.keys(project.tasks).includes(taskName)));
  }
}
