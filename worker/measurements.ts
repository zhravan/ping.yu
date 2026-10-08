import {
  createMeasurement,
  finishMeasurement,
  getActiveMonitorIds,
  getLatestMeasurement,
  getPendingMeasurements,
  getRegionalHistory,
  getMonitor,
  insertRegionalResults,
  prepareRegionalResultInsert,
} from "./db";
import {
  createGlobalMeasurement,
  getGlobalMeasurement,
} from "./globalping";
import type { Env, GlobalMeasurementRecord, Monitor } from "./types";

const MEASUREMENT_TTL_MS = 120_000;

export async function startMeasurement(
  env: Env,
  monitor: Monitor,
): Promise<{
  id: string;
  status: string;
  created_at: string;
  external_id: string;
}> {
  const existing = await getLatestMeasurement(env, monitor.id);

  if (
    existing?.status === "in-progress" &&
    Date.now() - Date.parse(existing.created_at) < MEASUREMENT_TTL_MS &&
    existing.external_id
  ) {
    return {
      id: existing.id,
      status: existing.status,
      created_at: existing.created_at,
      external_id: existing.external_id,
    };
  }

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const measurement = await createGlobalMeasurement(monitor.url);

  await createMeasurement(env, {
    id,
    monitorId: monitor.id,
    externalId: measurement.id,
    createdAt,
  });

  return {
    id,
    status: "in-progress",
    created_at: createdAt,
    external_id: measurement.id,
  };
}

export async function syncMeasurement(
  env: Env,
  measurementRecord: Pick<
    GlobalMeasurementRecord,
    "id" | "monitor_id" | "external_id"
  >,
): Promise<void> {
  const measurement = await getGlobalMeasurement(
    measurementRecord.external_id,
  );

  if (measurement.status === "in-progress") {
    return;
  }

  const checkedAt = measurement.updatedAt || new Date().toISOString();
  const history = await getRegionalHistory(env, measurementRecord.monitor_id);

  const sums = new Map<string, number>();
  const counts = new Map<string, number>();

  for (const item of history) {
    if (item.region && item.total_ms != null) {
      sums.set(item.region, (sums.get(item.region) ?? 0) + item.total_ms);
      counts.set(item.region, (counts.get(item.region) ?? 0) + 1);
    }
  }

  const statements = measurement.results.map(({ probe, result }) => {
    const total = result.timings?.total ?? null;
    const count = probe.region ? counts.get(probe.region) : undefined;
    const baseline =
      probe.region && count
        ? sums.get(probe.region)! / count
        : null;

    const status =
      result.status !== "finished"
        ? "down"
        : result.statusCode != null && result.statusCode < 400
          ? "up"
          : "degraded";

    const anomaly =
      baseline != null &&
      total != null &&
      total >= Math.max(baseline * 2.5, baseline + 200)
        ? 1
        : 0;

    return prepareRegionalResultInsert(env, [
      measurementRecord.id,
      measurementRecord.monitor_id,
      probe.continent,
      probe.region,
      probe.country,
      probe.city,
      probe.asn,
      probe.network,
      status,
      result.statusCode ?? null,
      result.resolvedAddress ?? null,
      result.timings?.dns ?? null,
      result.timings?.tcp ?? null,
      result.timings?.tls ?? null,
      result.timings?.firstByte ?? null,
      result.timings?.download ?? null,
      total,
      result.tls?.authorized == null
        ? null
        : result.tls.authorized
          ? 1
          : 0,
      result.tls?.protocol ?? null,
      result.tls?.cipherName ?? null,
      result.tls?.expiresAt ?? null,
      result.tls?.subject?.CN ?? null,
      result.tls?.issuer?.CN ?? null,
      baseline,
      anomaly,
      checkedAt,
    ]);
  });

  await insertRegionalResults(env, statements);
  await finishMeasurement(env, measurementRecord.id, checkedAt);
}

export async function syncLatestMeasurement(
  env: Env,
  monitorId: string,
): Promise<GlobalMeasurementRecord | null> {
  const latest = await getLatestMeasurement(env, monitorId);

  if (latest?.status === "in-progress" && latest.external_id) {
    try {
      await syncMeasurement(env, latest);
    } catch (error) {
      console.error(error);
    }
  }

  return getLatestMeasurement(env, monitorId);
}

export async function syncPendingMeasurements(env: Env): Promise<void> {
  const pending = await getPendingMeasurements(env);

  for (const measurement of pending) {
    try {
      await syncMeasurement(env, measurement);
    } catch (error) {
      console.error(error);
    }
  }
}

export async function queueActiveMonitors(env: Env): Promise<void> {
  const monitors = await getActiveMonitorIds(env);

  for (const monitor of monitors) {
    await env.PROBE_QUEUE.send(
      { monitorId: monitor.id },
      { contentType: "json" },
    );
  }
}

export async function processProbe(
  env: Env,
  monitorId: string,
): Promise<"ack" | "retry"> {
  const monitor = await getMonitor(env, monitorId);

  if (!monitor || !monitor.active) {
    return "ack";
  }

  try {
    await startMeasurement(env, monitor);
    return "ack";
  } catch (error) {
    console.error(error);
    return "retry";
  }
}
