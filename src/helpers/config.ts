export interface Config {
  name: string;
  tasks: { [index: string]: string };

  projectPath: string;
}
