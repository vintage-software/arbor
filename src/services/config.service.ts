import chalk = require('chalk');
import * as fs from 'fs';
import { Injectable } from 'injection-js';

import { ConsoleService } from './../services/console.service';

@Injectable()
export class ConfigService {
  constructor(private console: ConsoleService) {
  }

  createArborConfig() {
    const config = `{
  "name": "project-name",
  "tasks": {
    "install": "",
    "lint": "",
    "test": "",
    "build": "",
    "build--prod": "",
    "deploy": ""
  },
  "external": [],
  "dependencies": []
}
  `;

    fs.writeFile('arbor.json', config, 'utf8', () => {
      this.console.log(`${chalk.green('Created new arbor.json config')}`);
    });
  }
}
