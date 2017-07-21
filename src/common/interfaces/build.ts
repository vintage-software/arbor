import { TaskStatus } from './running-task';

export enum BuildStatus {
  Queued,
  InProgress,
  Passed,
  Failed,
  Errored
}

export interface ProjectTaskProgress {
  projectName: string;
  status?: TaskStatus;
  statusText?: string;
  progressLogLine?: string;
}

export interface TaskProgress {
  taskName: string;
  projects: ProjectTaskProgress[];
}

export interface BuildProgress {
  checkout: TaskProgress[];
  tasks: TaskProgress[];
}

export interface BuildOptions {
  branch: string;
  configuration: string;
}

export interface Build extends BuildOptions {
  buildId: number;
  status: BuildStatus;
  agent: string;
  progress?: BuildProgress;
}
