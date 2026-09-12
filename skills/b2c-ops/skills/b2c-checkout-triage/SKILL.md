---
name: b2c-checkout-triage
description: Investigate B2C Commerce checkout or payment failures, increased failed orders, or falling order volume. Compare bounded order evidence, integration logs and affected data; separate payment failures from traffic and reporting gaps.
---

# Checkout and payment triage

Outcome: quantify the observed symptom, localize a likely subsystem, and produce
an actionable handoff. Do not create test orders, charge/refund payments, change
order status, or modify production data as part of inspection.

## Scope and impact

Use `config_inspect` (CLI: `b2c setup inspect`) and confirm site, UTC time window,
reported symptom, and comparison period. Ask for missing values. Preserve the
same target/window in all calls. No cartridge source is required.

"Orders down" can mean less traffic, checkout errors, abandoned baskets, payment
declines, or delayed reporting. Failed order records alone do not measure all
checkout attempts or conversion. Do not force every incident into a payment cause.
Record breadth, duration, workaround, and owner. Follow the team's severity and
update process for live customer impact; do not wait for exact counts to escalate.

## Access and tools

| Signal                       | Preferred path                                                   | Limit / fallback                                                                                                                                                               |
| ---------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Payment/custom logs          | `logs_list_files`, then `logs_get_recent` on discovered prefixes | Start with 20 relevant entries; samples are not full-window counts. CLI: `b2c logs list` / `b2c logs get`.                                                                     |
| Order records                | Discover Admin Orders contracts via code mode                    | A response enum does not establish supported status filters. See [failed-order triage](skill://b2c-ops/b2c-order-failure-triage/SKILL.md) for the demonstrated OCAPI fallback. |
| Affected products/attributes | SCAPI Admin product reads; live schemas for tenant custom fields | Compare known IDs and selected fields. Shopper contracts are reference-only in this runtime.                                                                                   |
| Suspected import/integration | [b2c-job-health](skill://b2c-ops/b2c-job-health/SKILL.md)        | Read the chosen job's log and check its actual data effects.                                                                                                                   |
| Traffic/latency context      | Code mode Metrics where enabled; CLI `b2c metrics`               | Feature access and scopes vary. CIP/CCAC is a separate reporting path: CLI `b2c cip`, with freshness/coverage limits.                                                          |

Read `skill://mcp/scapi/SKILL.md` before code mode; prefer dedicated tools when
available. Discover operations/required fields before requests, compose bounded
reads, and return selected evidence with errors and continuation. Read only the
conditional reference needed; native assistants can use installed skill names.

## Checks and decisions

1. Quantify with comparable windows and explicit denominators. Label unavailable
   counts unknown, a zero-denominator ratio undefined, and sampled products as
   sample frequencies. Preserve query errors; never convert them to zero failures.
2. Find recurring integration errors, timestamps, and safe correlation IDs. Avoid
   customer/payment data in output. A gateway response may point to upstream data,
   configuration, provider availability, or input validation; test the alternatives.
3. Compare a failing and healthy input. Discover relevant custom attributes if
   needed; do not dump whole product/order payloads into context.
4. Identify the writer of a suspect field, if evidence warrants it. Review job
   execution/logs and real change records. Coincident modification timestamps
   alone do not identify a regressing deployment.

## Mitigation and recovery

Reproduction, reruns, deployments, or data changes require explicit authorization
and a suitable environment. After an intervention, compare the same signals over
a fresh equivalent interval; verify business behavior and distinguish observation
delay from confirmed recovery. Operator handoff can be complete without a code fix.

## Escalation and handoff

Report impact/site/window, counts and sample limits, safe correlation IDs, log
excerpts, affected input, hypotheses, access gaps, and next owner/update. Continue
with logs if order access is blocked. Route provider evidence to the integration
owner, custom defects to the developer, and suspected platform failures to
Salesforce Support. Use native `b2c-production-triage` or the MCP
[case template](skill://b2c-ops/b2c-production-triage/references/escalation.md).
Prepare a draft; submitting a case/message requires authorization.
