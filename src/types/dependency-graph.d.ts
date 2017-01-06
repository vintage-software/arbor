declare module 'dependency-graph' {
  export class DepGraph<T> {
    constructor();

    addNode(node: string, data?: T): void;
    removeNode(node: string): void;
    hasNode(node: string): boolean;
    getNodeData(node: string): T;
    setNodeData(node: string, data?: T): void;
    addDependency(fromNode: string, toNode: string): void;
    removeDependency(fromNode: string, toNode: string): void;
    dependenciesOf(node: string, leavesOnly?: boolean): string[];
    dependantsOf(node: string, leavesOnly?: boolean): string[];
    overallOrder(leavesOnly?: boolean): string[];
  }
}
