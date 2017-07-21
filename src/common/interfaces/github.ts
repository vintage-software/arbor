export namespace Github {
  export interface Branch {
    name: string;
    commit: Commit;
  }

  export interface Commit {
    sha: string;
    url: string;
  }
}
