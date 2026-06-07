# Data privacy rules

> Optional module — relevant to projects that handle personal or sensitive data
> (PII). Run `ai-init` to align with the project's regulatory context.

Personal data is a liability you hold in trust. Collect less, protect what you
keep, and be able to delete it.

## Minimize

- **Collect only what's needed** for the stated purpose. Don't store data "just
  in case". Less data is less risk.
- Define and enforce **retention**: data has an expiry and a deletion path. Be
  able to delete or export a person's data on request.

## Protect

- Encrypt PII **in transit and at rest**. Restrict access to those who need it
  (least privilege) and log access to sensitive records.
- **Never log or send PII to analytics/error tools** unredacted (see
  [[observability]]). Mask in non-production environments.
- Pseudonymize/anonymize where the full identity isn't required.

## Govern

- Track the **lawful basis / consent** for processing where required, and honor
  withdrawal.
- Know where data lives and crosses borders; respect data-residency constraints.
- A change to what PII is collected, where it flows, or how long it's kept
  warrants an ADR (see `adr-write`).

> Run ai-init to record the applicable regime (GDPR/CCPA/HIPAA/…), PII inventory,
> and retention policy.
