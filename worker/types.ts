export interface Env {
  DB: D1Database;
  PROBE_QUEUE: Queue<{ monitorId: string }>;
  ASSETS: Fetcher;
}

export interface Monitor {
  id: string;
  url: string;
  name: string | null;
  interval_seconds: number;
  active: number;
  created_at: string;
}

export interface MonitorWithStatus extends Monitor {
  status: string;
}

export interface GlobalMeasurementRecord {
  id: string;
  monitor_id: string;
  status: string;
  created_at: string;
  completed_at: string | null;
  external_id: string | null;
  error: string | null;
}

export interface RegionalResult {
  region: string | null;
  country: string | null;
  city: string | null;
  asn: number | null;
  network: string | null;
  status: string;
  http_status: number | null;
  resolved_address: string | null;
  dns_ms: number | null;
  tcp_ms: number | null;
  tls_ms: number | null;
  first_byte_ms: number | null;
  download_ms: number | null;
  total_ms: number | null;
  tls_authorized: number | null;
  tls_protocol: string | null;
  tls_cipher: string | null;
  tls_expires_at: string | null;
  tls_subject: string | null;
  tls_issuer: string | null;
  baseline_ms: number | null;
  anomaly: number;
  checked_at: string;
}

export interface MeasurementHistory {
  created_at: string;
  avg_ms: number | null;
  region_count: number;
}
