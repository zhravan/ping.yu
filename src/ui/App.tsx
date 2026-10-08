import { useEffect, useState } from "react";

type Health = { ok: boolean; service: string };

const regions = [
  ["Bengaluru", "52ms"],
  ["Singapore", "43ms"],
  ["Tokyo", "71ms"],
  ["Frankfurt", "171ms"],
  ["Virginia", "218ms"],
];

export default function App() {
  const [health, setHealth] = useState<Health | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json() as Promise<Health>)
      .then(setHealth)
      .catch(() => setHealth(null));
  }, []);

  return (
    <main className="shell">
      <header className="nav">
        <a className="brand" href="/">ping.yu</a>
        <nav>
          <a href="#monitors">Monitors</a>
          <a href="#incidents">Incidents</a>
          <a href="#settings">Settings</a>
        </nav>
        <button className="add">+ Add monitor</button>
      </header>

      <section className="hero" id="monitors">
        <p className="eyebrow">Global HTTP monitoring</p>
        <h1>Know when the internet gets weird.</h1>
        <div className="monitor-input">
          <span>+</span>
          <input aria-label="Monitor URL" placeholder="https://api.example.com/health" />
          <kbd>↵</kbd>
        </div>
      </section>

      <section className="status-card">
        <div>
          <div className="status-row"><span className="dot" /> Operational</div>
          <div className="metric">43<span>ms</span></div>
          <p>Global response time</p>
        </div>
        <div className="pulse" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
      </section>

      <section className="regions" id="incidents">
        <div className="section-title">
          <span>Regional health</span>
          <span className="muted">{health?.ok ? "Edge online" : "Connecting"}</span>
        </div>
        <div className="region-list">
          {regions.map(([name, latency]) => (
            <div className="region" key={name}>
              <span>{name}</span>
              <span>{latency}</span>
            </div>
          ))}
        </div>
      </section>

      <footer id="settings">ping.yu · edge observability</footer>
    </main>
  );
}
