ALTER TABLE monitors ADD COLUMN next_check_at INTEGER NOT NULL DEFAULT 0;
ALTER TABLE monitors ADD COLUMN last_checked_at INTEGER;

UPDATE monitors
SET interval_seconds = 1800,
    next_check_at = CAST(strftime('%s', 'now') AS INTEGER) + (abs(random()) % 1800);

CREATE INDEX IF NOT EXISTS idx_monitors_due
  ON monitors(active, next_check_at);
