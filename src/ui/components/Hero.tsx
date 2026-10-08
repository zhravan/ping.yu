import { FormEvent } from "react";

type Props = {
  url: string;
  adding: boolean;
  onUrlChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
};

export function Hero({ url, adding, onUrlChange, onSubmit }: Props) {
  return (
    <section className="hero">
      <p className="eyebrow">Global monitoring · as many endpoints as you need.</p>
      <h1>Know when the internet gets weird.</h1>
      <form className="monitor-input" onSubmit={onSubmit}>
        <span>+</span>
        <input
          aria-label="Monitor URL"
          inputMode="url"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          value={url}
          onChange={(event) => onUrlChange(event.target.value)}
          placeholder="https://api.example.com/health"
        />
        <button type="submit" disabled={adding}>{adding ? "adding" : "Add"}</button>
      </form>
      <p className="hero-note">Checks run asynchronously across public probes. Public HTTP(S) URLs only.</p>
    </section>
  );
}
