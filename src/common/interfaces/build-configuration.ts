export interface Repo {
  name: string;
  defaultBranchOnly: boolean;
}

export interface BuildConfiguration {
  name: string;
  description: string;
  repos: Repo[];
  tasks: string[];
}
