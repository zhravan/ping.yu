import { authClient } from "../auth";

type Props = {
  user?: {
    name: string;
    email: string;
  };
};

export function Header({ user }: Props) {
  const signOut = async () => {
    await authClient.signOut();
    window.location.reload();
  };

  return (
    <header className="nav">
      <a className="brand" href="/">ping.yu</a>
      <span className="nav-copy">global HTTP observability</span>
      <span className="nav-spacer" />
      {user ? (
        <div className="account-control">
          <span className="account-email">{user.email}</span>
          <button className="sign-out" onClick={() => void signOut()} type="button">
            sign out
          </button>
        </div>
      ) : (
        <span className="status-pill"><span className="status-dot live" />live</span>
      )}
    </header>
  );
}
