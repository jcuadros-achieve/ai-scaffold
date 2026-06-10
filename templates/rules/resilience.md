# Resilience & reliability rules

> Generic defaults. Run `ai-init` to align with the project's failure modes and
> infrastructure.

Anything across a network or process boundary will fail. Design for it.

## External calls

- **Timeouts on everything.** No unbounded waits on a network, DB, or queue.
- **Retry only safe operations**, with backoff and a cap. Retrying a
  non-idempotent write duplicates effects — don't.
- Use a circuit breaker / bulkhead for dependencies that can fail in bulk, so one
  slow dependency doesn't exhaust the whole system.

## Idempotency & consistency

- **Make writes idempotent** where a retry or redelivery is possible (idempotency
  keys, upserts). Message consumers must tolerate duplicate delivery.
- Wrap multi-step state changes in a transaction, or design a compensating
  action. Never leave data half-updated on partial failure.
- Be explicit about consistency expectations when crossing services.

## Degradation

- Fail gracefully: a non-critical dependency being down should degrade a feature,
  not take down the request.
- Surface a clear, generic error to the caller and the real detail to the logs
  (see [[security]], [[observability]]).

> Run ai-init to record real timeout/retry policies and critical dependencies.
