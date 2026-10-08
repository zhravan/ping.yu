import { FormEvent, useEffect, useState } from "react";

type Monitor = {
  id: string;
  url: string;
  name: string | null;
  interval_seconds: number;
  active: number;
  created_at: string;
};

type Probe = {
  status: "up" | "degraded" | "down";
  latency_ms: number;
  checked_at: string;
};

type Detail = {
  monitor: Monitor;
  baseline: { mean_ms: number; samples: number; updated_at: string } | null;
  results: Probe[];
};

function statusFor(results: Probe[]) {
  const latest = results[0];
  if (!latest) return "new";
  return latest.status;
}

export default function App() {
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [selected, setSelected] = useState<Detail | null>(null);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    const response = await fetch("/api/monitors");
    const data = (await response.json()) as Monitor[];
    setMonitors(data);

    if (data[0]) {
      const detail = await fetch(`/api/monitors/${data[0].id}/recent?limit=40`);
      setSelected((await detail.json()) as Detail);
    } else {
      setSelected(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const addMonitor = async (event: FormEvent) => {
    event.preventDefault();
    if (!url.trim()) return;

    setCreating(true);
    const response = await fetch("/api/monitors", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url: url.trim() }),
    });

    if (response.ok) {
      setUrl("");
      await load();
    }
    setCreating(false);
  };

  const openMonitor = async (monitor: Monitor) => {
    const response = await fetch(`/api/monitors/${monitor.id}/recent?limit=40`);
    setSelected((await response.json()) as Detail);
  };

  const removeMonitor = async (id: string) => {
    await fetch(`/api/monitors/${id}`, { method: "DELETE" });
    await load();
  };

  return (
    <main className="shell">
      <header className="nav">
        <a className="brand" href="/">ping.yu</a>
        <span className="nav-copy">edge observability</span>
        <span className="nav-spacer" />
        <span className="status-pill">
          <span className="status-dot" />
          live
        </span>
      </header>

      <section className="hero">
        <p className="eyebrow">Internet monitoring, stripped down.</p>
        <h1>Know when the internet gets weird.</h1>

        <form className="monitor-input" onSubmit={addMonitor}>
          <span>+</span>
          <input
            aria-label="Monitor URL"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://api.example.com/health"
          />
          <button type="submit" disabled={creating}>
            {creating ? "adding" : "↵"}
          </button>
        </form>
      </section>

      {loading ? (
        <div className="empty">Loading.</div>
      ) : monitors.length === 0 ? (
        <div className="empty">
          <strong>Nothing is watching.</strong>
          <span>Add an endpoint above.</span>
        </div>
      ) : (
        <section className="workspace">
          <div className="monitor-list">
            <div className="section-label">Monitors</div>
            {monitors.map((monitor) => (
              <button
                className="monitor-row"
                key={monitor.id}
                onClick={() => openMonitor(monitor)}
              >
                <span className={`status-dot ${selected?.monitor.id === monitor.id ? "selected" : ""}`} />
                <span className="monitor-name">
                  {monitor.name || new URL(monitor.url).hostname}
                </span>
                <span className="monitor-url">{monitor.url}</span>
                <span>›</span>
              </button>
            ))}
          </div>

          {selected && (
            <article className="detail">
              <div className="detail-head">
                <div>
                  <p className="eyebrow">{selected.monitor.url}</p>
                  <h2>{selected.monitor.name || new URL(selected.monitor.url).hostname}</h2>
                </div>
                <button className="delete" onClick={() => removeMonitor(selected.monitor.id)}>
                  Remove
                </button>
              </div>

              <div className="summary">
                <div>
                  <div className="status-row">
                    <span className={`dot ${statusFor(selected.results)}`} />
                    {selected.results[0]?.status ?? "new"}
                  </div>
                  <div className="metric">
                    {selected.results[0]?.latency_ms ?? "—"}
                    <span>ms</span>
                  </div>
                </div>
                <div className="baseline">
                  <span>baseline</span>
                  <strong>
                    {selected.baseline ? Math.round(selected.baseline.mean_ms) : "—"}ms
                  </strong>
                </div>
              </div>

              <div className="sparkline" aria-hidden="true">
                {selected.results.slice(0, 24).reverse().map((point, index) => (
                  <span
                    key={index}
                    style={{ height: `${Math.min(100, Math.max(10, point.latency_ms / 3))}%` }}
                  />
                ))}
              </div>

              <div className="section-title">
                <span>Recent checks</span>
                <span className="muted">{selected.results.length} samples</span>
              </div>

              <div className="checks">
                {selected.results.slice(0, 8).map((point, index) => (
                  <div className="check" key={index}>
                    <span className={`dot ${point.status}`} />
                    <span>{new Date(point.checked_at).toLocaleTimeString()}</span>
                    <span>{point.latency_ms}ms</span>
                  </div>
                ))}
              </div>
            </article>
          )}
        </section>
      )}

      <footer>ping.yu · minimal by design</footer>
    </main>
  );
}
