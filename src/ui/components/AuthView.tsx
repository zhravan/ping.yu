import { FormEvent, useState } from "react";
import { authClient } from "../auth";

export function AuthView() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    setError("");

    const result =
      mode === "signin"
        ? await authClient.signIn.email({ email, password, rememberMe: true })
        : await authClient.signUp.email({ name: name.trim(), email, password });

    if (result.error) {
      setError(result.error.message || "Authentication failed.");
    }

    setBusy(false);
  };

  return (
    <section className="auth-layout">
      <div className="auth-hero">
        <span className="auth-hero-kicker">global HTTP monitoring</span>
        <h1>Know when the internet gets weird.</h1>
        <p>
          See where your endpoints are slow or failing — across real networks,
          not just from one server.
        </p>
        <div className="auth-signals">
          <span>DNS</span>
          <span>TCP</span>
          <span>TLS</span>
          <span>TTFB</span>
          <span>regional latency</span>
        </div>
      </div>

      <div className="auth-card">
        <div className="auth-tabs">
          <button
            className={mode === "signin" ? "active" : ""}
            onClick={() => { setMode("signin"); setError(""); }}
            type="button"
          >
            Sign in
          </button>
          <button
            className={mode === "signup" ? "active" : ""}
            onClick={() => { setMode("signup"); setError(""); }}
            type="button"
          >
            Sign up
          </button>
        </div>

        <div className="auth-copy">
          <h2>{mode === "signin" ? "Welcome back." : "Create your space."}</h2>
          <p>
            {mode === "signin"
              ? "Your monitors are waiting."
              : "Your monitors stay private to your account."}
          </p>
        </div>

        <form className="auth-form" onSubmit={submit}>
          {mode === "signup" && (
            <label>
              Name
              <input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required />
            </label>
          )}

          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              minLength={8}
              required
            />
          </label>

          {error && <p className="auth-error">{error}</p>}

          <button className="auth-submit" disabled={busy} type="submit">
            {busy ? "working..." : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>
      </div>
    </section>
  );
}
