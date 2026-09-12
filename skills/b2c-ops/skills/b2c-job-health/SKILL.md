---
name: b2c-job-health
description: Review B2C Commerce scheduled jobs during routine operations or investigate failed jobs, missing runs, stale imports, and green executions with incomplete results. Check logs and business data before proposing a rerun.
---

# Job health

Outcome: identify which scheduled work completed its business purpose, what is
late/failed/partial, and whether intervention or a developer handoff is needed.

## Scope and impact

Resolve instance/site and a fixed UTC interval with `config_inspect` (CLI:
`b2c setup inspect`). Obtain the expected jobs, schedule/timezone, and intended
updates from the user or available configuration. No matching execution is
"missing" only when a run was actually expected.
Record the business deadline, affected data/sites, and owner. For material impact,
use the team's incident severity/update process; a routine review need not declare
an incident. Do not invent impact from a red status alone.

## Access and tools

| Evidence                     | Preferred MCP path                                               | CLI fallback                                                 |
| ---------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------ |
| Execution history and steps  | SCAPI Jobs through code mode                                     | `b2c job search`; check `--help` for filters                 |
| Known execution log          | `logs_list_files` / `logs_get_recent` with its relative log path | `b2c job log JOB_ID EXECUTION_ID`                            |
| Expected product/data change | Discover the relevant Admin operation and select affected fields | Relevant CLI/data workflow if supported                      |
| Code-version clues           | Available deployment/history API, otherwise CLI                  | `b2c code list`; modification time is not activation history |

Read `skill://mcp/scapi/SKILL.md` before code mode. Use its search/discovery
contract; project/instance context belongs on tool calls. Authentication is
managed. Do not export tokens or use ambient fetch inside code mode.

## Checks and decisions

1. Search a small page of executions in the interval. For routine review, include
   successful and unfinished runs, not only failures. Compare against the expected
   schedule; inspect relevant steps/duration and time zone before calling a run late.
2. For failure-only review, reuse `builtin/failed-job-triage`: inspect with
   `codemode.describe`, then `codemode.run` with fixed `from`, `to`, and `limit`
   (maximum 3). Continue using its returned offset/window only as needed. Keep
   errors and partial results. The snippet returns selected execution fields,
   not `stepExecutions`; fetch the selected execution's detail if steps matter.
   A POST search can be blocked by Safety Mode;
   explain the denied read operation rather than weakening policy.
3. Read the log for the selected execution. Use its returned `logFilePath`;
   for nested paths remove only an initial `Logs/` for MCP `prefixes`. Top-level
   files need their discovered category prefix, not the filename. For a nested
   directory use a trailing slash. Discover matching files, then request
   bounded entries around the failure. Defaults only search error/customerror.
   See [job-log details](references/job-logs.md) if the result is empty or incomplete.
4. Identify the first relevant fault, processed/skipped records, and which steps
   actually ran. Job transitions can continue after errors; do not assume every
   later step was skipped. Green status can also hide skipped or incomplete work.
5. Verify a small sample of the expected data and one healthy comparison. Correlate
   changes without claiming causation from matching timestamps alone.

## Mitigation and recovery

Before an authorized rerun, check for an active execution, partial writes,
idempotency, duplicate exports/messages, and rollback limits. Inspect uncertain
outcomes before retrying; never replay a whole code-mode program after writes.
Verify business data as well as terminal job status after intervention.

## Escalation and handoff

Summarize job/execution/step IDs, impact/window, status, affected inputs, log
evidence, observed data, unknowns, and next owner/action. Use the administrator
for custom schedule/access issues, developer for custom-step defects, and
Salesforce Support for suspected platform/system-job problems. Native skill:
`b2c-production-triage`; MCP [case template](skill://b2c-ops/b2c-production-triage/references/escalation.md).
No source access is required; case submission needs authorization.

CLI-specific detail when needed: native `b2c-job`, MCP
`skill://b2c-cli/b2c-job/SKILL.md`, or the
[Jobs reference](https://salesforcecommercecloud.github.io/b2c-developer-tooling/cli/jobs).
