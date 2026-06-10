# Observability rules

> Generic defaults. Run `ai-init` to align with the project's logging, metrics,
> and tracing stack.

If it breaks in production and you can't see why, the code is not done. Build for
diagnosis.

## Logging

- **Structured logs** (key/value or JSON), not string concatenation. Logs are
  queried, not just read.
- Every log line carries correlation context (request/trace id) so a flow can be
  reconstructed.
- Log at the right level: `error` for actionable failures, `warn` for degraded
  states, `info` for milestones, `debug` for detail. Don't log noise at `info`.
- **Never log secrets or PII** — tokens, passwords, full card/SSN, raw request
  bodies with personal data. Redact at the boundary.

## Metrics & tracing

- Emit metrics for the things you'd page on: error rate, latency, throughput,
  saturation of critical resources.
- Trace requests across service boundaries; propagate the trace context.

## Errors

- Report unexpected errors to the error-tracking tool with enough context to
  reproduce — not just a message.
- An error swallowed without a log is invisible. Log it or propagate it
  (see [[code-style]]).

> Run ai-init to record the actual logger, metrics, and tracing/error tools.
