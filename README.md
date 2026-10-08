# ping.yu

Global uptime monitoring with network intelligence.

> Know when the internet gets weird.

ping.yu is aiming to be **Uptime Kuma +++++** without becoming a giant dashboard.

## What makes it different

Uptime Kuma asks:

> Is this service up?

ping.yu asks:

> Is this service up **for everyone**, and **where is it getting weird?**

### Kuma layer

- HTTP(S) uptime and latency
- multiple monitors / domains
- asynchronous checks
- retries and intervals
- keyword / JSON assertions
- TCP / DNS / ping-style checks
- certificates
- incidents and notifications
- public status pages

### Plus layer

- global probe measurements
- regional uptime and latency
- p50 / p95 / p99
- DNS / TCP / TLS / TTFB / total timing
- ASN and network visibility
- regional baselines
- anomaly detection
- incident grouping
- world map

### Plus-plus layer

- compare networks, not just countries
- detect India-only / Europe-only / ISP-specific failures
- distinguish origin problems from network-routing problems
- correlate regional failures into one incident
- show historical regional baselines
- turn an uptime alert into a diagnosis

Global locations are based on actual measurement-provider probe data. ping.yu does not pretend a normal Cloudflare Worker invocation is a deterministic Bengaluru/Tokyo/New York probe.

## Development

```bash
npm install
npm run dev
npm run typecheck
npm test
npm run build
```

## Deployment

Cloudflare Worker + D1 + Queues.

The GitHub Actions deployment expects:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

## License

Apache License 2.0. See [LICENSE](./LICENSE).
