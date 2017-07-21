export const agentPingDelay = 10 * 1000;
export const agentPingTimeout = 12 * 1000;

export enum AgentStatus {
  Offline,
  Idle,
  Busy
}

export interface Agent {
  name: string;
  status: AgentStatus;
  buildId: number;
  utcLastPingTimestamp: number;
}
