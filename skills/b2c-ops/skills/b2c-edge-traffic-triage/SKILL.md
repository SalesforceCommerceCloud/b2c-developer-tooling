---
name: b2c-edge-traffic-triage
description: Investigate bot activity, scrapers, crawlers or abusive traffic hitting a B2C Commerce storefront through the eCDN (CDN edge). Review WAF, firewall and rate-limiting protections, correlate available traffic evidence, and propose narrowly scoped rule changes for approval.
---

# Edge traffic and bot triage

Outcome: identify which automated traffic matters, whether current edge
protections cover it, and a proposed, approved next step. Inspection never
authorizes blocking, challenging, or changing zone settings.

## Scope and impact

Resolve the instance with `config_inspect` (CLI: `b2c setup inspect`). List the
tenant's zones first and focus on production storefront zones; ask when the
target zone is ambiguous. Use a fixed UTC window (propose the last 7 days if
none is given) and record the symptom: origin load or errors, scraping, login or
token abuse, basket/inventory abuse, or a routine review. Record impact and
owner; follow the team's incident process for live customer impact.

## Access and tools

| Evidence                 | Preferred MCP path                                                                                                                                              | CLI fallback                                                                                      |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Zones                    | Code mode `getZonesInfo` (`cdn/zones/v1`)                                                                                                                       | `b2c ecdn zones list`                                                                             |
| Edge protections         | Code mode reads of security settings, custom firewall rules, rate-limiting rules, managed WAF rulesets                                                          | `b2c ecdn security get`, `b2c ecdn firewall list`, `b2c ecdn rate-limit list`, `b2c ecdn waf ...` |
| Edge traffic attribution | Discover read operations for edge traffic or analytics with `scapi_search` (`api: "cdn/zones/v1"`, prefer `schemas: "live"`); use only what the contract offers | Logpush jobs (`listLogpushJob`; `b2c ecdn logpush jobs list`) show where raw edge logs already go |
| Edge volume and errors   | `metrics_get` with `category: "ecdn"` where the Metrics API is enabled                                                                                          | `b2c metrics ecdn`                                                                                |
| Origin impact            | `logs_list_files` / `logs_get_recent`                                                                                                                           | `b2c logs get`                                                                                    |

Read `skill://mcp/b2c-mcp-scapi/SKILL.md` before code mode; the zone APIs need
`sfcc.cdn-zones` (writes `sfcc.cdn-zones.rw`). If no traffic operation is
available to this tenant or client, say that edge attribution is unavailable
through the toolkit and continue with protections, Logpush and origin evidence.
Never infer traffic volume from rule configuration alone.

## Checks and decisions

1. Keep executions small: one or two zones per `scapi_execute`, fixed `from`/`to`,
   small result limits. Executions stop at 30 s; split work rather than retry a
   timed-out batch whole.
2. Classify sources by user agent, ASN, IP, host, path, status and cache result:
   verified crawlers and link previews, monitoring or integrations, unverified
   automation (headless browsers, HTTP libraries, empty user agents), and
   scanning or exploit probes. A user agent is self-reported; corroborate it.
3. Before proposing action on a high-volume source, ask who runs it. Synthetic
   monitors, performance tests, feeds and Salesforce services often look like bots.
4. Prioritize traffic that reaches origin or sensitive paths (login, token,
   basket, checkout, search). Mostly cached automation has lower origin cost.
5. Compare sources with protections: rules in a non-enforcing mode (monitor,
   simulate, log), disabled managed rules, thresholds above observed rates,
   and rules scoped to other hosts or paths. Report gaps, not only matches.

## Mitigation and recovery

Propose the narrowest change (host, path, ASN or verified-bot condition) and a
non-enforcing or challenge step before a block. Changes need explicit approval
and are subject to Safety Mode. After a change, re-check the same evidence over
a fresh equivalent window and keep a rollback (previous rule state). Rule
syntax and CLI options: native `b2c-ecdn`, MCP `skill://b2c-cli/b2c-ecdn/SKILL.md`
and its `references/SECURITY.md`.

## Escalation and handoff

Summarize zones, window, top sources with counts and share, the evidence source
and its limits, matching rules and gaps, proposed changes, and next owner.
Route suspected attacks with customer impact to the security owner and
Salesforce Support. Use native `b2c-production-triage` or the MCP
[case template](skill://b2c-ops/b2c-production-triage/references/escalation.md).
