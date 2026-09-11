---
name: b2c-order-failure-triage
description: Find and investigate FAILED B2C Commerce orders, quantify their share of indexed orders, and correlate failed inputs with logs and jobs. Covers SCAPI status-filter limitations and the OCAPI Shop order_search fallback.
---

# Failed-order triage

Use when the user needs failed order records, counts, affected products, or an
explanation of why a group of orders failed. Broader "checkout is down" symptoms
start with `b2c-checkout-triage`; some checkout failures create no order at all.

## Scope and impact

Resolve instance/site with `config_inspect` (CLI: `b2c setup inspect`). Fix UTC
`from`/`to` boundaries and a comparison period. Ask for missing site/window;
do not use a demo default. Record impact and owner under the team's incident
process. Counts describe indexed orders, not all checkout attempts or conversion.

## Access and tools

| Need                             | Toolkit path                                                                                                   | Important limit                                                                                                                              |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Enumerate FAILED orders          | Check Admin Orders query support with `scapi_search`; external OCAPI Shop `POST /order_search` is the fallback | SCAPI `status=failed` has returned HTTP 400; a response enum does not prove query support. CIP/CCAC is not a substitute for this population. |
| External request authentication  | CLI `b2c auth token --json` or MCP's documented AM token-export helper                                         | Use only for the external client. SCAPI code mode has no OCAPI request helper, and its safety policy does not cover external HTTP.           |
| Failure reason and correlation   | `logs_list_files` -> discovered integration prefix -> bounded `logs_get_recent`                                | Discover `custom-*` categories; error/customerror defaults can miss the payment integration.                                                 |
| Suspect product/custom attribute | Code-mode Admin reads; live schema expansion when the field is unknown                                         | Compare selected fields on known failed/healthy IDs; Shopper execution is unsupported.                                                       |
| Suspected data writer            | [b2c-job-health](skill://b2c-ops/b2c-job-health/SKILL.md)                                                      | Inspect the execution log and actual data effects, not just job status.                                                                      |

Read [order-search recipe](references/order-evidence.md) before counting: it
defines the site grant/index prerequisites, bounded request bodies, auth handling,
and fault interpretation. For code mode, first read `skill://mcp/scapi/SKILL.md`.
If external requests are unavailable, report that evidence gap and continue with
logs; do not deploy an OrderMgr endpoint to obtain access.

## Checks and decisions

1. Query FAILED and all indexed order totals for the **same site/window**. Validate
   every response. Report `failed / all indexed orders`; if either query fails,
   the ratio is unknown. Zero denominator means undefined, not zero failures.
2. Select at most 10 recent failed orders: order number, creation time, status,
   and product IDs. Omit customer/payment fields. Label product frequencies as a
   sample and deduplicate each product per order. The earliest indexed failure
   in the window is not necessarily incident onset.
3. Correlate safe order/request IDs and timestamps with integration logs. Test
   whether failures cluster by input, provider response, region, or change window.
   Do not infer a payment decline solely from the order's FAILED status.
4. Compare one healthy input before blaming an attribute. If a job writes the
   suspect field, inspect its log and persisted data. Keep failed stages,
   sampling/index delays, alternative causes, and missing access explicit.

## Mitigation and recovery

Investigation does not authorize changing order status, reprocessing orders,
retrying charges, refunding, rerunning integrations, or changing access/indexes.
Before authorized intervention, establish duplicate-charge/message risks and
partial effects. Verify new outcomes over an equivalent interval; old FAILED
records need not disappear for recovery to be real.

## Escalation and handoff

Provide site/window, totals/denominator, sample size and safe IDs, recurring error,
affected input, suspected writer/component, limitations, and the next owner.
Route to the administrator, developer, integration provider, or Salesforce Support
using the [case template](skill://b2c-ops/b2c-production-triage/references/escalation.md).
Missing Shop access is a targeted administrator request, not evidence of no
failures. Case submission and other external communication require authorization.
