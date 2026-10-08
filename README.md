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
- Per-user monitoring spaces

Probe locations come from the measurement provider. ping.yu does not treat a Cloudflare Worker execution location as a fake "Bengaluru", "Tokyo", or "New York" probe.

## Authentication

ping.yu uses Better Auth with Cloudflare D1 for simple email/password accounts.

Each monitor belongs to the authenticated user who created it. Monitor list, detail, create, and delete operations are scoped to the current session.

### Local setup

Create `.dev.vars` from the example:

NaN
NaN
NaN

Generate a high-entropy secret and put it in `BETTER_AUTH_SECRET`:

NaN
NaN
NaN

Then run:

NaN
NaN
NaN
NaN

### Production

Set the Better Auth secret as a Cloudflare secret:

NaN
NaN
NaN

Set `BETTER_AUTH_URL` to the public URL of the Worker deployment.

## Status

ping.yu is under active development. The current focus is making the core monitoring experience reliable, simple, and easy to extend.

## Stack

- Cloudflare Workers
- Cloudflare D1
- Cloudflare Queues
- React + Vite
- Better Auth
- Globalping
- TypeScript

## Run locally

NaN
NaN
NaN
NaN

Check everything before opening a PR:

NaN
NaN
NaN
NaN
NaN

## Deploy

### One click

Use the **Deploy to Cloudflare** button above.

The project is configured for Cloudflare resource provisioning, including its D1 database and Queue. Database migrations are applied as part of the deploy command.

After provisioning, configure `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` before using account features.

### CLI

NaN
NaN
NaN
NaN
NaN

## Architecture

NaN
NaN
NaN
NaN
NaN
NaN
NaN
NaN
NaN
NaN
NaN
NaN
NaN
NaN
NaN
NaN
NaN
NaN

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