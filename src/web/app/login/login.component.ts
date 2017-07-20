import { Component } from '@angular/core';
import * as firebase from 'firebase/app';
import { Observable } from 'rxjs/Observable';

import { AuthService } from './../shared/services/auth.service';
import { NavigationService } from './../shared/services/navigation.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  readonly user: Observable<firebase.User>;

  constructor(private authService: AuthService, private navigationService: NavigationService) {
    this.user = this.authService.user
      .switchMap(user => user ? this.navigationService.navigateHome().mapTo(user) : Observable.of(user));
  }

  login() {
    this.authService.login().subscribe(() => { });
  }
}
