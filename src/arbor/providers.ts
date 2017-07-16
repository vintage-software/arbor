import { ConsoleService } from './../common/services/console.service';
import { ShellService } from './../common/services/shell.service';
import { VersionService } from './../common/services/version.service';
import { RunCommand } from './commands/run.command';
import { ScriptCommand } from './commands/script.command';
import { ArborProgramService } from './services/arbor-program.service';
import { ConfigService } from './services/config.service';
import { DependencyGraphService } from './services/dependency-graph.service';
import { LogService } from './services/log.service';
import { ProgressService } from './services/progress.service';
import { ProjectService } from './services/project.service';
import { ScriptService } from './services/script.service';
import { TaskRunnerService } from './services/task-runner.service';

export const providers = [
  ArborProgramService,
  ConfigService,
  ConsoleService,
  DependencyGraphService,
  LogService,
  ProgressService,
  ProjectService,
  RunCommand,
  ScriptCommand,
  ScriptService,
  ShellService,
  TaskRunnerService,
  VersionService
];
