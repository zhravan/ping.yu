# ping.yu

Minimal, edge-native Internet observability.

> Know when the internet gets weird.

ping.yu watches HTTP endpoints and turns edge observations into a simple signal: **up, slow, or weird**.

## What it does

- HTTP health checks
- response latency
- recent probe history
- running latency baselines
- regional edge metadata when available
- anomaly detection primitives
- minimal developer-first dashboard

## Architecture

```
Cloudflare Cron
     ↓
Worker
     ↓
probe target
     ↓
D1
     ↓
baseline + anomaly logic
     ↓
React dashboard

Queue support is wired into the Worker configuration for asynchronous probe execution.
```

The project intentionally does not claim deterministic geographic probes from a normal Worker invocation. A Cloudflare Worker executes on Cloudflare infrastructure, but the invocation location is not a user-selectable probe city. The stored `colo` field is therefore observational metadata, not a guaranteed Bengaluru/Tokyo/etc. probe label.

## Stack

- TypeScript
- Cloudflare Workers
- Cloudflare D1
- Cloudflare Queues
- React
- Vite
- Wrangler

## Development

```bash
npm install
npm run dev
npm run typecheck
npm test
npm run build
```

Local D1 state is managed by Wrangler. Apply the migration with:

```bash
npx wrangler d1 migrations apply ping-yu --local
```

## Deployment

The repository is ready for Wrangler-based deployment.

For the first queue-backed production deployment, the Cloudflare account must have its `workers.dev` subdomain initialized once from the Workers dashboard. Cloudflare's API currently rejects queue-consumer creation until that account-level setup has been completed.

After that one-time account activation:

```bash
npm run deploy
```

The GitHub Actions workflow expects:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

## Project shape

```
src/
  anomaly/
  domain/
  probe/
  ui/

worker/
  index.ts

migrations/
  0001_initial.sql

tests/
```

The repository is being built in small, logically grouped commits rather than one large scaffold.
