import { daysUntilExpiry, getCertificateHealth, type CertificateProbe } from "../../domain/certificate";
import "./CertificateHealth.css";

type Props = {
  url: string;
  regions: CertificateProbe[];
};

const date = (value: string | null) => {
  if (!value || !Number.isFinite(Date.parse(value))) return "Not reported";
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
};

const label: Record<ReturnType<typeof getCertificateHealth>, string> = {
  healthy: "Valid",
  warning: "Expiring soon",
  critical: "Action required",
  unknown: "No certificate data",
};

export function CertificateHealth({ url, regions }: Props) {
  let isHttps = false;
  try {
    isHttps = new URL(url).protocol === "https:";
  } catch {
    // Invalid URLs are rejected by monitor creation; keep this component defensive.
  }

  if (!isHttps) return null;

  const health = getCertificateHealth(regions);
  const certificateRegions = regions.filter(
    (region) => region.tls_expires_at || region.tls_authorized != null ||
      region.tls_subject || region.tls_issuer || region.tls_protocol,
  );
  const expiryDates = certificateRegions
    .map((region) => region.tls_expires_at)
    .filter((value): value is string => Boolean(value) && Number.isFinite(Date.parse(value!)))
    .sort((a, b) => Date.parse(a) - Date.parse(b));
  const earliestExpiry = expiryDates[0] ?? null;
  const daysRemaining = earliestExpiry ? daysUntilExpiry(earliestExpiry) : null;

  return (
    <section className="certificate-panel" aria-labelledby="certificate-heading">
      <div className="certificate-panel-head">
        <div>
          <p className="certificate-eyebrow">TLS / SSL</p>
          <h3 id="certificate-heading">Certificate health</h3>
          <p className="certificate-subtitle">Based on the latest regional TLS probes</p>
        </div>
        <span className={"certificate-badge " + health}>{label[health]}</span>
      </div>

      {health === "unknown" ? (
        <p className="certificate-empty">
          Certificate details are not available yet. They will appear after a probe reports TLS metadata.
        </p>
      ) : (
        <>
          <div className="certificate-summary">
            <div>
              <span>Earliest expiry</span>
              <strong>{earliestExpiry ? date(earliestExpiry) : "Not reported"}</strong>
            </div>
            <div>
              <span>Time remaining</span>
              <strong className={daysRemaining != null && daysRemaining <= 14 ? "critical-text" : daysRemaining != null && daysRemaining <= 30 ? "warning-text" : ""}>
                {daysRemaining == null ? "—" : daysRemaining < 0 ? `Expired ${Math.abs(daysRemaining)}d ago` : `${daysRemaining} days`}
              </strong>
            </div>
            <div>
              <span>Regions reporting</span>
              <strong>{certificateRegions.length}/{regions.length}</strong>
            </div>
          </div>

          <div className="certificate-table" role="table" aria-label="Regional certificate details">
            <div className="certificate-row certificate-header" role="row">
              <span role="columnheader">Probe region</span>
              <span role="columnheader">Validation</span>
              <span role="columnheader">Expires</span>
              <span role="columnheader">Issuer</span>
            </div>
            {certificateRegions.map((region, index) => {
              const days = region.tls_expires_at ? daysUntilExpiry(region.tls_expires_at) : null;
              const validation = region.tls_authorized === 1
                ? "Trusted"
                : region.tls_authorized === 0
                  ? "Untrusted"
                  : "Unknown";
              return (
                <div className="certificate-row" role="row" key={(region.region || region.country || "probe") + "-" + index}>
                  <span className="certificate-region" role="cell">
                    <strong>{region.region || region.country || "Unknown region"}</strong>
                    <small>{region.tls_protocol || "TLS details unavailable"}</small>
                  </span>
                  <span className={region.tls_authorized === 1 ? "healthy-text" : region.tls_authorized === 0 ? "critical-text" : ""} role="cell">{validation}</span>
                  <span className={days != null && days <= 14 ? "critical-text" : days != null && days <= 30 ? "warning-text" : ""} role="cell">
                    {region.tls_expires_at ? date(region.tls_expires_at) : "—"}
                  </span>
                  <span className="certificate-issuer" role="cell" title={region.tls_issuer || undefined}>{region.tls_issuer || "—"}</span>
                </div>
              );
            })}
          </div>
          <p className="certificate-footnote">
            Expiry and trust reflect the latest probe data; this view does not issue renewal reminders yet.
          </p>
        </>
      )}
    </section>
  );
}
