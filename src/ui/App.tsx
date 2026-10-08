import { FormEvent, useEffect, useState } from "react";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { MonitorList } from "./components/MonitorList";
import { MonitorDetail } from "./components/MonitorDetail";

type Monitor = { id: string; url: string; name: string | null; status?: string };
type Detail = {
  monitor: Monitor;
  measurement: { status: string; created_at: string } | null;
  regions: {
    region: string | null; country: string | null; city: string | null; network: string | null;
    status: string; dns_ms: number | null; tcp_ms: number | null; tls_ms: number | null;
    first_byte_ms: number | null; total_ms: number | null; anomaly: number;
  }[];
  history: { created_at: string; avg_ms: number | null }[];
};

async function fetchMonitors(): Promise<Monitor[]> {
  const response = await fetch("/api/monitors", { cache: "no-store" });
  if (!response.ok) throw new Error("Could not load monitors.");
  return await response.json() as Monitor[];
}

async function fetchDetail(id: string): Promise<Detail | null> {
  const response = await fetch("/api/monitors/" + encodeURIComponent(id) + "/recent", { cache: "no-store" });
  if (!response.ok) return null;
  return await response.json() as Detail;
}

export default function App() {
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [url, setUrl] = useState("");
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadMonitors = async () => {
    try {
      const data = await fetchMonitors();
      setMonitors(data);
      setSelectedId((current) => current && data.some((monitor) => monitor.id === current) ? current : data[0]?.id ?? null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadMonitors(); }, []);

  useEffect(() => {
    if (!selectedId) { setDetail(null); return; }
    let cancelled = false;

    const refresh = async () => {
      const next = await fetchDetail(selectedId);
      if (!cancelled && next) setDetail(next);
    };

    void refresh();
    const interval = window.setInterval(() => void refresh(), 3000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [selectedId]);

  const addMonitor = async (event: FormEvent) => {
    event.preventDefault();
    const target = url.trim();
    if (!target || adding) return;

    setAdding(true);
    try {
      const response = await fetch("/api/monitors", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: target }),
      });
      if (!response.ok) throw new Error("Could not add monitor.");
      const created = await response.json() as { monitor: Monitor };
      setUrl("");
      setSelectedId(created.monitor.id);
      await loadMonitors();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Could not add monitor.");
    } finally {
      setAdding(false);
    }
  };

  const removeMonitor = async (id: string) => {
    await fetch("/api/monitors/" + encodeURIComponent(id), { method: "DELETE" });
    await loadMonitors();
  };

  return (
    <main className="shell">
      <Header />
      <Hero url={url} adding={adding} onUrlChange={setUrl} onSubmit={addMonitor} />

      {loading ? (
        <div className="empty"><strong>Loading.</strong></div>
      ) : !monitors.length ? (
        <div className="empty">
          <strong>Nothing is watching.</strong>
          <span>Add an endpoint above.</span>
        </div>
      ) : (
        <section className="workspace">
          <MonitorList monitors={monitors} selectedId={selectedId} onSelect={setSelectedId} />
          {detail && <MonitorDetail detail={detail} onRemove={removeMonitor} />}
        </section>
      )}

      <footer className="site-footer">
        <span>ping.yu · minimal by design</span>
        <span className="footer-links">
          <a href="https://github.com/zhravan/ping.yu" target="_blank" rel="noreferrer">GitHub</a>
          <span>·</span>
          <a href="https://www.apache.org/licenses/LICENSE-2.0" target="_blank" rel="noreferrer">Apache 2.0</a>
        </span>
      </footer>
    </main>
  );
}
