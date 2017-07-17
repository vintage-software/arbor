import { TaskStatus } from './running-task';

export enum BuildStatus {
  Queued,
  InProgress,
  Failing,
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

export interface Build {
  buildId: number;
  configuration: string;
  status: BuildStatus;
  progress?: BuildProgress;
}
