import { ModuleWithProviders, NgModule, Optional, SkipSelf } from '@angular/core';

import { GitHubApiService } from './../../../../common/services/github-api.service';
import { AgentsService } from './services/agents.service';
import { AuthService } from './services/auth.service';
import { BuildsService } from './services/builds.service';
import { DatabaseService } from './services/database.service';
import { GitHubService } from './services/github.service';
import { NavigationService } from './services/navigation.service';
import { SettingsService } from './services/settings.service';

@NgModule()
export class CoreModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: CoreModule,
      providers: [
        AgentsService,
        AuthService,
        BuildsService,
        DatabaseService,
        GitHubApiService,
        GitHubService,
        NavigationService,
        SettingsService
      ]
    };
  }

  constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
    if (parentModule) {
      throw new Error('CoreModule is already loaded. Import it in the AppModule only');
    }
  }
}
