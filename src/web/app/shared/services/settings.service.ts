import { Injectable } from '@angular/core';

import { BuildConfiguration } from './../../../../common/interfaces/build-configuration';
import { DatabaseService } from './database.service';

@Injectable()
export class SettingsService {
  constructor(private database: DatabaseService) { }

  getBuildConfigurations() {
    return this.database.list<BuildConfiguration>('settings/buildConfigurations');
  }

  getBuildConfiguration(name: string) {
    return this.database.object<BuildConfiguration>(`settings/buildConfigurations/${name}`);
  }
}
