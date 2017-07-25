import { Component } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { AuthService, User } from './common/core/services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  readonly user: Observable<User>;

  constructor(private authService: AuthService) {
    this.user = this.authService.user;
  }

  logout() {
    this.authService.logout().subscribe(() => { });
  }
}
