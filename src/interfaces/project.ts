import { SimpleMap } from './../helpers/object.helpers';

export interface ProjectSchema {
  name: string;
  cwd?: string;
  tasks?: SimpleMap<TaskSchema>;
  dependencies?: string[];
  projectPath: string;
}

export interface TaskCommandSchema {
  status?: string;
  cwd?: string;
  command: string | SimpleMap<string>;
  noProgress?: boolean;
}

export type TaskSchema = string | TaskCommandSchema | (string | TaskCommandSchema)[];

export interface Project {
  name: string;
  cwd?: string;
  tasks?: SimpleMap<TaskCommand[]>;
  dependencies?: string[];
  projectPath: string;
}

export interface TaskCommand {
  taskName: string;
  option: string;
  status?: string;
  cwd?: string;
  command: string;
  noProgress?: boolean;
}
