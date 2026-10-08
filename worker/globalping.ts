const GLOBALPING_API = "https://api.globalping.io/v1";

export const GLOBAL_REGIONS = [
  "Northern Africa",
  "Eastern Africa",
  "Middle Africa",
  "Southern Africa",
  "Western Africa",
  "Caribbean",
  "Central America",
  "South America",
  "Northern America",
  "Central Asia",
  "Eastern Asia",
  "South-eastern Asia",
  "Southern Asia",
  "Western Asia",
  "Eastern Europe",
  "Northern Europe",
  "Southern Europe",
  "Western Europe",
  "Australia and New Zealand",
  "Melanesia",
  "Micronesia",
  "Polynesia",
] as const;

type Probe = {
  continent: string;
  region: string;
  country: string;
  state: string | null;
  city: string;
  asn: number;
  network: string;
  latitude: number;
  longitude: number;
};

type HttpResult = {
  status: string;
  statusCode?: number;
  statusCodeName?: string;
  resolvedAddress?: string | null;
  timings?: {
    total?: number;
    dns?: number | null;
    tcp?: number;
    tls?: number | null;
    firstByte?: number;
    download?: number;
  };
  tls?: {
    authorized?: boolean;
    protocol?: string;
    cipherName?: string;
    expiresAt?: string;
    subject?: { CN?: string };
    issuer?: { CN?: string };
  } | null;
};

export interface GlobalMeasurement {
  id: string;
  type: "http";
  status: "in-progress" | "finished";
  createdAt: string;
  updatedAt: string;
  probesCount: number;
  results: Array<{
    probe: Probe;
    result: HttpResult & { failureSource?: string };
  }>;
}

async function request(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const response = await fetch(GLOBALPING_API + path, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": "ping.yu/0.1",
      "Accept-Encoding": "gzip",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error("Globalping returned " + response.status);
  }

  return response;
}

export async function createGlobalMeasurement(
  targetUrl: string,
): Promise<{ id: string; probesCount: number }> {
  const target = new URL(targetUrl);
  const protocol = target.protocol === "https:" ? "HTTPS" : "HTTP";

  const requestOptions: Record<string, unknown> = {
    method: "GET",
    path: target.pathname || "/",
  };

  if (target.search) {
    requestOptions.query = target.search.slice(1);
  }

  const body = {
    type: "http",
    target: target.hostname,
    timeout: 20,
    inProgressUpdates: true,
    locations: GLOBAL_REGIONS.map((region) => ({
      region,
      limit: 1,
    })),
    measurementOptions: {
      protocol,
      port:
        target.port ? Number(target.port) : protocol === "HTTPS" ? 443 : 80,
      request: requestOptions,
    },
  };

  const response = await request("/measurements", {
    method: "POST",
    body: JSON.stringify(body),
  });

  return response.json<{ id: string; probesCount: number }>();
}

export async function getGlobalMeasurement(
  id: string,
): Promise<GlobalMeasurement> {
  const response = await request(
    "/measurements/" + encodeURIComponent(id),
  );

  return response.json<GlobalMeasurement>();
}
