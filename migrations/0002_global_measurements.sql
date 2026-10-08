CREATE TABLE IF NOT EXISTS global_measurements (
  id TEXT PRIMARY KEY,
  monitor_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  external_id TEXT,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  completed_at TEXT,
  error TEXT,
  FOREIGN KEY (monitor_id) REFERENCES monitors(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS regional_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  measurement_id TEXT NOT NULL,
  monitor_id TEXT NOT NULL,
  continent TEXT,
  region TEXT,
  country TEXT,
  city TEXT,
  asn INTEGER,
  network TEXT,
  status TEXT NOT NULL,
  http_status INTEGER,
  resolved_address TEXT,
  dns_ms INTEGER,
  tcp_ms INTEGER,
  tls_ms INTEGER,
  first_byte_ms INTEGER,
  download_ms INTEGER,
  total_ms INTEGER,
  tls_authorized INTEGER,
  tls_protocol TEXT,
  tls_cipher TEXT,
  tls_expires_at TEXT,
  tls_subject TEXT,
  tls_issuer TEXT,
  baseline_ms REAL,
  anomaly INTEGER NOT NULL DEFAULT 0,
  checked_at TEXT NOT NULL,
  FOREIGN KEY (measurement_id) REFERENCES global_measurements(id) ON DELETE CASCADE,
  FOREIGN KEY (monitor_id) REFERENCES monitors(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_global_measurements_monitor_created ON global_measurements(monitor_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_regional_results_measurement ON regional_results(measurement_id);
CREATE INDEX IF NOT EXISTS idx_regional_results_monitor_checked ON regional_results(monitor_id,checked_at DESC);
