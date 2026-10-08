export type MonitorStatus = "up" | "degraded" | "down";

export interface Monitor {
  id: string;
  url: string;
  name?: string;
  intervalSeconds: number;
  createdAt: string;
}

export interface ProbeResult {
  monitorId: string;
  url: string;
  status: MonitorStatus;
  httpStatus: number | null;
  latencyMs: number;
  checkedAt: string;
  region?: string;
}
