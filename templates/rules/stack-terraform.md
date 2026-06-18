---
id: rule/stack-terraform
surface: rule
title: "Stack: Terraform"
summary: HCL conventions, least-privilege IAM, state safety, and plan-before-apply discipline for IaC
tags: [stack, terraform, iac]
appliesWhen:
  any:
    - file: "**/*.tf"
    - file: "**/*.tf.json"
rationale: Terraform-specific conventions the core rules can't carry generically; applies wherever HCL exists
stability: stable
---

# Stack: Terraform rules

> Generic defaults. Run `ai-init` to record the project's backend, required
> providers, naming scheme, and the environments it manages.

Infrastructure is code with blast radius. The same change that's trivial in an
app can take down a production database — so the discipline here is about
**predictability and reversibility**, not style.

## State & backend

- **State is remote and locked**, never a local `.tfstate` committed to the repo.
  Remote state belongs in a backend with locking (S3+DynamoDB, GCS, Terraform
  Cloud/Enterprise); `ai-init` records which.
- **Never hand-edit state.** `terraform state` subcommands only, and only with a
  reason you can write down.
- Pin the backend and `required_providers` to specific versions; a provider bump
  is a change like any other.

## Plan before apply (the gate)

- **Every change ships a plan a human reads.** `terraform plan` output is the
  review unit — not the diff of `.tf` files, which hides force-replace and
  destroy cascades.
- Watch the **`+/-` (replace) and `-` (destroy)** lines; that is where the damage
  is. A plan that destroys a managed resource needs an explicit decision.
- `terraform apply` runs from the reviewed plan (`-out=`), in CI — never from a
  laptop against prod.

## Resources

- **Least privilege by default.** IAM bindings, security groups, and service
  accounts get the narrowest scope that works; never `*` permissions "to unblock".
- Name resources consistently (`ai-init` records the scheme); tag everything that
  incurs cost with owner and environment.
- Prefer modules for repeated patterns; keep root configs thin — orchestration,
  not a wall of resources.
- `terraform fmt` and `validate` are non-negotiable and machine-enforced; a
  failing `fmt`/`validate` blocks the PR.

## Secrets & data

- **Secrets never in HCL.** Reference secret managers (Secret Manager, Vault,
  SSM) or mark outputs `sensitive = true`; never echo or log a secret value.
- Treat `terraform import` of existing resources as careful, manual work with a
  rollback — it mutates state.

> Run ai-init to record the backend, providers, environments, naming/tagging
> scheme, and who is allowed to apply.
