import {
  createMonitor,
  deleteMonitorForUser,
  getMeasurementHistory,
  getMonitorForUser,
  getRegionalResults,
  listMonitorsForUser,
} from "./db";
import { getSession, createAuth } from "./auth";
import { syncLatestMeasurement } from "./measurements";
import type { Env, Monitor } from "./types";

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function validateMonitorUrl(value: unknown): URL | null {
  if (typeof value !== "string" || !value) {
    return null;
  }

  try {
    const url = new URL(value);

    if (!["http:", "https:"].includes(url.protocol)) {
      return null;
    }

    if (url.username || url.password) {
      return null;
    }

    return url;
  } catch {
    return null;
  }
}

async function createMonitorFromRequest(
  request: Request,
  env: Env,
  userId: string,
): Promise<Response> {
  const input = await request.json<{ url?: string; name?: string }>();
  const parsedUrl = validateMonitorUrl(input.url);

  if (!input.url) {
    return json({ error: "url is required" }, 400);
  }

  if (!parsedUrl) {
    return json({ error: "invalid url" }, 400);
  }

  const monitor: Monitor = {
    id: crypto.randomUUID(),
    user_id: userId,
    url: parsedUrl.toString(),
    name: input.name?.trim() || null,
    interval_seconds: 300,
    active: 1,
    created_at: new Date().toISOString(),
  };

  await createMonitor(env, monitor);

  try {
    await env.PROBE_QUEUE.send(
      { monitorId: monitor.id },
      { contentType: "json" },
    );
  } catch (error) {
    await deleteMonitorForUser(env, monitor.id, userId);

    return json(
      {
        error: "monitor could not be queued",
        detail: String(error),
      },
      502,
    );
  }

  return json({ monitor, status: "pending" }, 201);
}

async function getMonitorDetail(
  env: Env,
  monitorId: string,
  userId: string,
): Promise<Response> {
  const monitor = await getMonitorForUser(env, monitorId, userId);

  if (!monitor) {
    return json({ error: "monitor not found" }, 404);
  }

  const measurement = await syncLatestMeasurement(env, monitorId);

  const [regions, history] = await Promise.all([
    getRegionalResults(env, measurement?.id ?? ""),
    getMeasurementHistory(env, monitorId),
  ]);

  return json({
    monitor,
    measurement,
    regions,
    history,
  });
}

export async function handleApi(
  request: Request,
  env: Env,
): Promise<Response | null> {
  const url = new URL(request.url);

  if (url.pathname === "/api/health") {
    return json({ ok: true, service: "ping.yu" });
  }

  if (url.pathname.startsWith("/api/auth/")) {
    return createAuth(env).handler(request);
  }

  if (
    url.pathname === "/api/monitors" ||
    /^\/api\/monitors\/[^/]+(?:\/recent)?$/.test(url.pathname)
  ) {
    const session = await getSession(request, env);

    if (!session) {
      return json({ error: "authentication required" }, 401);
    }

    const userId = session.user.id;

    if (url.pathname === "/api/monitors") {
      if (request.method === "GET") {
        return json(await listMonitorsForUser(env, userId));
      }

      if (request.method === "POST") {
        return createMonitorFromRequest(request, env, userId);
      }
    }

    const recentMatch = url.pathname.match(
      /^\/api\/monitors\/([^/]+)\/recent$/,
    );

    if (recentMatch && request.method === "GET") {
      return getMonitorDetail(env, recentMatch[1], userId);
    }

    const deleteMatch = url.pathname.match(
      /^\/api\/monitors\/([^/]+)$/,
    );

    if (deleteMatch && request.method === "DELETE") {
      const deleted = await deleteMonitorForUser(
        env,
        deleteMatch[1],
        userId,
      );

      return deleted
        ? new Response(null, { status: 204 })
        : json({ error: "monitor not found" }, 404);
    }
  }

  return null;
}
