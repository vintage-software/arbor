declare module 'node-spinner' {
  class NodeSpinner {
    set(frames: string): void;
    next(): string;
    reset(): void;
  }

  function Spinner(): NodeSpinner;

  export = Spinner;
}
