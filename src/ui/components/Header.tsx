export function Header() {
  return (
    <header className="nav">
      <a className="brand" href="/">ping.yu</a>
      <span className="nav-copy">global HTTP observability</span>
      <span className="nav-spacer" />
      <span className="status-pill"><span className="status-dot live" />live</span>
    </header>
  );
}
