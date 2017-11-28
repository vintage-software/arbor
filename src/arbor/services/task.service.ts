import { Injectable } from '@angular/core';

import { bail } from './../../common/helpers/error.helpers';
import { SimpleMap } from './../../common/helpers/object.helpers';
import { Project, ProjectSchema, TaskCommand, TaskSchema } from './../../common/interfaces/project';

@Injectable()
export class TaskService {
  constructor() {
  }

  matchTasks(projects: ProjectSchema[], taskNames: string[]) {
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
      .filter(project => taskNames.some(taskName => Object.keys(project.tasks).includes(taskName)))
      .map(project => this.convertProjectSchemaToProject(project));
  }

  private convertProjectSchemaToProject(project: ProjectSchema) {
    const convertTask = (task: TaskSchema) => (Array.isArray(task) ? task : [task])
      .map(command => typeof command === 'string' ? { command } : command);

    const tasks = Object.keys(project.tasks)
      .reduce((acc, taskName) => ({ ...acc, [taskName]: convertTask(project.tasks[taskName]) }), {} as SimpleMap<TaskCommand[]>);

    return { ...project, tasks } as Project;
  }
}
