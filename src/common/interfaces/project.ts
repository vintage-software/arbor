import { SimpleMap } from './../helpers/object.helpers';

export interface ProjectSchema {
  name: string;
  cwd?: string;
  tasks?: SimpleMap<TaskSchema>;
  dependencies?: string[];
  projectPath: string;
}

export interface TaskCommand {
  status?: string;
  cwd?: string;
  command: string;
  noProgress?: boolean;
}

export type TaskSchema = string | TaskCommand | (string | TaskCommand)[];

export interface Project {
  name: string;
  cwd?: string;
  tasks?: SimpleMap<TaskCommand[]>;
  dependencies?: string[];
  projectPath: string;
}
