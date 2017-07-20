import { Component } from '@angular/core';
import * as firebase from 'firebase/app';
import { Observable } from 'rxjs/Observable';

import { AuthService } from './shared/services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  readonly user: Observable<firebase.User>;

  constructor(private authService: AuthService) {
    this.user = this.authService.user;
  }

  logout() {
    this.authService.logout().subscribe(() => { });
  }
}
