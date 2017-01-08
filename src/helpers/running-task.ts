import { Project } from './project';

export enum TaskStatus {
  Waiting,
  InProcess,
  Success,
  Failed,
  DependendecyFailed
}

export interface RunningTask {
  project: Project;
  taskName: string;
  status: TaskStatus;
  statusText?: string;
}
