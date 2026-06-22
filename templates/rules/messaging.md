---
id: rule/messaging
surface: rule
title: "Messaging: async"
summary: Idempotent consumers, versioned schemas, dead-letter handling, correlation/trace propagation, bounded queues
tags: [messaging, async, kafka, pubsub]
appliesWhen:
  any:
    - dep: "kafkajs"
    - dep: "@google-cloud/pubsub"
    - dep: "amqplib"
    - dep: "rascal"
    - dep: "kafka-python"
    - contains: "kafka"
    - contains: "pubsub"
    - contains: "consumer"
rationale: Async-messaging conventions the core rules can't carry generically; applies wherever a producer/consumer exists
stability: stable
---

# Messaging (async) rules

> Generic defaults. Run `ai-init` to record the broker (Kafka/Pub-Sub/RabbitMQ),
> the schema format, and the retry/DLQ strategy.

Async messaging decouples producers from consumers — and that same decoupling is
where messaging bugs hide: a consumer that isn't idempotent processes a redelivery
twice; a schema change breaks a consumer silently; a poison message loops
forever. The conventions here are the guardrails that make a messaging system
trustworthy.

## Consumers

- **Consumers are idempotent by default.** Redelivery is normal (at-least-once is
  the common guarantee); a second delivery of the same message must be a no-op or
  safely repeatable. Key on a stable message id; guard with an idempotency table
  where side effects aren't naturally idempotent.
- **Handle poison messages.** A message that always throws will loop forever. Route
  unprocessable messages to a dead-letter topic/queue with the failure reason, and
  alert on DLQ depth — don't let it block the partition.
- **Commit/ack after processing** (or on the configured at-least-once semantics) —
  never before. Ack-then-process loses messages on a crash.

## Schemas & contracts

- **Versioned schemas.** Producers and consumers evolve independently; use a
  schema registry / versioned envelope. A breaking schema change is a consumer
  outage — treat it like the API breaking change it is (see `api-contract`).
- Be additive: new optional fields are safe; renames/removals/type-changes are
  breaking and need a version bump + a migration window.
- Validate at the boundary; reject (to DLQ) rather than process a malformed
  message.

## Reliability

- **Propagate correlation & trace context** in the message envelope so a flow
  reconstructs across the broker (see `observability`).
- **Bound your queues.** No unbounded buffer — set max-size/retention; an unbounded
  queue turns a slow consumer into a memory/disk incident.
- Set consumer timeouts and concurrency deliberately; a stuck consumer holds the
  partition.
- No secrets in message payloads — reference, don't inline (see `config-secrets`).

> Run ai-init to record the broker, schema format, and the retry/DLQ strategy.
