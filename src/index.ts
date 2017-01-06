#! /usr/bin/env node
/// <reference path="types/dependency-graph.d.ts" />

import * as fs from 'fs';
import * as path from 'path';

import * as chalk from 'chalk';
import * as program from 'commander';

import { DepGraph } from 'dependency-graph';

import { Project, Task } from './helpers/project';
import { RunningTask } from './helpers/running-task';
import { ConsoleService } from './services/console.service';
import { ExecResult, ShellService } from './services/shell.service';
import { getLatestVersion } from './services/version.service';

const currentVersion = require('../package.json').version;
const errorLogFile = 'arbor-error.log';
const infoLogFile = 'arbor-info.log';

mapVersionFlag();

getLatestVersion().then((version: string) => {
  showUpdateMessage(version, currentVersion);
  startArbor();
}).catch(() => {
  startArbor();
});

function startArbor() {
  program
    .version(currentVersion)
    .command('run <tasks...>')
    .action(run);

  program.parse(process.argv);
}

function run(taskNames: string[]) {
  console.log(taskNames);
  ConsoleService.log(`Arbor: running tasks ${taskNames.join(', ')} in ${process.cwd()}\n`);

  deleteLogs();

  if (taskNames.length) {
    let next = () => {
      taskNames.shift();

      if (taskNames.length) {
        runTask(taskNames[0], next);
      }
    };

    runTask(taskNames[0], next);
  }
}

function runTask(taskName: string, next: () => void, projectNames: string[] = undefined) {
  ConsoleService.log(`Task: ${taskName}`);

  startTasks(taskName, projectNames)
    .then(runningTasks => renderProgress(taskName, runningTasks))
    .then(() => next())
    .catch((runningTasks: RunningTask[]) => {
      ConsoleService.question('Task failed. Press "y" to restart all projects. Press "f" to restart failed projects. ')
        .then(response => {
          if (response === 'y') {
            ConsoleService.log('');
            runTask(taskName, next);
          } else if (response === 'f') {
            let failedProjectNames = runningTasks
              .filter(task => task.success === false)
              .map(task => task.projectName);

            ConsoleService.log('');
            runTask(taskName, next, failedProjectNames);
          }
        });
    });
}

function startTasks(taskName: string, projectNames: string[] = undefined): Promise<RunningTask[]> {
  return getProjects(getConfigs('./'))
    .then(projects => projects.filter(project => project.tasks[taskName] !== undefined))
    .then(projects => projectNames === undefined ? projects : projects.filter(p => projectNames.some(n => p.name === n)))
    .then(projects => resolveDependencies(taskName, projects))
    .then(projects => {
      let flattenProjects: Project[] = [].concat.apply([], projects);
      let runningTasks: RunningTask[] = flattenProjects
        .map(project => ({ projectName: project.name, waiting: true }));

      if (projects.length) {
        let next = () => {
          projects.shift();

          if (projects.length) {
            runProjectGroup(runningTasks, taskName, projects[0], next);
          }
        };

        runProjectGroup(runningTasks, taskName, projects[0], next);
      }

      return runningTasks;
    });
}

function runProjectGroup(runningTasks: RunningTask[], taskName: string, projects: Project[], next: () => void) {
  let taskPromises: Promise<void>[] = [];

  for (let project of projects) {
    let task = project.tasks[taskName];

    let runningTask = runningTasks.find(t => t.projectName === project.name);
    runningTask.waiting = false;

    let taskPromise = runProjectTask(project, task, runningTask)
      .then(() => {
        runningTask.success = true;
      })
      .catch((result: ExecResult) => {
        handleError(project, runningTask, result);
      });

    taskPromises.push(taskPromise);
  }

  Promise.all(taskPromises).then(() => next());
}

function runProjectTask(project: Project, task: Task, runningTask: RunningTask): Promise<ExecResult> {
  const maxBuffer = 1024 * 500;

  task = Array.isArray(task) ? task : [task];
  let commands = task
    .map(command => typeof command === 'string' ? { command } : command);

  let runCommands = Promise.resolve(undefined);

  for (let command of commands) {
    runCommands = runCommands
      .then(() => {
        runningTask.status = command.status;
      })
      .then(() => {
        let cwd = command.cwd ? path.join(project.projectPath, command.cwd) : project.projectPath;
        return ShellService.execute(command.command, { cwd, maxBuffer });
      });
  }

  return runCommands;
}

