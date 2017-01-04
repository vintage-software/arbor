export interface Project {
  name: string;
  tasks: { [index: string]: Task };
  projectPath: string;
}

export interface Command {
  status: string;
  cwd: string;
  command: string;
}

export type Task = string | string[] | Command[];
