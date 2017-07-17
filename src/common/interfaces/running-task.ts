import { Command, Project } from './project';

export enum TaskStatus {
  Waiting,
  InProgress,
  Success,
  Failed,
  DependendecyFailed
}

export interface RunningTask {
  project: Project;
  taskName: string;
  status: TaskStatus;
  currentCommand?: Command;
  progressLogLine?: string;
  statusText?: string;
}
