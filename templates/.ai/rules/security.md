# Security rules

> Generic defaults. Run `ai-init` to replace these with rules derived from your
> actual codebase.

- **Never hardcode secrets or API keys.** Read them from environment variables
  or a secrets manager. Never commit `.env` files.
- **Validate all external input.** Anything crossing a trust boundary (HTTP
  body, query params, headers, webhooks, file uploads) must be validated and
  typed at the entry point. Use a schema validator such as `zod`.
- **Use parameterized queries.** Never build SQL or NoSQL queries by string
  concatenation. Use the driver's parameter binding or an ORM.
- **Apply security headers.** For HTTP services, set sane defaults (suggest
  `helmet` for Express). Enforce HTTPS, set CSP, disable `x-powered-by`.
- **Log errors, not stack traces to the client.** Return a generic error
  message and a correlation id to the caller; log the full detail server-side.
- **Principle of least privilege.** Tokens, DB users, and service accounts get
  only the scopes they need.

> Run ai-init to add project-specific security rules derived from your codebase.
