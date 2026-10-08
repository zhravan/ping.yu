# ping.yu

Minimal, edge-native Internet observability.

> Know when the Internet gets weird.

## Status

Early development.

## Direction

ping.yu measures HTTP endpoint health and latency from the edge, then turns regional observations into simple signals:

- availability
- latency
- regional degradation
- anomalies

The product intentionally keeps the UI minimal and developer-focused.

## Stack

- TypeScript
- Cloudflare Workers
- Cloudflare Queues
- Cloudflare Durable Objects
- Cloudflare D1
- Cloudflare R2
- React + Vite

## Development

The repository is being built in small, logically grouped commits. Each commit should leave the project in a coherent state.
