import { Injectable } from '@angular/core';
import * as chalk from 'chalk';
import * as fs from 'fs';
import * as fsExtra from 'fs-extra';
import * as path from 'path';
import * as rimraf from 'rimraf';

import { readFileIfExists } from '../../common/helpers/fs.helpers';
import { environment } from './../../common/environments/environment';

@Injectable()
export class DeployServerCommand {
  constructor() { }

  run() {
    console.log(`Arbor-CI v${environment.version}: Preparing to deploy server to Firebase.`);
    console.log();

    const firebaseJson = readFileIfExists('firebase.json');
    const firebaseInitJson = readFileIfExists('firebase.init.json');

    if (firebaseJson === undefined) {
      console.log(chalk.red('ERROR: This command must be run in a firebase app directory. firebase.json not found.'));
      process.exit(1);
    } else if (firebaseInitJson === undefined) {
      console.log(chalk.red('ERROR: Firebase initialization settings not found. Please put these settings in firebase.init.json.'));
      process.exit(1);
    } else {
      const firebaseConfig = JSON.parse(firebaseJson);

      const webPath = path.join(path.dirname(process.argv[1]), 'web');
      const hostingPath = path.resolve(firebaseConfig.hosting.public);

      console.log(`Copying website files to ${hostingPath}...`);

      rimraf.sync(hostingPath);
      fsExtra.copySync(webPath, hostingPath);

      const firebaseInit = JSON.stringify(JSON.parse(firebaseInitJson));

      const mainJsFileName = fs.readdirSync(hostingPath).find(filePath => /^main(?:\.[a-z0-9]+)?\.js/.test(filePath));
      const mainJsPath = path.join(hostingPath, mainJsFileName);

      const newMainJsContents = fs.readFileSync(mainJsPath).toString()
        .replace(/FirebaseAppConfigToken,{.+?}/, `FirebaseAppConfigToken,${firebaseInit}`)
        .replace(/exports.firebaseAppConfig\s+?=\s+?{(.|\r|\n)+?}/, `exports.firebaseAppConfig = ${firebaseInit}`);

      fs.writeFileSync(mainJsPath, newMainJsContents);

      console.log(`Files copied! Run ${chalk.yellow('firebase deploy')} to deploy.`);
    }
  }
}
