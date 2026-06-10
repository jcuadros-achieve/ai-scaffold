# Stack rules: Node + Express

> Optional stack module — covers Express 4/5 services on Node 18+. Durable
> conventions and pitfalls only; API details belong to the live docs. Run
> `ai-init` to fill the project-specific sections.

## Error handling

- Exactly **one** error-handling middleware, registered last. Every error path
  converges there — no route formats its own error responses.
- Async handlers must forward rejections to `next` (wrapper helper, or Express
  5's native async support). An unhandled rejection inside a route is a
  process-crash risk, not a 500.
- Map errors to status codes deliberately (known error types → 4xx, everything
  else → 500) and never leak stack traces or internal messages in responses.

## Request validation

- Validate `body`, `params`, and `query` at the edge with a schema, before any
  handler logic. An unvalidated request object never reaches a service.
- Set explicit body-size limits on parsers; the default is an invitation for
  abuse.

## Middleware order (explicit, not accidental)

- The order is part of the architecture — keep it visible in one place:
  security headers → parsers (with limits) → request logging/correlation →
  auth → routes → 404 → error handler. A new middleware lands in a deliberate
  position, not "wherever".
- Configure proxy trust when running behind a load balancer — client IPs,
  protocol detection, and secure cookies are all wrong without it.

## Layering

- Routes stay thin: parse/validate → call a service → map the result. Business
  logic lives in services that are testable without HTTP.
- One service never reaches into another's data store; cross-domain calls go
  through the owning service.

## Event loop & lifecycle

- Never block the event loop in a request path: no synchronous fs/crypto/zlib,
  no parsing of unbounded JSON payloads. CPU-heavy work moves to a worker or a
  queue.
- Shut down gracefully: on SIGTERM stop accepting connections, drain in-flight
  requests, close pools, then exit. Killing mid-request corrupts work and
  poisons retries.
- Align server timeouts (`keepAliveTimeout`, `headersTimeout`) with the load
  balancer's idle timeout — mismatches surface as intermittent 502s that no
  log explains.

## Project specifics (Run ai-init to fill)

- Express version and async-handler convention: TODO.
- Validation library and where schemas live: TODO (e.g. zod, joi).
- Auth middleware and what it attaches to the request: TODO.
- Logger and request-correlation strategy: TODO.
- Data layer (driver/ORM, pool config) and migration story: TODO.
- Deploy/runtime (container, PaaS, serverless) and its timeout model: TODO.
