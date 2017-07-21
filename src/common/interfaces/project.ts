import { SimpleMap } from './../helpers/object.helpers';

export interface Project {
  name: string;
  cwd?: string;
  tasks?: SimpleMap<Task>;
  dependencies?: string[];
  projectPath: string;
}

export interface TaskCommand {
  status?: string;
  cwd?: string;
  command: string;
  noProgress?: boolean;
}

export type Task = string | TaskCommand | (string | TaskCommand)[];
