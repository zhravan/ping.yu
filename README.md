# ping.yu

**Global HTTP monitoring with network-level visibility.**

> Know when the internet gets weird.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https%3A%2F%2Fgithub.com%2Fzhravan%2Fping.yu)

Deploy your own instance to Cloudflare in a few clicks.

## Why ping.yu?

Traditional uptime monitoring tells you that a service is down.

ping.yu is designed to show **where** it is slow or failing:

- HTTP(S) monitoring
- Multiple endpoints per account
- Global probe measurements
- Regional latency
- DNS, TCP, TLS, TTFB and total timing
- ASN / network visibility
- Regional baselines and anomaly signals
- Private, per-user monitoring spaces
- Free tier: 2 monitors per account, checked every 30 minutes
- Responsive monitoring UI

Probe locations come from the measurement provider. ping.yu does not treat a Cloudflare Worker execution location as a real probe location.

## Stack

- Cloudflare Workers
- Cloudflare D1
- Cloudflare Queues
- React + Vite
- Globalping
- Better Auth
- TypeScript

## Run locally

```bash
npm install
cp .dev.vars.example .dev.vars
npm run dev
```

For local authentication, set `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` in `.dev.vars`.

Before opening a PR:

```bash
npm run typecheck
npm test
npm run build
```

## Deploy

### One click

Use the **Deploy to Cloudflare** button above.

### CLI

```bash
npm install
npx wrangler login
npm run deploy
```

For production authentication, configure `BETTER_AUTH_SECRET` as a Cloudflare Worker secret and set `BETTER_AUTH_URL` to the deployed URL.

## Architecture

```text
Browser
   │
   ▼
Cloudflare Worker
   ├── Better Auth
   ├── D1
   └── Queue
         │
         ▼
   Globalping
         │
         ▼
   Regional measurements
```

## Status

ping.yu is under active development.

The current focus is building a reliable monitoring core that can evolve into broader observability, including private-service monitoring and dedicated monitoring agents.

## Contributing

Contributions are welcome.

For larger changes, open an issue first. For small fixes, a focused pull request is preferred.

Keep changes small, tested, reviewable, and consistent with the existing architecture.

## License

Apache License 2.0 — see [LICENSE](./LICENSE).
