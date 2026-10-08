import type {
  Env,
  GlobalMeasurementRecord,
  MeasurementHistory,
  Monitor,
  MonitorWithStatus,
  RegionalResult,
} from "./types";

const MONITOR_COLUMNS =
  "id, url, name, interval_seconds, active, created_at";

const MEASUREMENT_COLUMNS =
  "id, monitor_id, status, created_at, completed_at, external_id, error";

export async function getMonitor(
  env: Env,
  monitorId: string,
): Promise<Monitor | null> {
  return env.DB.prepare(
    "SELECT " +
      MONITOR_COLUMNS +
      " FROM monitors WHERE id = ?1",
  )
    .bind(monitorId)
    .first<Monitor>();
}

export async function listMonitors(env: Env): Promise<MonitorWithStatus[]> {
  const result = await env.DB.prepare(
    "SELECT " +
      "m.id, m.url, m.name, m.interval_seconds, m.active, m.created_at, " +
      "COALESCE((" +
      "SELECT status FROM regional_results x " +
      "WHERE x.monitor_id = m.id " +
      "ORDER BY x.checked_at DESC LIMIT 1" +
      "), 'pending') AS status " +
      "FROM monitors m ORDER BY m.created_at DESC",
  ).all<MonitorWithStatus>();

  return result.results;
}

export async function createMonitor(
  env: Env,
  monitor: Monitor,
): Promise<void> {
  await env.DB.prepare(
    "INSERT INTO monitors " +
      "(id, url, name, interval_seconds, active, created_at) " +
      "VALUES (?, ?, ?, ?, ?, ?)",
  )
    .bind(
      monitor.id,
      monitor.url,
      monitor.name,
      monitor.interval_seconds,
      monitor.active,
      monitor.created_at,
    )
    .run();
}

export async function deleteMonitor(
  env: Env,
  monitorId: string,
): Promise<void> {
  await env.DB.prepare("DELETE FROM monitors WHERE id = ?1")
    .bind(monitorId)
    .run();
}

export async function getLatestMeasurement(
  env: Env,
  monitorId: string,
): Promise<GlobalMeasurementRecord | null> {
  return env.DB.prepare(
    "SELECT " +
      MEASUREMENT_COLUMNS +
      " FROM global_measurements " +
      "WHERE monitor_id = ?1 " +
      "ORDER BY created_at DESC LIMIT 1",
  )
    .bind(monitorId)
    .first<GlobalMeasurementRecord>();
}

export async function createMeasurement(
  env: Env,
  measurement: {
    id: string;
    monitorId: string;
    externalId: string;
    createdAt: string;
  },
): Promise<void> {
  await env.DB.prepare(
    "INSERT INTO global_measurements " +
      "(id, monitor_id, provider, external_id, status, created_at) " +
      "VALUES (?, ?, ?, ?, ?, ?)",
  )
    .bind(
      measurement.id,
      measurement.monitorId,
      "globalping",
      measurement.externalId,
      "in-progress",
      measurement.createdAt,
    )
    .run();
}

export async function finishMeasurement(
  env: Env,
  measurementId: string,
  completedAt: string,
): Promise<void> {
  await env.DB.prepare(
    "UPDATE global_measurements " +
      "SET status = 'finished', completed_at = ?, error = NULL " +
      "WHERE id = ?",
  )
    .bind(completedAt, measurementId)
    .run();
}

export async function getRegionalHistory(
  env: Env,
  monitorId: string,
): Promise<Array<{ region: string | null; total_ms: number | null }>> {
  const result = await env.DB.prepare(
    "SELECT region, total_ms FROM regional_results " +
      "WHERE monitor_id = ?1 AND total_ms IS NOT NULL " +
      "ORDER BY checked_at DESC LIMIT 500",
  )
    .bind(monitorId)
    .all<{ region: string | null; total_ms: number | null }>();

  return result.results;
}

export function prepareRegionalResultInsert(
  env: Env,
  values: [
    string,
    string,
    string,
    string,
    string,
    string,
    number,
    string,
    string,
    number | null,
    string | null,
    number | null,
    number | null,
    number | null,
    number | null,
    number | null,
    number | null,
    number | null,
    string | null,
    string | null,
    string | null,
    string | null,
    string | null,
    number | null,
    number,
    string,
  ],
): D1PreparedStatement {
  return env.DB.prepare(
    "INSERT INTO regional_results (" +
      "measurement_id, monitor_id, continent, region, country, city, " +
      "asn, network, status, http_status, resolved_address, dns_ms, " +
      "tcp_ms, tls_ms, first_byte_ms, download_ms, total_ms, " +
      "tls_authorized, tls_protocol, tls_cipher, tls_expires_at, " +
      "tls_subject, tls_issuer, baseline_ms, anomaly, checked_at" +
      ") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
  ).bind(...values);
}

export async function insertRegionalResults(
  env: Env,
  results: D1PreparedStatement[],
): Promise<void> {
  if (results.length > 0) {
    await env.DB.batch(results);
  }
}

export async function getRegionalResults(
  env: Env,
  measurementId: string,
): Promise<RegionalResult[]> {
  const result = await env.DB.prepare(
    "SELECT " +
      "region, country, city, asn, network, status, http_status, " +
      "resolved_address, dns_ms, tcp_ms, tls_ms, first_byte_ms, " +
      "download_ms, total_ms, tls_authorized, tls_protocol, tls_cipher, " +
      "tls_expires_at, tls_subject, tls_issuer, baseline_ms, anomaly, checked_at " +
      "FROM regional_results " +
      "WHERE measurement_id = ?1 ORDER BY total_ms DESC",
  )
    .bind(measurementId)
    .all<RegionalResult>();

  return result.results;
}

export async function getMeasurementHistory(
  env: Env,
  monitorId: string,
): Promise<MeasurementHistory[]> {
  const result = await env.DB.prepare(
    "SELECT gm.created_at, AVG(rr.total_ms) AS avg_ms, " +
      "COUNT(rr.id) AS region_count " +
      "FROM global_measurements gm " +
      "LEFT JOIN regional_results rr ON rr.measurement_id = gm.id " +
      "WHERE gm.monitor_id = ?1 " +
      "GROUP BY gm.id ORDER BY gm.created_at DESC LIMIT 40",
  )
    .bind(monitorId)
    .all<MeasurementHistory>();

  return result.results;
}

export async function getPendingMeasurements(
  env: Env,
): Promise<Array<{ id: string; monitor_id: string; external_id: string }>> {
  const result = await env.DB.prepare(
    "SELECT id, monitor_id, external_id FROM global_measurements " +
      "WHERE status = 'in-progress' AND external_id IS NOT NULL " +
      "ORDER BY created_at DESC LIMIT 100",
  ).all<{ id: string; monitor_id: string; external_id: string }>();

  return result.results;
}

export async function getActiveMonitorIds(
  env: Env,
): Promise<Array<{ id: string }>> {
  const result = await env.DB.prepare(
    "SELECT id FROM monitors WHERE active = 1",
  ).all<{ id: string }>();

  return result.results;
}
