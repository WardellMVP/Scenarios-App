// User types
export interface User {
  id: number;
  username: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  gitlabId: number;
  createdAt: string;
}

// Scenario types
export interface Scenario {
  id: number;
  name: string;
  description?: string;
  targetApps: string[];
  execCommand: string;
  filePath: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScenarioRun {
  id: number;
  scenarioId: number;
  userId: number;
  status: "pending" | "running" | "success" | "failed";
  startTime: string;
  endTime?: string;
  duration?: number;
  output?: string;
  scenario?: Scenario;
  user?: User;
}

// Stats types
export interface Stats {
  id: number;
  totalScenarios: number;
  successfulRuns: number;
  failedRuns: number;
  lastRunTime?: string;
  updatedAt: string;
}

// WebSocket message types
export interface WebSocketSubscribeMessage {
  type: "subscribe";
  runId: number;
}

export interface WebSocketSubscribedMessage {
  type: "subscribed";
  runId: number;
}

export type WebSocketMessage = 
  | WebSocketSubscribeMessage
  | WebSocketSubscribedMessage
  | { error: string };
