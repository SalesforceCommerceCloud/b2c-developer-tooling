---
name: b2c-production-triage
description: Investigate B2C Commerce incidents using B2C MCP logs, SCAPI code-mode job/data reads, and CLI fallbacks. Route error spikes, stale data, or checkout failures to focused runbooks and produce a team or Support handoff.
---

# Production triage

Connect the toolkit's logs, job executions, business data, and configuration
into an evidence-backed assessment and next action. Investigation does not
authorize remediation. Use the symptom routes below rather than collecting
every available signal.

## Scope and impact

- Resolve the task's project/instance with `config_inspect`; CLI: `b2c setup inspect`.
  Preserve the resolved target across calls. Ask for missing site, time window,
  timezone, symptom, or expected behavior; never invent IDs or silently switch tenants.
- Start with the reported interval; if unspecified, propose the last two hours
  and label that assumption. Use fixed UTC boundaries for comparisons and paging.
- Record current impact (sites, checkout availability, order/data integrity,
  workaround) and the incident owner. Apply the team's severity policy; do not
  invent a priority or support SLA. Escalate active material impact early without
  waiting for root cause; agree who communicates and the next update time.

## Access and tools

- Establish access: MCP, terminal/CLI, logs, data, source. Operator work does not
  require a cartridge checkout. Credentials/setup issues: MCP `mcp/b2c-config`
  section `setup-and-access`; native `b2c-config`/`b2c-auth`, or the
  [authentication guide](https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/authentication).

Prefer dedicated MCP tools; discover available names once. Read
`skill://mcp/scapi/SKILL.md` before using `scapi_search`/`scapi_execute`, as those
tools require. Read only the matching runbook/reference, not every linked skill.
Native assistants use the installed skill name; MCP can read these URIs or use
`skills_read` with `collection: "b2c-ops"` and a task query.

| Symptom                                                   | Toolkit path                                                                                                                                | Decision / detail                                                                                                                                                            |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Error spike or integration errors                         | `logs_list_files` -> returned `prefix` -> `logs_get_recent` with `count: 20`, `since`, and a relevant `search`                              | Defaults cover error/customerror, not every `custom-*` integration log. CLI: `b2c logs list` / `b2c logs get`.                                                               |
| Failed job or stale data                                  | Code mode `codemode.describe("builtin/failed-job-triage")`, then run with fixed `from`/`to` -> execution IDs and `logFilePath` -> log tools | [Job health](skill://b2c-ops/b2c-job-health/SKILL.md) covers continuation, step details, CLI job logs, and green-but-incomplete runs.                                        |
| Checkout failures or orders down                          | Custom logs -> determine whether failures produce order records -> relevant data/traffic evidence                                           | [Checkout triage](skill://b2c-ops/b2c-checkout-triage/SKILL.md) distinguishes checkout symptoms from failed-order records.                                                   |
| Find/count FAILED orders or investigate affected products | Verify Admin filter support; otherwise external OCAPI Shop order search -> safe IDs -> logs and selected Admin product reads                | [Failed-order triage](skill://b2c-ops/b2c-order-failure-triage/SKILL.md) owns enumeration, count/sample limits, and the workaround. No OCAPI helper exists inside code mode. |
| Suspected code change                                     | CLI `b2c code list`: active/rollback version and `lastModified`                                                                             | No dedicated MCP code-version listing; modification is not activation history. Corroborate with release records.                                                             |
| Runtime-only defect                                       | [MCP debugger](skill://mcp/debugger/SKILL.md) on an authorized reproduction target                                                          | Operator handoff is valid without source access. Do not halt production requests for routine triage.                                                                         |

## Checks and decisions

1. Carry the returned configuration `resolution` into the evidence record.
   `config_inspect` stays masked; do not read `dw.json` or request tokens merely
   to make managed MCP calls. Pass the same project/instance context to CLI fallbacks.
2. Join signals using execution IDs, log timestamps, and affected record IDs.
   For nested job logs, pass the path relative to `Logs/`; for top-level logs,
   use the discovered category prefix. A bounded recent-log result is a sample,
   not full-interval coverage. CLI `b2c job log JOB_ID EXECUTION_ID` retrieves
   a selected job log when recent parsing is insufficient.
3. Reuse code-mode snippet totals/window/`nextOffset`; do not return entire
   schemas or records. The failed-job snippet omits step details and healthy
   runs: fetch those selectively when needed. Compare expected business data
   with a healthy input before calling a green job healthy.
4. Preserve failed stages: HTTP `ok`/`status` and diagnostics, or thrown
   auth/transport/safety errors. An OCAPI fallback error may mask an earlier
   SCAPI rejection; CLI `--api-backend scapi` isolates it. POST searches can
   be blocked by Safety Mode despite being reads. Do not infer missing scopes
   from every 403 or treat unavailable counts as zero.

## Mitigation and recovery

Recommend the smallest supported mitigation, its blast radius and rollback limit.
The authorized owner decides; inspecting an incident is not permission to change
it. Restore service when justified without waiting for a full causal explanation.
After intervention, recheck business behavior and comparable signals over an
agreed observation interval. Report recovered, partial, pending, or unknown;
record follow-up prevention separately from immediate recovery.

## Escalation and handoff

Report: target/site; UTC window; observed impact and denominator; evidence
locations (execution IDs, log path/timestamps, minimal excerpts); suspected
component/input/change; alternative explanations; access gaps; next owner/action.
Exclude tokens, payment details, and unnecessary customer data.

Route custom-code evidence to the developer/implementation partner, grant or
schedule issues to the administrator, provider failures to the integration owner,
and suspected platform failures to Salesforce Support. Read
[escalation and case template](references/escalation.md) when preparing a handoff.
Do not submit a case/message without authorization or claim a confirmed cause
when evidence establishes only a lead.
