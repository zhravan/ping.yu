import { FormEvent, useEffect, useMemo, useState } from "react";

type Monitor = { id: string; url: string; name: string | null; status?: string };
type Region = {
  region: string | null; country: string | null; city: string | null; network: string | null;
  status: string; dns_ms: number | null; tcp_ms: number | null; tls_ms: number | null;
  first_byte_ms: number | null; total_ms: number | null; anomaly: number;
};
type Detail = {
  monitor: Monitor;
  measurement: { status: string; created_at: string } | null;
  regions: Region[];
  history: { created_at: string; avg_ms: number | null }[];
};

const ms = (value: number | null) => value == null ? "—" : Math.round(value) + "ms";
const host = (value: string) => { try { return new URL(value).hostname; } catch { return value; } };
const percentile = (values: number[], p: number) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (sorted.length - 1) * p, lower = Math.floor(index), upper = Math.ceil(index);
  return lower === upper ? sorted[lower] : sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
};

function RegionCard({ region }: { region: Region }) {
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

export default function App() {
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [url, setUrl] = useState("");
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadMonitors = async () => {
    const response = await fetch("/api/monitors", { cache: "no-store" });
    const data = await response.json() as Monitor[];
    setMonitors(data);
    if (!selectedId && data[0]) setSelectedId(data[0].id);
    if (selectedId && !data.some((monitor) => monitor.id === selectedId)) setSelectedId(data[0]?.id ?? null);
    setLoading(false);
  };

  const loadDetail = async (id: string) => {
    const response = await fetch("/api/monitors/" + encodeURIComponent(id) + "/recent", { cache: "no-store" });
    if (response.ok) setDetail(await response.json() as Detail);
  };

  useEffect(() => { void loadMonitors(); }, []);
  useEffect(() => {
    if (!selectedId) { setDetail(null); return; }
    void loadDetail(selectedId);
    const interval = window.setInterval(() => void loadDetail(selectedId), 3000);
    return () => window.clearInterval(interval);
  }, [selectedId]);

  const values = useMemo(
    () => detail?.regions.map((region) => region.total_ms).filter((value): value is number => typeof value === "number") ?? [],
    [detail]
  );
  const average = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
  const p95 = percentile(values, 0.95);
  const spread = values.length ? Math.max(...values) - Math.min(...values) : null;

  const addMonitor = async (event: FormEvent) => {
    event.preventDefault();
    const target = url.trim();
    if (!target || adding) return;
    setAdding(true);
    try {
      const response = await fetch("/api/monitors", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: target }),
      });
      if (!response.ok) throw new Error("Could not add monitor.");
      const created = await response.json() as { monitor: Monitor };
      setUrl(""); setSelectedId(created.monitor.id); await loadMonitors();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Could not add monitor.");
    } finally { setAdding(false); }
  };

  const removeMonitor = async (id: string) => {
    await fetch("/api/monitors/" + encodeURIComponent(id), { method: "DELETE" });
    await loadMonitors();
  };

  return (
    <main className="shell">
      <header className="nav">
        <a className="brand" href="/">ping.yu</a>
        <span className="nav-copy">global HTTP observability</span>
        <span className="nav-spacer" />
        <span className="status-pill"><span className="status-dot live" />live</span>
      </header>

      <section className="hero">
        <p className="eyebrow">Global monitoring · as many endpoints as you need.</p>
        <h1>Know when the internet gets weird.</h1>
        <form className="monitor-input" onSubmit={addMonitor}>
          <span>+</span>
          <input aria-label="Monitor URL" inputMode="url" autoCapitalize="none" autoCorrect="off" spellCheck={false}
            value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://api.example.com/health" />
          <button type="submit" disabled={adding}>{adding ? "adding" : "Add"}</button>
        </form>
        <p className="hero-note">Checks run asynchronously across public probes. Public HTTP(S) URLs only.</p>
      </section>

      {loading ? <div className="empty"><strong>Loading.</strong></div> : !monitors.length ? (
        <div className="empty"><strong>Nothing is watching.</strong><span>Add an endpoint above.</span></div>
      ) : (
        <section className="workspace">
          <aside className="monitor-list">
            <div className="section-label">Monitors</div>
            <div className="monitor-scroll">
              {monitors.map((monitor) => (
                <button key={monitor.id} className={"monitor-row " + (selectedId === monitor.id ? "selected" : "")}
                  onClick={() => setSelectedId(monitor.id)}>
                  <span className={"status-dot " + (monitor.status || "pending")} />
                  <span className="monitor-copy"><strong>{monitor.name || host(monitor.url)}</strong><small>{monitor.url}</small></span>
                  <span className="monitor-arrow">›</span>
                </button>
              ))}
            </div>
          </aside>

          {detail && <article className="detail">
            <div className="detail-head">
              <div className="detail-title">
                <p className="eyebrow">{detail.monitor.url}</p>
                <h2>{detail.monitor.name || host(detail.monitor.url)}</h2>
                <p className="detail-note">{detail.measurement?.status === "finished" ? detail.regions.length + " regional results" : "measuring globally…"}</p>
              </div>
              <button className="delete" onClick={() => void removeMonitor(detail.monitor.id)}>Remove</button>
            </div>

            <div className="summary">
              <div className="metric-card primary"><span>Global average</span><strong>{ms(average)}</strong></div>
              <div className="metric-card"><span>P95</span><strong>{ms(p95)}</strong></div>
              <div className="metric-card"><span>Spread</span><strong>{ms(spread)}</strong></div>
              <div className="metric-card"><span>Regions</span><strong>{detail.regions.length}</strong></div>
            </div>

            <div className="history">
              {detail.history.slice(0, 28).reverse().map((point, index) => (
                <span key={index} style={{ height: Math.min(100, Math.max(8, (point.avg_ms || 1) / 3)) + "%" }} />
              ))}
            </div>

            <div className="section-title"><span>Regional measurements</span><span>{detail.regions.length} measured</span></div>

            <div className="region-desktop">
              {detail.regions.map((region, index) => (
                <div className="region-row" key={(region.region || "unknown") + "-" + (region.city || "unknown") + "-" + index}>
                  <div className="region-name"><strong>{region.region || "Unknown"}</strong><small>{region.city || "—"}, {region.country || "—"}{region.network ? " · " + region.network : ""}</small></div>
                  <span className={"region-status " + region.status}><span className={"dot " + region.status} />{region.status}</span>
                  <span>{ms(region.dns_ms)}</span><span>{ms(region.tcp_ms)}</span><span>{ms(region.tls_ms)}</span>
                  <span>{ms(region.first_byte_ms)}</span><span>{ms(region.total_ms)}</span><span className={region.anomaly ? "anomaly" : ""}>{region.anomaly ? "slow" : "—"}</span>
                </div>
              ))}
            </div>

            <div className="region-mobile">
              {detail.regions.map((region, index) => <RegionCard key={(region.region || "unknown") + "-" + index} region={region} />)}
            </div>
          </article>}
        </section>
      )}

      <footer>ping.yu · minimal by design</footer>
    </main>
  );
}
