import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { toColdObservable } from './../helpers/observable.helpers';

@Injectable()
export class NavigationService {
  constructor(private router: Router) { }

  navigateHome() {
    return this.navigate('/');
  }

  navigateToLogin() {
    return this.navigate('/login');
  }

  protected navigate(url: string) {
    return toColdObservable(this.router.navigateByUrl(url));
  }
}
