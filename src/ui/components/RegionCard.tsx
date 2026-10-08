type Region = {
  region: string | null; country: string | null; city: string | null; network: string | null;
  status: string; dns_ms: number | null; tcp_ms: number | null; tls_ms: number | null;
  first_byte_ms: number | null; total_ms: number | null; anomaly: number;
};

const ms = (value: number | null) => value == null ? "—" : Math.round(value) + "ms";

export function RegionCard({ region }: { region: Region }) {
  return (
    <div className="region-card">
      <div className="region-card-head">
        <div className="region-name">
          <strong>{region.region || "Unknown"}</strong>
          <small>{region.city || "—"}, {region.country || "—"}</small>
        </div>
        <span className={"region-status " + region.status}>
          <span className={"dot " + region.status} />{region.status}
        </span>
      </div>
      <div className="region-total">
        <span>Total</span>
        <strong>{ms(region.total_ms)}</strong>
      </div>
      <div className="timing-grid">
        <span><small>DNS</small><b>{ms(region.dns_ms)}</b></span>
        <span><small>TCP</small><b>{ms(region.tcp_ms)}</b></span>
        <span><small>TLS</small><b>{ms(region.tls_ms)}</b></span>
        <span><small>TTFB</small><b>{ms(region.first_byte_ms)}</b></span>
      </div>
      <div className="region-foot">
        <span>{region.network || "network unavailable"}</span>
        {region.anomaly ? <em>slow</em> : <span>normal</span>}
      </div>
    </div>
  );
}
