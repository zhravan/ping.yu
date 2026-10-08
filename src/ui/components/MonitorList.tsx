type Monitor = { id: string; url: string; name: string | null; status?: string };

type Props = {
  monitors: Monitor[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

const host = (value: string) => {
  try { return new URL(value).hostname; } catch { return value; }
};

export function MonitorList({ monitors, selectedId, onSelect }: Props) {
  return (
    <aside className="monitor-list">
      <div className="section-label">Monitors</div>
      <div className="monitor-scroll">
        {monitors.map((monitor) => (
          <button
            key={monitor.id}
            className={"monitor-row " + (selectedId === monitor.id ? "selected" : "")}
            onClick={() => onSelect(monitor.id)}
          >
            <span className={"status-dot " + (monitor.status || "pending")} />
            <span className="monitor-copy">
              <strong>{monitor.name || host(monitor.url)}</strong>
              <small>{monitor.url}</small>
            </span>
            <span className="monitor-arrow">›</span>
          </button>
        ))}
      </div>
    </aside>
  );
}
