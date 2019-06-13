import { Injectable } from '@angular/core';

import { bail } from './../helpers/error.helpers';
import { SimpleMap } from './../helpers/object.helpers';
import { Project, ProjectSchema, TaskCommand, TaskCommandSchema, TaskSchema } from './../interfaces/project';

interface TaskToRun {
  name: string;
  options: string[];
  taskFlag: string;
}

@Injectable()
export class TaskService {
  constructor() {
  }

  matchTasks(projectDefinitions: ProjectSchema[], taskFlags: string[]) {
    const knownTaskNames = projectDefinitions
      .map(project => Object.keys(project.tasks))
      .reduce((previous, current) => previous.concat(current), [])
      .filter((value, index, self) => self.indexOf(value) === index);

    const tasksToRun = this.parseTaskFlags(taskFlags);

    for (const taskToRun of tasksToRun) {
      if (knownTaskNames.includes(taskToRun.name) === false) {
        bail(`Task '${taskToRun.name}' is not defined in any project.`);
      }
    }

    const projects = projectDefinitions
      .filter(project => tasksToRun.some(taskToRun => Object.keys(project.tasks).includes(taskToRun.name)))
      .map(project => this.convertProjectSchemaToProject(project, tasksToRun))
      .filter(project => Object.keys(project.tasks).length > 0);

    const matchedTaskFlags = projects
      .map(project => Object.keys(project.tasks).map(taskFlag => project.tasks[taskFlag]))
      .reduce((previous, current) => previous.concat(current), [])
      .map(taskCommands => taskCommands.map(taskCommand => taskCommand.option ? `${taskCommand.taskName}:${taskCommand.option}` : taskCommand.taskName))
      .reduce((previous, current) => previous.concat(current), [])
      .filter((value, index, self) => self.indexOf(value) === index);

    for (const taskToRun of tasksToRun) {
      if (matchedTaskFlags.includes(taskToRun.taskFlag) === false) {
        bail(`Task '${taskToRun.name}' is not defined with option '${taskToRun.options.join()}' in any project.`);
      }
    }

    return projects;
  }

  private parseTaskFlags(taskFlags: string[]) {
    return taskFlags
      .map(taskFlag => taskFlag.match(/^([a-z0-9 -]+):?([a-z0-0,]+)?$/))
      .map(taskFlagMatch => ({ taskFlag: taskFlagMatch[0], name: taskFlagMatch[1], options: (taskFlagMatch[2] || '').split(',') } as TaskToRun));
  }

  private convertProjectSchemaToProject(projectDefinition: ProjectSchema, tasksToRun: TaskToRun[]) {
    const convertTaskCommand = (taskCommand: TaskCommandSchema, taskToRun: TaskToRun) => ({
      ...taskCommand,
      ...(typeof taskCommand.command === 'string' ? { command: taskCommand.command, option: undefined } : this.matchCommand(taskCommand.command, taskToRun)),
      taskName: taskToRun.name
    });

    const convertTask = (task: TaskSchema, taskToRun: TaskToRun) => (Array.isArray(task) ? task : [task])
      .map(command => convertTaskCommand(typeof command === 'string' ? { command } : command, taskToRun));

    const tasks = Object.keys(projectDefinition.tasks)
      .map(taskName => tasksToRun.find(taskToRun => taskToRun.name === taskName))
      .filter(taskToRun => taskToRun !== undefined)
      .reduce((acc, taskToRun) => ({ ...acc, [taskToRun.taskFlag]: convertTask(projectDefinition.tasks[taskToRun.name], taskToRun) }), {} as SimpleMap<TaskCommand[]>);

    return { ...projectDefinition, tasks } as Project;
  }

  private matchCommand(commandMap: SimpleMap<string>, taskToRun: TaskToRun) {
    const candidateKeys = [];

    for (let length = taskToRun.options.length; length >= 0; length--) {
      candidateKeys.push(taskToRun.options.slice(0, length).join());
    }

    let command: string;
    let option: string;

    for (const candidateKey of candidateKeys) {
      const candidateCommand = commandMap[candidateKey];

      if (command === undefined && candidateCommand) {
        command = candidateCommand;
        option = candidateKey;
      }
    }

    return { command, option };
  }
}
