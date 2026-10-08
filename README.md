# ping.yu

**Global HTTP monitoring with network-level visibility.**

> Know when the internet gets weird.

ping.yu is a lightweight global HTTP monitoring service built on Cloudflare Workers. It tells you not only whether an endpoint is failing, but **where** latency or failures are happening.

## Features

- HTTP(S) endpoint monitoring
- Multiple monitored endpoints per account
- Global probe measurements through Globalping
- Regional latency visibility
- DNS, TCP, TLS, TTFB, download, and total timing
- ASN and network information
- Regional latency baselines
- Anomaly detection
- Responsive desktop and mobile UI
- Private, per-user monitoring spaces

## How it works

~~~text
Browser
   |
   v
Cloudflare Worker
   |
   +-- Better Auth
   |      |
   |      +-- D1 users / sessions / accounts
   |
   +-- D1
   |      |
   |      +-- User-owned monitors
   |      +-- Measurements
   |      +-- Regional results
   |
   +-- Cloudflare Queue
   |      |
   |      v
   |   Measurement worker
   |      |
   |      v
   |   Globalping
   |      |
   |      v
   |   Global probes
   |
   +-- React + Vite UI
~~~

Probe locations come from the measurement provider. ping.yu does not use the Cloudflare Worker execution location as a substitute for a real probe location.

## Authentication

ping.yu uses [Better Auth](https://www.better-auth.com/) with Cloudflare D1.

Users can:

- Create an account with email and password
- Sign in and sign out
- Create multiple monitors
- Access only their own monitors
- Delete their own monitors

Monitor API operations are scoped to the authenticated user's session.

### Local development

Install dependencies:

~~~bash
npm install
~~~

Create a local environment file:

~~~bash
cp .dev.vars.example .dev.vars
~~~

Generate a random secret:

~~~bash
openssl rand -base64 32
~~~

Put the generated value in `BETTER_AUTH_SECRET` and set:

~~~env
BETTER_AUTH_SECRET=your-generated-secret
BETTER_AUTH_URL=http://localhost:5173
~~~

Then start the development server:

~~~bash
npm run dev
~~~

### Production configuration

Configure the Better Auth secret as a Cloudflare Worker secret:

~~~bash
npx wrangler secret put BETTER_AUTH_SECRET
~~~

Set `BETTER_AUTH_URL` to the public URL of your deployed Worker.

Do not commit `.dev.vars` or production secrets to Git.

## Development

Run the application locally:

~~~bash
npm install
npm run dev
~~~

Before opening a pull request, run:

~~~bash
npm run typecheck
npm test
npm run build
~~~

## Deployment

### Deploy to Cloudflare

The project is configured for Cloudflare Workers, D1, Queues, and static assets.

For an existing Cloudflare account:

~~~bash
npm install
npx wrangler login
npm run deploy
~~~

The deploy script:

1. Builds the React application.
2. Deploys the Worker.
3. Applies the D1 migrations remotely.

After deployment, configure:

- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`

### One-click deployment

The Deploy to Cloudflare button above can be used to create your own deployment from this repository.

## Database

The application uses Cloudflare D1.

The main data model is:

~~~text
user
  |
  +-- session
  |
  +-- account
  |
  +-- monitors
        |
        +-- global_measurements
        |
        +-- regional_results
~~~

Monitor ownership is represented by `monitors.user_id`.

The authentication migration creates the Better Auth tables and adds the monitor ownership column.

## Project structure

~~~text
.
├── src/
│   └── ui/
│       ├── components/
│       │   ├── AuthView.tsx
│       │   ├── Header.tsx
│       │   ├── MonitorDetail.tsx
│       │   ├── MonitorList.tsx
│       │   └── RegionTable.tsx
│       ├── App.tsx
│       ├── auth.ts
│       └── styles.css
├── worker/
│   ├── api.ts
│   ├── auth.ts
│   ├── db.ts
│   ├── globalping.ts
│   ├── index.ts
│   ├── measurements.ts
│   └── types.ts
├── migrations/
├── tests/
├── wrangler.jsonc
└── package.json
~~~

## Current status

ping.yu is under active development.

The current focus is building a reliable monitoring core that can evolve from public global probes into a broader observability platform, including private-service monitoring and dedicated monitoring agents.

## Contributing

Contributions are welcome.

For larger changes, open an issue first. For small fixes, a focused pull request is preferred.

Please keep changes:

- Small and reviewable
- Tested
- Consistent with the existing architecture and UI
- Free of unnecessary dependencies

## License

Apache License 2.0. See [LICENSE](./LICENSE).