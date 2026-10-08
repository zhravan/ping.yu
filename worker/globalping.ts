const GLOBALPING_API = "https://api.globalping.io/v1";

export const GLOBAL_REGIONS = [
  { key: "IN", label: "India", city: "Bengaluru" },
  { key: "SEAS", label: "Southeast Asia", city: "Singapore" },
  { key: "NEAS", label: "Northeast Asia", city: "Tokyo" },
  { key: "WEU", label: "Western Europe", city: "London" },
  { key: "EEU", label: "Eastern Europe", city: "Warsaw" },
  { key: "ENAM", label: "Eastern North America", city: "New York" },
  { key: "WNAM", label: "Western North America", city: "San Francisco" },
  { key: "NSAM", label: "Northern South America", city: "Bogota" },
  { key: "SSAM", label: "Southern South America", city: "Sao Paulo" },
  { key: "ME", label: "Middle East", city: "Dubai" },
  { key: "NAF", label: "Northern Africa", city: "Cairo" },
  { key: "SAF", label: "Southern Africa", city: "Johannesburg" },
  { key: "OC", label: "Oceania", city: "Sydney" },
] as const;

type ProviderResult = {
  probe?: {
    continent?: string;
    region?: string;
    country?: string;
    city?: string;
    asn?: number;
    network?: string;
  };
  result?: {
    status?: string;
    statusCode?: number;
    resolvedAddress?: string;
    timings?: {
      total?: number;
      dns?: number;
      tcp?: number;
      tls?: number;
      firstByte?: number;
      download?: number;
    };
  };
};

export type GlobalMeasurement = {
  id: string;
  status: "in-progress" | "finished" | "failed";
  results: ProviderResult[];
};

async function request(path: string, init?: RequestInit) {
  const response = await fetch(GLOBALPING_API + path, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": "ping.yu/0.1",
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Globalping returned ${response.status}`);
  }

  return response;
}

export async function createGlobalMeasurement(target: string) {
  const response = await request("/measurements", {
    method: "POST",
    body: JSON.stringify({
      type: "http",
      target,
      inProgressUpdates: true,
      locations: GLOBAL_REGIONS.map(({ city }) => ({ city, limit: 1 })),
      measurementOptions: {
        request: { method: "GET" },
      },
    }),
  });

  const data = await response.json<{ id: string; status: GlobalMeasurement["status"] }>();
  return data;
}

export async function getGlobalMeasurement(id: string): Promise<GlobalMeasurement> {
  const response = await request(`/measurements/${encodeURIComponent(id)}`);
  return response.json<GlobalMeasurement>();
}
