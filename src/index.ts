#! /usr/bin/env node

import 'reflect-metadata';

import * as chalk from 'chalk';
import * as program from 'commander';

import { ReflectiveInjector } from '@angular/core';

import { providers } from './providers';
import { ConfigService } from './services/config.service';
import { ConsoleService } from './services/console.service';
import { LogService } from './services/log.service';
import { ProjectService } from './services/project.service';
import { TaskRunnerService } from './services/task-runner.service';
import { VersionService } from './services/version.service';


const injector = ReflectiveInjector.resolveAndCreate(providers);
const configService: ConfigService = injector.get(ConfigService);
const console: ConsoleService = injector.get(ConsoleService);
const logService: LogService = injector.get(LogService);
const projectService: ProjectService = injector.get(ProjectService);
const taskRunner: TaskRunnerService = injector.get(TaskRunnerService);
const versionService: VersionService = injector.get(VersionService);

const currentVersion = require('../package.json').version;

mapVersionFlag();

versionService.getLatestVersion()
  .then(version => {
    showUpdateMessage(version, currentVersion);
    startArbor();
  })
  .catch(() => {
    startArbor();
  });

function startArbor() {
  program.version(currentVersion);

  program
    .command('run <tasks...>')
    .description('Run a given list of Arbor tasks')
    .action(run);

  program
    .command('init')
    .description('Create a new Arbor config')
    .action(() => { configService.createArborConfig(); });

  program.parse(process.argv);
}

function run(taskNames: string[]) {
  console.log(`Arbor: running tasks ${taskNames.join(', ')} in ${process.cwd()}\n`);

  logService.deleteLogs();

  if (taskNames.length) {

    projectService.getProjects()
      .then(projects => {
        let next = () => {
          taskNames.shift();

          if (taskNames.length) {
            taskRunner.runTask(projects, taskNames[0], next);
          }
        };

        taskRunner.runTask(projects, taskNames[0], next);
      });
  }
}

function mapVersionFlag() {
  // maps lower -v to the version flag of commander
  let vPos = process.argv.indexOf('-v');
  if (vPos > -1) {
    process.argv[vPos] = '-V';
  }
}

function showUpdateMessage(latest: string, current: string) {
  if (current !== latest) {
    console.log(`
New version available. Run ${chalk.yellow('npm install -g arbor')} to update.
Local Version: ${current}
Latest Version: ${latest}
    `);
  }
}
