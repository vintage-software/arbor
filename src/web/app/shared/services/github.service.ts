import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { BuildConfiguration } from './../../../../common/interfaces/build-configuration';
import { GithubBranch } from './../../../../common/interfaces/github';
import { GitHubApiService } from './../../../../common/services/github-api.service';
import { AuthService } from './auth.service';

@Injectable()
export class GitHubService {
  private readonly accessToken: Observable<string>;

  constructor(private auth: AuthService, private github: GitHubApiService) {
    this.accessToken = this.auth.user.map(user => user.githubAccessToken).shareReplay(1);
  }

  getBranches(buildConfiguration: BuildConfiguration) {
    const repos = buildConfiguration.repos
      .filter(repo => repo.defaultBranchOnly === false)
      .map(repo => repo.name);

    return this.accessToken
      .first()
      .switchMap(accessToken => Observable.combineLatest(repos.map(repo => this.github.get<GithubBranch[]>(`repos/${repo}/branches`, accessToken))))
      .map(repoBranches => {
        const distinct = repoBranches
          .reduce((flat, current) => flat.concat(current), [])
          .map(branch => branch.name)
          .filter((branch, index, self) => self.indexOf(branch) === index);

        return repoBranches
          .map(branches => branches.map(branch => branch.name))
          .reduce((intersection, branches) => intersection.filter(branch => branches.indexOf(branch) > -1), distinct);
      });
  }
}
