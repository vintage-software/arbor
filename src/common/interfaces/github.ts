export interface GitHubAccount {
  login: string;
  id: number;
  avatar_url: string;
  gravatar_id: string;
  url: string;
  html_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  starred_url: string;
  subscriptions_url: string;
  organizations_url: string;
  repos_url: string;
  events_url: string;
  received_events_url: string;
  type: string;
  site_admin: boolean;
}

export interface GithubBranch {
  name: string;
  commit: GithubCommit;
}

export interface GithubCommit {
  sha: string;
  url: string;
}

export interface GitHubInstallation {
  id: number;
  account: GitHubAccount;
  repository_selection: string;
  access_tokens_url: string;
  repositories_url: string;
  html_url: string;
  integration_id: number;
  app_id: number;
  target_id: number;
  target_type: string;
  permissions: { [key: string]: 'read' | 'write' };
  events: string[];
  created_at: Date;
  updated_at: Date;
}
