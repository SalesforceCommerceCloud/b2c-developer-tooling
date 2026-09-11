---
description: B2C Commerce MCP tool names, capabilities, and required access.
---

# MCP Tools

Use B2C Commerce documentation, deployment, debugging, and API tools from your
assistant. The [plugin installation](./installation) includes all toolsets;
connected capabilities use the credentials you [configure](./configuration).

These tables list tool names for reference and for your client's tool controls.
Optional [toolset customization](./configuration#toolset-selection) is covered
at the end of this page.

## Skills and documentation {#documentation}

Available in every toolset. No B2C Commerce credentials required; some documentation
is retrieved online.

| Tool                 | Capability                                                                   |
| -------------------- | ---------------------------------------------------------------------------- |
| `skills_read`        | Browse, search, and read B2C Commerce, CLI, Storefront Next, and MCP skills. |
| `docs_search`        | Find platform references, guides, Salesforce Help, and tooling docs.         |
| `docs_read`          | Read a documentation article.                                                |
| `docs_list`          | Browse documentation categories and titles.                                  |
| `docs_schema_search` | Find XML import/export schemas.                                              |
| `docs_schema_read`   | Read an XML schema.                                                          |
| `docs_schema_list`   | List available XML schemas.                                                  |

The B2C Commerce, CLI, and Storefront Next skills come from our
[agent skills plugins](../guide/agent-skills) and are included with the MCP.
No need to install those skills plugins separately.
See [documentation topic settings](./configuration#documentation-tools-restriction)
to customize documentation coverage.

> Find the Script API reference for the method used here and explain its behavior
> in this cartridge.

## Deployment {#cartridges}

| Tool               | Capability                                                      | Toolsets                   |
| ------------------ | --------------------------------------------------------------- | -------------------------- |
| `cartridge_deploy` | Deploy selected cartridges; optionally reload the code version. | CARTRIDGES                 |
| `mrt_bundle_push`  | Publish a pre-built storefront bundle; optionally deploy it.    | MRT, PWAV3, STOREFRONTNEXT |

Cartridges require WebDAV write access; code-version reload also requires OCAPI
access. Check [deployment permissions](./security#deployments) before connecting.

### Managed Runtime {#mrt}

Bundle publishing requires an [MRT API key and project](./configuration#mrt-credentials),
plus an environment when deploying.

## Debugging {#diagnostics}

Available in DIAGNOSTICS, CARTRIDGES, and SCAPI. Requires a Business Manager user
or access key with `WebDAV_Manage_Customization`; OAuth is unsupported.

| Tool                          | Capability                                                   |
| ----------------------------- | ------------------------------------------------------------ |
| `debug_start_session`         | Connect the debugger and map local cartridge sources.        |
| `debug_end_session`           | Disconnect and release the debugger slot.                    |
| `debug_list_sessions`         | Find active sessions, breakpoints, and paused threads.       |
| `debug_set_breakpoints`       | Set or clear breakpoints.                                    |
| `debug_wait_for_stop`         | Wait for execution to pause.                                 |
| `debug_control`               | Continue execution or step into, over, or out of a function. |
| `debug_inspect`               | Inspect stacks, frame variables, and object members.         |
| `debug_evaluate`              | Evaluate JavaScript in a paused frame.                       |
| `debug_capture_at_breakpoint` | Capture debugger state at a selected line.                   |

Breakpoints pause requests; evaluation can change application state. Use a
sandbox and end sessions when finished. See [debugger access](./security#debugger).

> This request fails in my sandbox. Inspect the relevant cartridge code and
> capture the variables at the failing line.

## Logs {#logs}

| Tool                  | Capability                                   | Toolsets                           |
| --------------------- | -------------------------------------------- | ---------------------------------- |
| `logs_list_files`     | Browse instance log files.                   | DIAGNOSTICS, CARTRIDGES, SCAPI     |
| `logs_get_recent`     | Read and filter recent instance logs.        | DIAGNOSTICS, CARTRIDGES, SCAPI     |
| `logs_watch`          | Start, list, or stop instance log watches.   | DIAGNOSTICS, CARTRIDGES, SCAPI     |
| `logs_watch_poll`     | Retrieve entries from an instance log watch. | DIAGNOSTICS, CARTRIDGES, SCAPI     |
| `mrt_logs_watch`      | Start, list, or stop live MRT log streams.   | DIAGNOSTICS, PWAV3, STOREFRONTNEXT |
| `mrt_logs_watch_poll` | Retrieve entries from an MRT log stream.     | DIAGNOSTICS, PWAV3, STOREFRONTNEXT |

Instance logs require WebDAV log-read access. MRT logs require an API key,
project, and environment; historical MRT logs are not available. Logs may
contain sensitive data; see [data handling](./security#protect-credentials-and-data).

> Watch my sandbox error logs while I reproduce this issue. Summarize new errors
> and include the timestamps.

## SCAPI development {#scapi}

Available in SCAPI, PWAV3, and STOREFRONTNEXT. Requires OAuth, the instance short
code, and tenant ID. See [authentication and scopes](../guide/authentication#configuring-scopes).

| Tool                           | Capability                                       | OAuth scope          |
| ------------------------------ | ------------------------------------------------ | -------------------- |
| `scapi_schemas_list`           | Browse and read standard and custom API schemas. | `sfcc.scapi-schemas` |
| `scapi_custom_apis_get_status` | Check custom endpoint registration.              | `sfcc.custom-apis`   |

### B2C Commerce data and operations {#scapi-code-mode}

**Explore nearly 600 Salesforce Commerce API operations and work with your instance's data.**

Explore products, catalogs, orders, customers, inventory, pricing, and more.
SCAPI code mode lets your assistant combine API requests to answer a question or
complete a task. You describe the outcome; it handles the calls and returns a
focused result. The reference covers 594 Admin and Shopper operations across 57
versioned APIs and works offline without B2C Commerce credentials.

Available in SCAPI, PWAV3, and STOREFRONTNEXT.

| Tool                 | Capability                                                                             |
| -------------------- | -------------------------------------------------------------------------------------- |
| `scapi_search`       | Search bundled Admin and Shopper contracts by authentication; no credentials required. |
| `scapi_execute`      | Compose Admin API requests, including creating, updating, and deleting records.        |
| `scapi_snippet_save` | Save a completed workflow for reuse when requested.                                    |

Execution uses the selected project's OAuth credentials, short code, and tenant ID.
Grant the scopes needed for your task; creating products requires `sfcc.products.rw`.
Code mode executes standard and custom Admin JSON requests; Shopper execution is not yet
supported. Binary file uploads and downloads are not supported.

Tenant custom attributes are supported. Access to your instance's custom-property
definitions requires the `sfcc.scapi-schemas` scope; these definitions are not
part of the offline API reference.

Custom Admin APIs are available through live schema discovery. Grant
`sfcc.scapi-schemas` for discovery and the custom API's declared `c_*` scope for
execution. Custom APIs using Shopper authentication are not yet supported.

You can also request Account Manager or SLAS tokens for a separate HTTP client.
Normal Admin requests authenticate automatically; token export is optional.
See [code mode access](./security#scapi-code-mode).

> Create an offline test product in my catalog, check that its ID is unused,
> and verify the saved product.

Code mode includes reusable workflows for failed-job triage, campaign/promotion
inspection, and basic product creation with an optional name, offline setting
(offline by default), and storefront catalog category assignment. Assignment
requires Catalogs API access, including `sfcc.catalogs.rw`.

> Show failed job executions from the past week. Summarize the first three
> failures and tell me whether there are more to investigate.

> Summarize the promotions attached to this campaign, including enabled status
> and schedules.

After reviewing a useful run, ask your assistant to save a parameterized version
for future use. Saved workflows remain available after restarting the MCP. They
use the credentials and safety policy of the project selected for each run.
See [workflow storage](./configuration#saved-workflows).

### Observability metrics (closed beta) {#metrics}

`metrics_get` reads B2C Commerce metrics. Available in SCAPI; requires tenant access
to the Metrics API closed beta and OAuth scope `sfcc.metrics`.

## Configuration inspection

| Tool             | Capability                                                               | Toolsets    |
| ---------------- | ------------------------------------------------------------------------ | ----------- |
| `config_inspect` | Check resolved configuration and targets; secrets are masked by default. | DIAGNOSTICS |

## Toolsets for customization

| Toolset          | Capabilities                                                 |
| ---------------- | ------------------------------------------------------------ |
| `CARTRIDGES`     | Cartridge deployment and instance diagnostics.               |
| `DIAGNOSTICS`    | Debugging, instance/MRT logs, and configuration inspection.  |
| `MRT`            | Managed Runtime bundle publishing and deployment.            |
| `PWAV3`          | Shared MRT and SCAPI tools for PWA Kit projects.             |
| `SCAPI`          | API development, instance diagnostics, and optional metrics. |
| `STOREFRONTNEXT` | Shared MRT and SCAPI tools for Storefront Next projects.     |

Skills and documentation are included in every toolset. Shared tools appear once.
