# Security rules

> Generic defaults. Run `ai-init` to replace these with rules derived from your
> actual codebase.

- **Never hardcode secrets or API keys.** Read them from environment variables
  or a secrets manager. Never commit `.env` files.
- **Validate all external input.** Anything crossing a trust boundary (HTTP
  body, query params, headers, webhooks, file uploads) must be validated at the
  entry point with a schema validator idiomatic to your stack (e.g. zod,
  pydantic, a struct validator).
- **Never build queries by string concatenation.** Use parameterized queries /
  prepared statements / your ORM's binding — for SQL or any injectable target.
- **Apply security headers** on HTTP services (HTTPS, CSP, disable framework
  fingerprints) using your framework's standard middleware.
- **Log errors, not stack traces to the client.** Return a generic error
  message and a correlation id to the caller; log the full detail server-side.
- **Principle of least privilege.** Tokens, DB users, and service accounts get
  only the scopes they need.

> Run ai-init to add project-specific security rules derived from your codebase.
