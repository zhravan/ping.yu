type Region = {
  region: string | null; country: string | null; city: string | null; network: string | null;
  status: string; dns_ms: number | null; tcp_ms: number | null; tls_ms: number | null;
  first_byte_ms: number | null; total_ms: number | null; anomaly: number;
};

type Props = { regions: Region[] };

const ms = (value: number | null) => value == null ? "—" : Math.round(value) + "ms";

export function RegionTable({ regions }: Props) {
  return (
    <div className="region-desktop">
      {regions.map((region, index) => (
        <div className="region-row" key={(region.region || "unknown") + "-" + (region.city || "unknown") + "-" + index}>
          <div className="region-name">
            <strong>{region.region || "Unknown"}</strong>
            <small>{region.city || "—"}, {region.country || "—"}{region.network ? " · " + region.network : ""}</small>
          </div>
          <span className={"region-status " + region.status}>
            <span className={"dot " + region.status} />{region.status}
          </span>
          <span>{ms(region.dns_ms)}</span>
          <span>{ms(region.tcp_ms)}</span>
          <span>{ms(region.tls_ms)}</span>
          <span>{ms(region.first_byte_ms)}</span>
          <span>{ms(region.total_ms)}</span>
          <span className={region.anomaly ? "anomaly" : ""}>{region.anomaly ? "slow" : "—"}</span>
        </div>
      ))}
    </div>
  );
}
