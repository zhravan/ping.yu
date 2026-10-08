type Point = { created_at: string; avg_ms: number | null };

type Props = { points: Point[] };

const ms = (value: number | null) => value == null ? "—" : Math.round(value) + "ms";
const formatTime = (value: string) => new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export function LatencyHistory({ points }: Props) {
  const max = Math.max(...points.map((point) => point.avg_ms ?? 0), 0);
  const scale = max > 0 ? Math.ceil(max / 100) * 100 : 100;

  return (
    <div className="history-block">
      <div className="history-head">
        <div>
          <span className="history-label">Latency over time</span>
          <small>Average across regional probes</small>
        </div>
        <span className="history-range">{points.length} measurements</span>
      </div>
      <div className="history-chart">
        <div className="history-yaxis" aria-hidden="true">
          <span>{ms(scale)}</span>
          <span>{ms(scale / 2)}</span>
          <span>0ms</span>
        </div>
        <div className="history-plot">
          <div className="history-grid"><i /><i /><i /></div>
          <div className="history-bars">
            {points.map((point, index) => {
              const value = point.avg_ms ?? 0;
              const height = value ? Math.max(8, Math.min(100, (value / scale) * 100)) : 3;
              return (
                <span
                  key={index}
                  className="history-bar"
                  style={{ height: height + "%" }}
                  title={formatTime(point.created_at) + " · " + ms(point.avg_ms)}
                  aria-label={formatTime(point.created_at) + ", average latency " + ms(point.avg_ms)}
                />
              );
            })}
          </div>
          <div className="history-xaxis">
            {points.length > 0 && <span>{formatTime(points[0].created_at)}</span>}
            {points.length > 2 && <span>{formatTime(points[Math.floor(points.length / 2)].created_at)}</span>}
            {points.length > 1 && <span>{formatTime(points[points.length - 1].created_at)}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
