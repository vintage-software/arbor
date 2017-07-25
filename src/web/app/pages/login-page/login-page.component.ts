import { Component } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { AuthService, User} from './../../common/core/services/auth.service';
import { NavigationService } from './../../common/core/services/navigation.service';

@Component({
  selector: 'app-login-page',
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.scss']
})
export class LoginPageComponent {
  readonly user: Observable<User>;

  constructor(private authService: AuthService, private navigationService: NavigationService) {
    this.user = this.authService.user
      .switchMap(user => user ? this.navigationService.navigateHome().mapTo(user) : Observable.of(user));
  }

  login() {
    this.authService.login().subscribe(() => { });
  }
}
