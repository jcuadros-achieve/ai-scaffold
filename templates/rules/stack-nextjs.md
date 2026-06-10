# Stack rules: Next.js

> Optional stack module — covers Next.js 13.4+ with the App Router (through
> 15.x). Durable conventions and pitfalls only; API details belong to the live
> docs. Run `ai-init` to fill the project-specific sections.

## Server/client boundary

- Components are **Server Components by default**; add `'use client'` only at
  interactive leaves, never at layout/page roots "just in case" — every client
  boundary drags its subtree into the browser bundle.
- Props crossing a server→client boundary must be serializable: no functions,
  class instances, or Dates-as-objects. If you need behavior, pass data down
  and define the handler in the client component.
- Server-only code (DB clients, secrets usage) must never be importable from
  client components — enforce the separation with a dedicated server-only
  module layer rather than discipline.

## Data fetching & caching

- Fetch on the server by default; client fetching is the exception for truly
  interactive data. Avoid request waterfalls — parallelize independent fetches.
- Make caching semantics **explicit and consistent**: pick one convention for
  revalidation/cache opt-out and apply it project-wide. Implicit cache behavior
  that differs per route is the #1 source of "stale data" bugs.
- Mutations invalidate what they change — a mutation without its matching
  revalidation is a bug, not a follow-up.

## Hydration

- Anything rendered on both server and client must be deterministic: no
  `Date.now()`, locale-dependent formatting, or randomness in shared render
  paths. `suppressHydrationWarning` is a smell, not a fix.
- Browser-only APIs (`window`, `localStorage`) belong in effects or
  client-only components, never in render bodies.

## Configuration & secrets

- `NEXT_PUBLIC_*` env vars are **shipped to the browser** — secrets must never
  carry the prefix. Treat adding the prefix as a security-review event
  (see `security` rule).
- Public env vars are inlined at build time: changing them requires a rebuild,
  not a restart. Don't design runtime toggles around them.

## Assets & routing

- Images and fonts go through the framework's optimized components — raw
  `<img>`/font links reintroduce layout shift and defeat the build pipeline.
- Keep middleware light: it runs on every matched request (often at the edge);
  no heavy dependencies or blocking I/O there.
- SEO metadata uses the framework's metadata API, not hand-rolled head tags.

## Project specifics (Run ai-init to fill)

- Router flavor and version: TODO — App Router / Pages Router, Next version.
- Data-fetching convention: TODO — where fetches live, revalidation policy.
- Server actions vs route handlers: TODO — which this project uses and when.
- State management and client data caching: TODO.
- Component library and styling system: TODO (e.g. MUI, Tailwind).
- Deploy target and its constraints: TODO — Vercel / self-hosted / container.
