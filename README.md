# ping.yu

**Global HTTP monitoring with network-level visibility.**

> Know when the internet gets weird.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https%3A%2F%2Fgithub.com%2Fzhravan%2Fping.yu)

Deploy your own instance to Cloudflare in a few clicks. Cloudflare will clone the project into your GitHub account, provision the required Workers resources, and configure deployment for you.

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
- Globalping
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

## Deploy

### One click

Use the **Deploy to Cloudflare** button above.

The project is configured for Cloudflare resource provisioning, including its D1 database and Queue. Database migrations are applied as part of the deploy command.

### CLI

```bash
npm install
npx wrangler login
npm run deploy
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

For larger changes, open an issue first. For small fixes, a focused pull request is preferred.

Please keep changes:

- small and reviewable
- tested
- consistent with the existing UI and API
- free of unnecessary dependencies

## License

Apache License 2.0 — see [LICENSE](./LICENSE).
