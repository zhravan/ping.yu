export type CertificateProbe = {
  region: string | null;
  country: string | null;
  tls_authorized: number | null;
  tls_expires_at: string | null;
  tls_subject: string | null;
  tls_issuer: string | null;
  tls_protocol: string | null;
};

export type CertificateHealth = "healthy" | "warning" | "critical" | "unknown";

export function getCertificateHealth(
  probes: CertificateProbe[],
  now = Date.now(),
): CertificateHealth {
  const withCertificate = probes.filter(
    (probe) => probe.tls_expires_at || probe.tls_authorized != null,
  );

  if (!withCertificate.length) return "unknown";
  if (withCertificate.some((probe) => probe.tls_authorized === 0)) return "critical";

  const expiries = withCertificate
    .map((probe) => probe.tls_expires_at ? Date.parse(probe.tls_expires_at) : NaN)
    .filter(Number.isFinite);

  if (!expiries.length) return "unknown";

  const earliestExpiry = Math.min(...expiries);
  const daysRemaining = Math.ceil((earliestExpiry - now) / 86_400_000);

  if (daysRemaining <= 14) return "critical";
  if (daysRemaining <= 30) return "warning";
  return "healthy";
}

export function daysUntilExpiry(expiresAt: string, now = Date.now()): number | null {
  const timestamp = Date.parse(expiresAt);
  if (!Number.isFinite(timestamp)) return null;
  return Math.ceil((timestamp - now) / 86_400_000);
}
