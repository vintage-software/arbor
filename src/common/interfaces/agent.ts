export enum AgentStatus {
  Offline,
  Idle,
  Busy
}

export interface Agent {
  name: string;
  status: AgentStatus;
  buildId: number;
}
