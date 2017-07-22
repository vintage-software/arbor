import { Injectable } from '@angular/core';
import * as chalk from 'chalk';
import * as fs from 'fs';
import * as fsExtra from 'fs-extra';
import * as path from 'path';
import * as rimraf from 'rimraf';

import { environment } from './../../common/environments/environment';
import { Command } from './../../common/interfaces/command';
import { firebaseAppConfigFilename, firebaseAppInitConfigFilename, FirebaseConfigService } from './../services/firebase-config.service';

@Injectable()
export class DeployServerCommand implements Command {
  constructor(private firebaseConfig: FirebaseConfigService) { }

  run() {
    console.log(`Arbor-CI v${environment.version}: Preparing to deploy server to Firebase.`);
    console.log();

    if (this.firebaseConfig.firebaseAppConfig === undefined) {
      console.log(chalk.red(`ERROR: ${firebaseAppConfigFilename} not found. This command must be run in a firebase app directory.`));
      process.exit(1);
    } else if (this.firebaseConfig.firebaseAppInitConfig === undefined) {
      console.log(chalk.red(`ERROR: ${firebaseAppInitConfigFilename} not found. This file must contain your firebase app initialization settings.`));
      process.exit(1);
    } else {
      const webPath = path.join(path.dirname(process.argv[1]), 'web');
      const hostingPath = path.resolve(this.firebaseConfig.firebaseAppConfig.hosting.public);

      console.log(`Copying website files to ${hostingPath}...`);

      rimraf.sync(hostingPath);
      fsExtra.copySync(webPath, hostingPath);

      const mainJsFileName = fs.readdirSync(hostingPath).find(filePath => /^main(?:\.[a-z0-9]+)?\.js/.test(filePath));
      const mainJsPath = path.join(hostingPath, mainJsFileName);

      const newMainJsContents = fs.readFileSync(mainJsPath).toString()
        .replace(/FirebaseAppConfigToken,{.+?}/, `FirebaseAppConfigToken,${this.firebaseConfig.firebaseAppInitConfig}`)
        .replace(/exports.firebaseAppConfig\s+?=\s+?{(.|\r|\n)+?}/, `exports.firebaseAppConfig = ${this.firebaseConfig.firebaseAppInitConfig}`);

      fs.writeFileSync(mainJsPath, newMainJsContents);

      console.log(`Files copied! Run ${chalk.yellow('firebase deploy')} to deploy.`);
    }
  }

  stop() { }
}
