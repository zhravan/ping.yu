import type { ProbeResult } from "../domain/monitor";

export async function probeHttp(
  monitorId: string,
  url: string,
  now = () => performance.now(),
): Promise<ProbeResult> {
  const started = now();

  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
    });

    return {
      monitorId,
      url,
      status: response.ok ? "up" : "degraded",
      httpStatus: response.status,
      latencyMs: Math.round(now() - started),
      checkedAt: new Date().toISOString(),
    };
  } catch {
    return {
      monitorId,
      url,
      status: "down",
      httpStatus: null,
      latencyMs: Math.round(now() - started),
      checkedAt: new Date().toISOString(),
    };
  }
}
