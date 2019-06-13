import { Observable } from 'rxjs';

export interface Command {
  run: () => void;
  stop: () => void | Observable<void>;
}
