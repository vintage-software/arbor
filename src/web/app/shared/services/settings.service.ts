import { Injectable } from '@angular/core';
import { AngularFireDatabase } from 'angularfire2/database';
import { Observable } from 'rxjs/Observable';

import { mapToArray, SimpleMap } from './../../../../common/helpers/object.helpers';
import { BuildConfiguration } from './../../../../common/interfaces/build-configuration';

@Injectable()
export class SettingsService {
  constructor(private firebaseDatabase: AngularFireDatabase) { }

  getBuildConfigurations() {
    return (this.firebaseDatabase.object('build-configurations') as Observable<SimpleMap<BuildConfiguration>>)
      .map(buildConfigurationMap => mapToArray(buildConfigurationMap));
  }
}
