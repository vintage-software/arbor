export interface RunningTask {
  projectName: string;
  success?: boolean;
  status?: string;
  waiting: boolean;
}
