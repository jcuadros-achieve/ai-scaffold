# Performance & scalability rules

> Generic defaults. Run `ai-init` to set real budgets and the project's known
> hot paths.

Correctness first, then performance — but never ship a known scalability cliff.

## Data access (if the project has a datastore)

- **No N+1 access patterns.** Batch or join. Watch loops that query/fetch
  per-iteration.
- **Always paginate** unbounded lists. Never fetch a whole growing table/
  collection without a limit.
- Index the fields you filter and sort on; flag missing ones.
- Cache deliberately, with an explicit invalidation story. A cache without
  invalidation is a bug.

## Algorithms & memory

- Mind complexity on collections that grow with usage — avoid quadratic work on
  user-scaled data.
- Stream large payloads; don't load unbounded data fully into memory.

## Async & I/O

- Parallelize independent I/O; don't `await` in a loop when calls are
  independent.
- Set timeouts on every external call (see [[resilience]]).

## Budgets

- Respect the project's performance budgets (response time, query count, bundle
  size). If a change regresses a budget, call it out — regressions need a
  conscious decision, not a silent merge.

> Run ai-init to record real budgets, hot paths, and the profiling tools used.
