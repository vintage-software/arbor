import { Injectable } from '@angular/core';

import { mapToArray, SimpleMap } from './../../../../common/helpers/object.helpers';
import { BuildConfiguration } from './../../../../common/interfaces/build-configuration';
import { DatabaseService } from './database.service';

@Injectable()
export class SettingsService {
  constructor(private database: DatabaseService) { }

  getBuildConfigurations() {
    return this.database.object<SimpleMap<BuildConfiguration>>('build-configurations')
      .map(buildConfigurationMap => mapToArray(buildConfigurationMap));
  }
}
