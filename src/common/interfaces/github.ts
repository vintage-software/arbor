export interface GithubBranch {
  name: string;
  commit: GithubCommit;
}

export interface GithubCommit {
  sha: string;
  url: string;
}
