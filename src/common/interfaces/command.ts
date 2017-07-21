import { Observable } from 'rxjs/Observable';

export interface Command {
  run: () => void;
  stop: () => void | Observable<void>;
}
