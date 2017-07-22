import { Injectable } from '@angular/core';
import * as chalk from 'chalk';
import * as jwt from 'jsonwebtoken';

import { readFileIfExists, readJsonFileIfExists } from '../../common/helpers/fs.helpers';
import { GitHubInstallation } from './../../common/interfaces/github';
import { GitHubApiService } from './../../common/services/github-api.service';

// const githubApiBaseUrl = 'https://api.github.com/';
const githubAppFilename = 'github-app.json';
const githubPrivateKeyFilename = 'github-private-key.pem';

interface GitHubApp {
  appId: number;
}

@Injectable()
export class GitHubAppService {
  constructor(private github: GitHubApiService) { }

  getAccessToken() {
    const githubApp = readJsonFileIfExists<GitHubApp>(githubAppFilename);
    const githubPrivateKey = readFileIfExists(githubPrivateKeyFilename);

    if (githubApp === undefined) {
      console.log(chalk.red(`ERROR: ${githubAppFilename} not found. This file must contain your GitHub App ID.`));
      process.exit(1);
    } else if (githubPrivateKey === undefined) {
      console.log(chalk.red(`ERROR: ${githubPrivateKeyFilename} not found. This file must contain your GitHub App private key.`));
      process.exit(1);
    } else {
      const iat = Math.floor(new Date().getTime() / 1000);
      const exp = iat + 60;
      const iss = githubApp.appId;
      const payload = { iat, exp, iss };

      const jwtToken = jwt.sign(payload, githubPrivateKey, { algorithm: 'RS256' });

      return this.github.get<GitHubInstallation[]>('app/installations', jwtToken)
        .map(installations => installations[0].id)
        .switchMap(installationId => this.github.post<{ token: string }>(`installations/${installationId}/access_tokens`, undefined, jwtToken))
        .map(response => response.token);
    }
  }
}
