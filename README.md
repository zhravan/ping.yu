# ping.yu

**Global HTTP monitoring with network-level visibility.**

> Know when the internet gets weird.

ping.yu is a small, open-source uptime monitor built for one question:

**Is my service healthy everywhere, or only from where I happen to be?**

## Why ping.yu?

Traditional uptime monitoring tells you that a service is down.

ping.yu is designed to show **where** it is slow or failing:

- HTTP(S) monitoring
- Multiple endpoints
- Global probe measurements
- Regional latency
- DNS, TCP, TLS, TTFB and total timing
- ASN / network visibility
- Regional baselines and anomaly signals
- Desktop + mobile monitoring UI

Probe locations come from the measurement provider. ping.yu does not treat a Cloudflare Worker execution location as a fake "Bengaluru", "Tokyo", or "New York" probe.

## Status

ping.yu is under active development. The current focus is making the core monitoring experience reliable, simple, and easy to extend.

## Stack

- Cloudflare Workers
- Cloudflare D1
- Cloudflare Queues
- React + Vite
- Globalping for distributed measurements
- TypeScript

## Run locally

```bash
npm install
npm run dev
```

Check everything before opening a PR:

```bash
npm run typecheck
npm test
npm run build
```

## Architecture

```text
Browser
   │
   ▼
Cloudflare Worker
   ├── D1
   ├── Queue
   └── Globalping
         │
         ▼
   Regional measurements
```

## Contributing

Contributions are welcome.

Start by reading the code and opening an issue for larger changes. For small fixes, a focused pull request is preferred.

Please keep changes:

- small and reviewable
- tested
- consistent with the existing UI and API
- free of unnecessary dependencies

## License

Apache License 2.0 — see [LICENSE](./LICENSE).

