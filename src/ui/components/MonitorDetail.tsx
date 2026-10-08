import { LatencyHistory } from "./LatencyHistory";
import { RegionCard } from "./RegionCard";
import { RegionTable } from "./RegionTable";

type Region = {
  region: string | null; country: string | null; city: string | null; network: string | null;
  status: string; dns_ms: number | null; tcp_ms: number | null; tls_ms: number | null;
  first_byte_ms: number | null; total_ms: number | null; anomaly: number;
};

type Detail = {
  monitor: { id: string; url: string; name: string | null };
  measurement: { status: string; created_at: string } | null;
  regions: Region[];
  history: { created_at: string; avg_ms: number | null }[];
};

type Props = { detail: Detail; onRemove: (id: string) => void };

const ms = (value: number | null) => value == null ? "—" : Math.round(value) + "ms";
const host = (value: string) => { try { return new URL(value).hostname; } catch { return value; } };
const percentile = (values: number[], p: number) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (sorted.length - 1) * p;
  const lower = Math.floor(index), upper = Math.ceil(index);
  return lower === upper ? sorted[lower] : sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
};

export function MonitorDetail({ detail, onRemove }: Props) {
  const values = detail.regions
    .map((region) => region.total_ms)
    .filter((value): value is number => typeof value === "number");
  const average = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
  const p95 = percentile(values, 0.95);
  const spread = values.length ? Math.max(...values) - Math.min(...values) : null;
  const historyPoints = detail.history.slice(0, 28).reverse();

  return (
    <article className="detail">
      <div className="detail-head">
        <div className="detail-title">
          <p className="eyebrow">{detail.monitor.url}</p>
          <h2>{detail.monitor.name || host(detail.monitor.url)}</h2>
          <p className="detail-note">
            {detail.measurement?.status === "finished" ? detail.regions.length + " regional results" : "measuring globally…"}
          </p>
        </div>
        <button className="delete" onClick={() => onRemove(detail.monitor.id)}>Remove</button>
      </div>

      <div className="summary">
        <div className="metric-card primary"><span>Global average</span><strong>{ms(average)}</strong></div>
        <div className="metric-card"><span>P95</span><strong>{ms(p95)}</strong></div>
        <div className="metric-card"><span>Spread</span><strong>{ms(spread)}</strong></div>
        <div className="metric-card"><span>Regions</span><strong>{detail.regions.length}</strong></div>
      </div>

      <LatencyHistory points={historyPoints} />

      <div className="section-title">
        <span>Regional measurements</span>
        <span>{detail.regions.length} measured</span>
      </div>

      <RegionTable regions={detail.regions} />

      <div className="region-mobile">
        {detail.regions.map((region, index) => (
          <RegionCard key={(region.region || "unknown") + "-" + index} region={region} />
        ))}
      </div>
    </article>
  );
}
