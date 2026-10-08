CREATE TABLE IF NOT EXISTS monitors (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  name TEXT,
  interval_seconds INTEGER NOT NULL DEFAULT 300,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS probe_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  monitor_id TEXT NOT NULL,
  status TEXT NOT NULL,
  http_status INTEGER,
  latency_ms INTEGER NOT NULL,
  checked_at TEXT NOT NULL,
  colo TEXT,
  error TEXT,
  FOREIGN KEY (monitor_id) REFERENCES monitors(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS baselines (
  monitor_id TEXT PRIMARY KEY,
  mean_ms REAL NOT NULL,
  samples INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (monitor_id) REFERENCES monitors(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_probe_results_monitor_checked
  ON probe_results(monitor_id, checked_at DESC);