function resolveDependencies(taskName: string, projects: Project[]): Project[][] {
  let result: Project[][] = [];

  let projectsToConsider = projects;
  do {
    let depGraph = new DepGraph<Project>();

    for (let project of projectsToConsider) {
      depGraph.addNode(project.name);
    }

    for (let dependant of projectsToConsider) {
      if (dependant.dependencies && dependant.dependencies.length) {
        for (let depencency of dependant.dependencies) {
          if (depGraph.hasNode(depencency)) {
            depGraph.addDependency(dependant.name, depencency);
          }
        }
      }
    }

    let leaves = depGraph.overallOrder(true)
      .map(node => projects.find(project => project.name === node));

    result.push(leaves);

    let addedProjects: Project[] = [].concat.apply([], result);
    projectsToConsider = projects
      .filter(project => addedProjects.find(added => added.name === project.name) === undefined);
  }
  while (projectsToConsider.length > 0);

  let logInfo = `
------------------------------------------------------------------------------------------
Task: ${taskName}

Dependency Graph:

${result.map(group => JSON.stringify(group.map(project => project.name))).join('\n')}
------------------------------------------------------------------------------------------`;

  log(logInfo, false);

  return result;
}

function handleError(project: Project, runningTask: RunningTask, result: ExecResult): void {
  runningTask.success = false;

  let errorText = `
------------------------------------------------------------------------------------------
Project: ${path.join(project.projectPath, 'arbor.json')}
Task: ${runningTask.projectName}
Command: ${result.options.cwd}> ${result.command}

${result.stdout ? `* Standard Output:\n${result.stdout}\n` : ''}
${result.stderr ? `* Standard Error:\n${result.stderr}\n` : ''}
------------------------------------------------------------------------------------------`;

  log(errorText, true);
}

function renderProgress(taskName: string, runningTasks: RunningTask[]): Promise<RunningTask[]> {
  return new Promise<RunningTask[]>((resolve, reject) => {
    let defaultStatus = getDefaultStatus(taskName);

    let interval = setInterval(() => {
      let output = '';

      for (let task of runningTasks) {
        if (task.waiting) {
          output += `  ${task.projectName}: ${chalk.gray('waiting...')} \n`;
        } else if (task.success !== undefined) {
          output += `  ${task.projectName}: ${task.success ? chalk.green('done!') : chalk.red('failed!')} \n`;
        } else {
          output += `  ${task.projectName}: ${chalk.yellow(`${task.status ? task.status : defaultStatus}...`)} \n`;
        }
      }

      ConsoleService.progress(output);

      let completedTasks = runningTasks
        .filter(task => task.success !== undefined);

      if (completedTasks.length === runningTasks.length) {
        ConsoleService.finalizeProgress();
        clearInterval(interval);

        let success = runningTasks.every(task => task.success === true);

        if (success) {
          resolve(runningTasks);
        } else {
          reject(runningTasks);
        }
      }
    }, 100);
  });
}

function getConfigs(dir: string, filelist: string[] = []): string[] {
  fs.readdirSync(dir).forEach(file => {
    if (fs.statSync(path.join(dir, file)).isDirectory() && !path.join(dir, file).includes('node_modules')) {
      filelist = getConfigs(path.join(dir, file), filelist);
    } else if (path.join(dir, file).endsWith('arbor.json')) {
      filelist = filelist.concat(path.join(dir, file));
    }
  });

  return filelist;
}

function getProjects(configFiles: string[]): Promise<Project[]> {
  return new Promise<Project[]>((resolve, reject) => {
    let promises = configFiles
      .map(configFile => readConfig(configFile));

    Promise.all(promises)
      .then(projects => resolve([].concat.apply([], projects)))
      .catch(error => reject(error));
  });
}

function readConfig(configFile: string): Promise<Project[]> {
  return new Promise<Project[]>((resolve, reject) => {
    fs.readFile(configFile, (error, data) => {
      if (error) {
        reject(error);
      } else {
        let projectPath = path.resolve(path.dirname(configFile));

        let projects: Project[] = JSON.parse(data.toString());
        projects = Array.isArray(projects) ? projects : [projects];

        for (let project of projects) {
          project.projectPath = projectPath;
        }

        resolve(projects);
      }
    });
  });
}

function getDefaultStatus(taskName: string): string {
  let status = 'processing';

  if (taskName.indexOf('install') > -1) {
    status = 'installing';
  } else if (taskName.indexOf('build') > -1) {
    status = 'building';
  } else if (taskName.indexOf('test') > -1) {
    status = 'testing';
  }

  return status;
}

function log(output: string, error: boolean) {
  let file = error ? errorLogFile : infoLogFile;
  let outputToWrite = output.replace(/\r\n|\r|\n/g, '\r\n');

  fs.appendFileSync(file, outputToWrite);
}

function deleteLogs() {
  if (fs.existsSync(errorLogFile)) {
    fs.unlinkSync(errorLogFile);
  }

  if (fs.existsSync(infoLogFile)) {
    fs.unlinkSync(infoLogFile);
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
    ConsoleService.log(`
New version available. Run ${chalk.yellow('npm install -g arbor')} to update
Local Version: ${current}
Latest Version: ${latest}
    `);
  }
}
