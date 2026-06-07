# Candidate optional modules (future backlog)

A curated catalog of optional modules we may add later. **None of these are
implemented.** They are mapped here so the idea isn't lost and so anyone can pick
one up with a clear scope.

## Guiding principle

Do **not** create these up front. The value of the core/optional split (see
[`OVERVIEW.md`](OVERVIEW.md) and `scaffold.manifest.json`) is a curated, agnostic
core plus modules added **on demand** — when a real project or team asks for one.
A bloated catalog of half-relevant rules erodes the "every rule here matters"
principle.

To implement one: add the template under `templates/.ai/rules/` or
`templates/.ai/skills/`, register it in `scaffold.manifest.json`, bump
`SCAFFOLD_VERSION`, and update the README tree (see `CLAUDE.md` → "Rules for
changes in this repo").

Each row: **id** · kind · scope · when it applies.

## Architecture / backend

| id | kind | Scope | Applies when |
|----|------|-------|--------------|
| `event-driven` | rule | Messaging, queues, events, sagas, outbox, consumer idempotency | Uses async messaging/event streams |
| `graphql` | rule | Schema/resolver conventions, N+1 via dataloaders, cursor pagination | Exposes a GraphQL API |
| `microservices` | rule | Service boundaries, inter-service contracts, sync vs async comms | Multi-service architecture |
| `caching` | rule | Cache strategy and invalidation (today only grazed by `performance`) | Has a meaningful caching layer |
| `database-design` | rule | Modeling, normalization, indexing (beyond `migration`) | Owns non-trivial schema design |

## Frontend / client

| id | kind | Scope | Applies when |
|----|------|-------|--------------|
| `frontend-performance` | rule | Bundle size, Core Web Vitals, lazy-loading, hydration | Has a web UI with perf budgets |
| `state-management` | rule | State patterns, data-fetching, client-side caching | Rich client app |
| `seo` | rule | Meta, structured data, SSR/SSG, sitemaps | Public web pages need discoverability |
| `mobile` | rule | iOS/Android specifics, offline, permissions | Native/mobile app |

## Platform / operations

| id | kind | Scope | Applies when |
|----|------|-------|--------------|
| `ci-cd-pipeline` | rule | Deploy strategy, releases, canary/blue-green | Has an automated deployment pipeline |
| `infra-as-code` | rule | Terraform/Pulumi conventions, state, drift | Infra is codified |
| `containerization` | rule | Docker/K8s, minimal images, healthchecks | Ships containers |
| `feature-flags` | rule | Flag lifecycle, cleanup, kill-switches | Uses feature flags |
| `monitoring-alerting` | rule | SLOs, actionable alerts (complements `observability`) | Operates a service with on-call |

## Security / compliance

| id | kind | Scope | Applies when |
|----|------|-------|--------------|
| `auth` | rule | AuthN/AuthZ in depth (OAuth/OIDC, sessions, RBAC/ABAC) — deeper than `security-review` | Owns authentication/authorization |
| `payments` | rule | PCI, money idempotency, reconciliation, payment webhooks | Processes payments |
| `webhooks` | rule | Signing, verification, retries, idempotency | Sends/receives webhooks |
| `rate-limiting` | rule | Quotas, throttling, abuse protection | Public/abusable endpoints |
| `audit-logging` | rule | Immutable audit trail (who/what/when) | Regulated or sensitive actions |
| `compliance` | rule | SOC2/HIPAA/PCI specifics per regime | Under a formal compliance regime |

## Project type / delivery

| id | kind | Scope | Applies when |
|----|------|-------|--------------|
| `library-publishing` | rule | Semver, changelog, public API surface, deprecations | Publishes a reusable library |
| `cli-design` | rule | CLI UX (flags, exit codes, human vs machine output) | Ships a CLI |
| `monorepo` | rule | Workspace conventions, package boundaries, affected builds | Monorepo layout |
| `data-pipeline` / `ml` | rule | Reproducibility, data/model versioning, notebooks | Data/ML workloads |

## Communication / content

| id | kind | Scope | Applies when |
|----|------|-------|--------------|
| `email-notifications` | rule | Templates, deliverability, opt-out | Sends transactional/marketing email |
| `file-upload` | skill | Validation, size limits, storage, scanning, security | Accepts user file uploads |

---

_Last reviewed: 2026-06. Update this list as modules are promoted to
`scaffold.manifest.json` or new candidates emerge._
