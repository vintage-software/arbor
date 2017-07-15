import { NgModule } from '@angular/core';
import { ServerModule } from '@angular/platform-server';

import { ConfigService } from './services/config.service';
import { ConsoleService } from './services/console.service';
import { DependencyGraphService } from './services/dependency-graph.service';
import { LogService } from './services/log.service';
import { ProgramService } from './services/program.service';
import { ProjectService } from './services/project.service';
import { ScriptService } from './services/script.service';
import { ShellService } from './services/shell.service';
import { TaskRunnerService } from './services/task-runner.service';
import { VersionService } from './services/version.service';

@NgModule({
  imports: [
    ServerModule
  ],
  providers: [
    ConfigService,
    ConsoleService,
    DependencyGraphService,
    LogService,
    ProgramService,
    ProjectService,
    ScriptService,
    ShellService,
    TaskRunnerService,
    VersionService
  ]
})
export class AppModule {
  ngDoBootstrap() { }
}
