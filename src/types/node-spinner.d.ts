declare module 'node-spinner' {
  class NodeSpinner {
    set(frames: string): void;
    next(): number;
    reset(): void;
  }

  function Spinner(): NodeSpinner;

  export = Spinner;
}
