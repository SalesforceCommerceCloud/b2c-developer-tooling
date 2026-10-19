---
name: b2c-mcp-claude-artifacts
description: Read before building a Claude artifact, Cowork dashboard, or published page from B2C data. Artifacts cannot call this local MCP server; choose live or refreshed-snapshot designs.
---

# B2C data in Claude artifacts

This server runs locally (stdio, plugin, or Desktop configuration). Claude can
call its tools while it builds a page, but the page cannot. In Claude Cowork,
claude.ai, Claude Desktop chat, and published Claude Code pages, an artifact can
call only connectors added to the user's claude.ai account. A Cowork artifact
calling this server through `window.cowork.callMcpTool` fails with
`Tool call failed: 400`; adding the tool to the artifact's MCP allowlist does not
change that. Do not retry or rename tools to work around it.

Decide the data path before writing the page.

## Choose a design

| Need                                                               | Design                                                            |
| ------------------------------------------------------------------ | ----------------------------------------------------------------- |
| Live data and the user can run local code                          | [Local live dashboard](#local-live-dashboard)                     |
| Live data in an artifact, and a claude.ai connector for B2C exists | Allowlist the connector's tools; the artifact calls them directly |
| A recurring view inside Cowork or claude.ai                        | [Refreshed snapshot](#refreshed-snapshot)                         |
| A one-time report                                                  | Embed the results; state when they were collected                 |

Ask when the choice changes what the user gets, for example live data versus a
morning refresh. Otherwise state the choice and its freshness.

## Local live dashboard

A page served from the user's computer can fetch live data. Write a small local
app (for example, a script that serves HTML and JSON) that calls Commerce APIs
with the B2C CLI or `@salesforce/b2c-tooling-sdk`. Both reuse the same B2C
configuration as this server (`dw.json`, environment variables), so no
credentials go into the page. Keep credentials server-side; the browser calls
only the local app. Find CLI and SDK guidance through `skill://index`. Run it only
where the user has terminal access, and tell them the start command and URL.

## Refreshed snapshot

Use this in Cowork when the page must live in the artifact panel:

1. Collect data with the MCP tools in the conversation. Bound each call: one
   `scapi_execute` per zone, site, or report keeps under the execution limit.
2. Save the query code and a build script with the user's project files so the
   snapshot can be regenerated without rediscovery.
3. Embed the results in the artifact as a data constant, with the collection
   time and source instance. Leave the artifact's MCP tool allowlist empty.
4. Create a Cowork scheduled task that reruns the collection and rebuilds the
   artifact at the cadence the user wants (for example, weekdays at 07:00).
5. Optionally add a **Refresh now** button that calls
   `await window.cowork.runScheduledTask(taskId)`. It needs a click and the user's
   confirmation, starts a new task, and does not update the open page. Do not add
   a reload button; the artifact header has one.

`window.cowork.askClaude` can summarize or explain the embedded data; it cannot
fetch new B2C data. Cowork artifacts have no persistent storage. claude.ai artifacts
have `window.storage`, useful for user notes or filters, not B2C credentials or
refreshed data.

## Page content

- Show when the data was collected and mark it stale after the expected refresh.
- Mask or truncate client IPs, emails, and other personal data unless the user
  asks for them.
- Embed only the aggregates the page needs, not raw API responses.
- Use libraries the artifact sandbox allows; it blocks other network requests.

Related: tool choice and the skill index `skill://mcp/b2c-mcp-server/SKILL.md`;
SCAPI execution `skill://mcp/b2c-mcp-scapi/SKILL.md`; analytics
`skill://mcp/b2c-mcp-cip/SKILL.md`.
