import * as chalk from 'chalk';
import * as fs from 'fs';
import { ConsoleService } from './../services/console.service';

export class ConfigService {
  static createArborConfig() {
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
      ConsoleService.log(`${chalk.green('Created new arbor.json config')}`);
    });
  }
}
