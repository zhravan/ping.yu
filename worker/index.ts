import { probeHttp } from "../src/probe/http";
import { isAnomaly, updateBaseline, type Baseline } from "../src/anomaly/baseline";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  PROBE_QUEUE: Queue<ProbeMessage>;
}

interface ProbeMessage {
  monitorId: string;
}

interface MonitorRow {
  id: string;
  url: string;
  name: string | null;
  interval_seconds: number;
  active: number;
  created_at: string;
}

const jsonHeaders = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: jsonHeaders,
  });
}

async function body<T>(request: Request): Promise<T> {
  return request.json<T>();
}

function urlFor(request: Request, path: string) {
  return new URL(path, request.url);
}

async function getMonitor(env: Env, id: string): Promise<MonitorRow | null> {
  return env.DB.prepare(
    "SELECT id, url, name, interval_seconds, active, created_at FROM monitors WHERE id = ?1",
  )
    .bind(id)
    .first<MonitorRow>();
}

async function recordProbe(env: Env, result: Awaited<ReturnType<typeof probeHttp>>, colo: string | null) {
  await env.DB.prepare(
    `INSERT INTO probe_results
      (monitor_id, status, http_status, latency_ms, checked_at, colo, error)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`,
  )
    .bind(
      result.monitorId,
      result.status,
      result.httpStatus,
      result.latencyMs,
      result.checkedAt,
      colo,
      result.status === "down" ? "request_failed" : null,
    )
    .run();

  const current = await env.DB.prepare(
    "SELECT mean_ms, samples FROM baselines WHERE monitor_id = ?1",
  )
    .bind(result.monitorId)
    .first<{ mean_ms: number; samples: number }>();

  const baseline: Baseline | null = current
    ? { meanMs: current.mean_ms, samples: current.samples }
    : null;

  const anomaly = baseline ? isAnomaly(baseline, result.latencyMs) : false;
  const next = updateBaseline(baseline, result.latencyMs);

  await env.DB.prepare(
    `INSERT INTO baselines (monitor_id, mean_ms, samples, updated_at)
     VALUES (?1, ?2, ?3, ?4)
     ON CONFLICT(monitor_id) DO UPDATE SET
       mean_ms = excluded.mean_ms,
       samples = excluded.samples,
       updated_at = excluded.updated_at`,
  )
    .bind(result.monitorId, next.meanMs, next.samples, result.checkedAt)
    .run();

  return { result, anomaly, baseline: next };
}

async function handleApi(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);

  if (url.pathname === "/api/health" && request.method === "GET") {
    const colo = (request.cf as { colo?: string } | undefined)?.colo ?? null;
    return json({ ok: true, service: "ping.yu", colo });
  }

  if (url.pathname === "/api/monitors" && request.method === "GET") {
    const result = await env.DB.prepare(
      "SELECT id, url, name, interval_seconds, active, created_at FROM monitors ORDER BY created_at DESC",
    ).all<MonitorRow>();

    return json(result.results);
  }

  if (url.pathname === "/api/monitors" && request.method === "POST") {
    const input = await body<{ url?: string; name?: string }>(request);

    if (!input.url) return json({ error: "url is required" }, 400);

    let parsed: URL;
    try {
      parsed = new URL(input.url);
    } catch {
      return json({ error: "invalid url" }, 400);
    }

    if (!["http:", "https:"].includes(parsed.protocol)) {
      return json({ error: "only http and https are supported" }, 400);
    }

    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    await env.DB.prepare(
      `INSERT INTO monitors (id, url, name, interval_seconds, active, created_at)
       VALUES (?1, ?2, ?3, 300, 1, ?4)`,
    )
      .bind(id, parsed.toString(), input.name?.trim() || null, createdAt)
      .run();

    await env.PROBE_QUEUE.send(
      { monitorId: id },
      { contentType: "json" },
    );

    return json(
      {
        id,
        url: parsed.toString(),
        name: input.name?.trim() || null,
        intervalSeconds: 300,
        active: true,
        createdAt,
      },
      201,
    );
  }

  const match = url.pathname.match(/^\/api\/monitors\/([^/]+)$/);
  if (match && request.method === "DELETE") {
    await env.DB.prepare("DELETE FROM monitors WHERE id = ?1").bind(match[1]).run();
    return new Response(null, { status: 204 });
  }

  const recentMatch = url.pathname.match(/^\/api\/monitors\/([^/]+)\/recent$/);
  if (recentMatch && request.method === "GET") {
    const limit = Math.min(
      Math.max(Number(url.searchParams.get("limit") ?? 60), 1),
      200,
    );

    const [monitor, recent, baseline] = await Promise.all([
      getMonitor(env, recentMatch[1]),
      env.DB.prepare(
        `SELECT status, http_status, latency_ms, checked_at, colo, error
         FROM probe_results
         WHERE monitor_id = ?1
         ORDER BY checked_at DESC
         LIMIT ?2`,
      ).bind(recentMatch[1], limit).all(),
      env.DB.prepare(
        "SELECT mean_ms, samples, updated_at FROM baselines WHERE monitor_id = ?1",
      ).bind(recentMatch[1]).first(),
    ]);

    if (!monitor) return json({ error: "monitor not found" }, 404);

    return json({
      monitor,
      baseline,
      results: recent.results,
    });
  }

  const probeMatch = url.pathname.match(/^\/api\/monitors\/([^/]+)\/probe$/);
  if (probeMatch && request.method === "POST") {
    const monitor = await getMonitor(env, probeMatch[1]);
    if (!monitor) return json({ error: "monitor not found" }, 404);

    const result = await probeHttp(monitor.id, monitor.url);
    const colo = (request.cf as { colo?: string } | undefined)?.colo ?? null;
    return json(await recordProbe(env, result, colo));
  }

  return env.ASSETS.fetch(request);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return handleApi(request, env);
  },

  async scheduled(_controller: ScheduledController, env: Env): Promise<void> {
    const monitors = await env.DB.prepare(
      "SELECT id FROM monitors WHERE active = 1",
    ).all<{ id: string }>();

    for (const monitor of monitors.results) {
      await env.PROBE_QUEUE.send(
        { monitorId: monitor.id },
        { contentType: "json" },
      );
    }
  },

  async queue(
    batch: MessageBatch<ProbeMessage>,
    env: Env,
  ): Promise<void> {
    for (const message of batch.messages) {
      const monitor = await getMonitor(env, message.body.monitorId);
      if (!monitor || !monitor.active) {
        message.ack();
        continue;
      }

      const result = await probeHttp(monitor.id, monitor.url);
      await recordProbe(env, result, null);
      message.ack();
    }
  },
};
