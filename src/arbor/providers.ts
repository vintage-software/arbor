import { RunCommand } from './commands/run.command';
import { ScriptCommand } from './commands/script.command';
import { ArborProgramService } from './services/arbor-program.service';
import { ConfigService } from './services/config.service';
import { ConsoleService } from './services/console.service';
import { DependencyGraphService } from './services/dependency-graph.service';
import { LogService } from './services/log.service';
import { ProgressService } from './services/progress.service';
import { ProjectService } from './services/project.service';
import { ScriptService } from './services/script.service';
import { ShellService } from './services/shell.service';
import { TaskRunnerService } from './services/task-runner.service';
import { VersionService } from './services/version.service';

export const providers = [
  ArborProgramService,
  ConfigService,
  ConsoleService,
  DependencyGraphService,
  LogService,
  ProgressService,
  ProjectService,
  RunCommand,
  ScriptService,
  ShellService,
  ScriptCommand,
  TaskRunnerService,
  VersionService
];
