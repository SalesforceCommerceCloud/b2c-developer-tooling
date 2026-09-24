---
description: Choose which B2C Commerce actions are allowed, need approval, or are blocked across the CLI, IDE Extension, and AI assistants.
---

# Safety Mode

Safety Mode helps you control changes to B2C Commerce from the CLI, the IDE
Extension, and your AI assistant through MCP. Keep investigations read-only,
restrict automated scripts, or ask for approval before selected changes.
Choose settings for each instance or share a policy across your projects.

All three use the same safety configuration format. Approval prompts are
available for [supported actions](#confirmation-mode).
**Safety Mode is off by default** (`NONE`). It adds controls alongside your
B2C Commerce permissions; it does not grant access you do not already have.

## Start with an instance policy {#quick-start}

Add a `safety` object to an existing instance in `dw.json`. In a plain `dw.json`,
it sits alongside fields such as `hostname` and your credentials. Named
configurations are optional; if you use a `configs` array, add `safety` to the
[relevant entry](#per-instance-configuration). Keep your existing connection and
credential fields unchanged. For example, this `safety` section blocks DELETE
requests:

```json
{
  "safety": {
    "level": "NO_DELETE"
  }
}
```

This still allows creating and updating records. For an investigation where you
want to restrict writes, choose `READ_ONLY` instead. See
[Configuration](./configuration) for single-instance files, named instances, and
shared defaults.

## Choose a safety level {#safety-levels}

Choose a starting level, then add rules for exceptions. These settings
apply across supported B2C operations, including catalog data, code deployment,
jobs, and sandbox management.

| Level       | Default behavior                                              | Useful for                                                  |
| ----------- | ------------------------------------------------------------- | ----------------------------------------------------------- |
| `NONE`      | No level-based restrictions; explicit rules still apply.       | Confirm or block only the operations you select with rules. |
| `NO_DELETE` | Blocks DELETE; POST, PUT, and PATCH remain allowed.            | Allow writes while blocking DELETE requests.               |
| `READ_ONLY` | Blocks POST, PUT, PATCH, and DELETE.                           | Inspect data, then allow or approve selected changes.      |

For "ask before changes, block deletes," start with the
[shared SCAPI approval example](#global-scapi-confirmation). It uses `READ_ONLY`
with rules for the changes you want to review.

The method names describe API requests: GET usually reads data, PUT and PATCH
change it, POST can start tasks or run searches, and DELETE usually removes data.
Safety Mode checks these methods, so a POST search also needs an
[exception under `READ_ONLY`](#allow-a-search-without-enabling-other-writes).
Likewise, `NO_DELETE` does not block data removal performed through another method.

::: details Existing configurations using NO_UPDATE

`NO_UPDATE` is a legacy setting that does not prevent all updates.
It blocks DELETE and POST requests whose paths contain `/reset`, `/stop`,
`/restart`, or `/operations`; PUT, PATCH, and other POST requests remain allowed.
For new configurations, use one of the levels above with rules for your needs.

:::

## Use it in your tools

### CLI

For a terminal session:

```bash
export SFCC_SAFETY_LEVEL=READ_ONLY
b2c code list
```

The listing is allowed; a request to activate or delete a code version is blocked.
The environment setting also applies to subsequent B2C commands launched from
that terminal. Use the instance's `safety` configuration when you want different
policies for different targets.

To review a particular command before it starts, add a command rule to the
[`safety` section in `dw.json`](#quick-start):

```json
{
  "safety": {
    "rules": [{"command": "code:deploy", "action": "confirm"}]
  }
}
```

An interactive `b2c code deploy` asks for confirmation. With piped input or in
CI, it is blocked because nobody can answer the prompt. Approving the command
does not override other safety rules that apply to its actions.

### MCP and AI assistants {#mcp}

You can ask your assistant to investigate data without changing it, or require
your approval before selected changes. Add the
[safety settings to the `dw.json`](#quick-start) your assistant uses; this works
with both plugin and manual installation.

With `READ_ONLY`, [SCAPI Code Mode](../mcp/toolsets.md#scapi-code-mode) can inspect
products, catalogs, and other data through GET requests, while requests to create,
update, or delete records are blocked. A POST-based search needs an explicit
exception, as shown below.

<ExamplePrompt>

> Which products in my New Arrivals category are offline?

</ExamplePrompt>

For data tasks handled by SCAPI Code Mode, your assistant can ask you to review
each change that needs approval. Check the target and proposed change, then
approve to continue or decline to stop. See the
[product creation example](#scapi-code-mode-example).

Your assistant app must support approval prompts from connected tools. If it
cannot show the prompt, the change is blocked. Other B2C MCP tools currently
block actions that require Safety Mode approval. Your app may also ask permission
to use a tool; that separate permission does not approve the specific change.

SCAPI Code Mode uses the same safety settings from `dw.json`, global safety
configuration, and environment variables. No separate code mode setup is needed.
See [how settings combine](#configuration-merge).

### IDE extension: VS Code and compatible editors {#ide-extension}

The Salesforce B2C Commerce IDE Extension applies the safety policy for its
selected instance. Add the [`safety` object to its `dw.json`](#quick-start);
there is no separate safety-level setting to configure in VS Code Settings.
Switching the selected instance refreshes the policy with the connection.

For example, block sandbox deletion from the extension and ask before stopping
one:

```json
{
  "safety": {
    "rules": [
      {"command": "b2c-dx.sandbox.delete", "action": "block"},
      {"command": "b2c-dx.sandbox.stop", "action": "confirm"}
    ]
  }
}
```

Choosing **Delete** in the Sandbox Explorer shows a safety-policy error and does
not run the command. Choosing **Stop** shows a modal warning with **Proceed**;
dismissing it cancels the action. Ordinary action confirmations may still appear.
Other safety rules still apply after you approve a command.

The extension also supports approval for sandbox deletion, reset, and start/stop
actions. If an action needs approval but has no approval dialog, it stops with
an error.

CLI and extension command names differ. A `code:deploy` rule applies to the CLI;
it does not select an IDE command or MCP tool. See
[extension configuration](../vscode-extension/configuration#selecting-an-instance)
for selecting the intended instance.

## Add rules for specific tasks {#safety-rules}

Rules are checked in order. **The first matching rule wins.**

| Action    | Result                                                                        |
| --------- | ----------------------------------------------------------------------------- |
| `allow`   | Allows the matching action, even if the safety level would block it. |
| `block`   | Blocks the matching action. Approval cannot override this rule.    |
| `confirm` | Asks for approval. If the tool cannot ask, the action is blocked.  |

An `allow` rule does not override an earlier matching `block`. If no rule matches,
the safety level determines the result.

### Allow a search without enabling other writes

For job investigation through SCAPI code mode, add this policy to the instance:

```json
{
  "safety": {
    "level": "READ_ONLY",
    "rules": [
      {
        "method": "POST",
        "path": "/operation/jobs/v1/organizations/*/job-execution-search",
        "action": "allow"
      }
    ]
  }
}
```

This allows searching job history while keeping job starts and other POST
requests blocked. When adding an exception, use the request path shown in the
error message.

### Approve product changes with your assistant {#scapi-code-mode-example}

[SCAPI Code Mode](../mcp/toolsets.md#scapi-code-mode) can create a product, assign
it to a storefront category, and verify both changes in one task. Use this
instance policy to review product creation or replacement and category
assignments across all products. For a broader shared policy, see
[approve SCAPI changes across instances](#global-scapi-confirmation).

**Instance policy (`dw.json`):** Add this
[`safety` section to your `dw.json`](#quick-start), keeping its existing connection
and credential fields.

```json
{
  "safety": {
    "level": "READ_ONLY",
    "rules": [
      {
        "method": "PUT",
        "path": "/product/products/v1/organizations/*/products/*",
        "action": "confirm"
      },
      {
        "method": "PUT",
        "path": "/product/catalogs/v1/organizations/*/catalogs/*/categories/*/products/*",
        "action": "confirm"
      }
    ]
  }
}
```

The rules apply to every product ID and catalog/category assignment. Reading
products does not prompt for approval; other changes remain blocked by
`READ_ONLY`. These rules work without adding `confirm: true`.

Use your own catalog and category names in this example:

<ExamplePrompt>

> Create an offline test product in my master catalog and add it to the
> New Arrivals category in my storefront catalog.

</ExamplePrompt>

Expect one approval prompt to create the product and another to assign it to
the category. Each prompt shows the target organization, action, and a short
preview of the data being sent. Checking whether the product exists and
verifying the result do not need approval.

Approve to continue or decline to stop the task. If you decline the category
assignment after approving product creation, the product remains. The B2C tools
do not set a time limit for your answer, but your assistant app may. Keep the
session connected while you decide.

### Approve SCAPI changes across instances {#global-scapi-confirmation}

Use one shared policy to review SCAPI changes across your instances. This
example asks before PUT, POST, and PATCH requests, allows GET requests without
prompting, and blocks DELETE. Save it as your global `safety.json`:

```json
{
  "level": "READ_ONLY",
  "rules": [
    {
      "method": "PUT",
      "path": "/*/*/*/organizations/*/**",
      "action": "confirm"
    },
    {
      "method": "POST",
      "path": "/*/*/*/organizations/*/**",
      "action": "confirm"
    },
    {
      "method": "PATCH",
      "path": "/*/*/*/organizations/*/**",
      "action": "confirm"
    }
  ]
}
```

The `*` patterns cover SCAPI organization paths across APIs, versions, and
organizations, including products, catalogs, jobs, and custom APIs. POST searches
also ask for approval. `READ_ONLY` blocks DELETE and changes outside these paths.

Use this with [SCAPI Code Mode](../mcp/toolsets.md#scapi-code-mode) and an assistant
app that supports approval prompts. If the tool or app cannot ask for approval,
it blocks the action.

Save the file in your [B2C configuration directory](#global-safety-config), or
select it in the environment that launches your CLI or MCP server:

```bash
export SFCC_SAFETY_CONFIG=/path/to/safety.json
```

Unlike `dw.json`, this file has no outer `safety` key. To use it for just one
instance, place the policy under that instance's `safety` key in `dw.json` instead.
Instance rules take priority over global rules, so an instance-specific `allow`
rule can still permit deletion. Review [how settings combine](#configuration-merge)
if you use both files.

Run `b2c setup inspect` to see the settings in use and where they came from.
Add `--verbose` to see all rules in order. `SafetyFile` in the source column
refers to the global file whose path appears in Sources.

### Rule matchers

Each example below is one rule in the `rules` array. For HTTP requests, `path`
matches the part of the URL after the hostname, without query parameters.

- **HTTP requests:** Ask before PUT requests to the SCAPI Products API.
  Both fields must match; omit either `method` or `path` to match on the other alone:

  ```json
  {
    "method": "PUT",
    "path": "/product/products/**",
    "action": "confirm"
  }
  ```

- **Jobs:** Match a job ID in SCAPI or OCAPI job execution requests:

  ```json
  {
    "job": "sfcc-site-archive-import",
    "action": "block"
  }
  ```

- **CLI commands:** Use colons between command words. For example, ask before deploying:

  ```json
  {
    "command": "code:deploy",
    "action": "confirm"
  }
  ```

- **IDE commands:** Use the command ID for a supported extension action:

  ```json
  {
    "command": "b2c-dx.sandbox.delete",
    "action": "block"
  }
  ```

Patterns support wildcards: `*` matches within a path segment; `**` can span
multiple segments.

## Require confirmation {#confirmation-mode}

Use a `confirm` rule when you want to approve a specific action. To ask for
approval for everything your chosen safety level normally blocks, set
`confirm: true`. For example, this changes `NO_DELETE` from blocking DELETE
requests to asking for approval where the tool supports it:

```json
{
  "safety": {
    "level": "NO_DELETE",
    "confirm": true
  }
}
```

An explicit `block` rule still blocks the action. Requests already allowed by
the safety level do not need approval.

| Where you work                                                                          | What happens                                                                                                                              |
| --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| CLI in a terminal                            | Command rules ask in the terminal. Individual API requests can also ask where supported; otherwise the action is blocked. |
| IDE Extension                                | Supported commands and sandbox actions show a **Proceed** dialog. Actions that need approval but have no dialog are blocked. |
| Assistant data tasks through SCAPI Code Mode  | Asks before each action that needs approval. Your assistant app must support these prompts; otherwise the action is blocked. |
| Other B2C MCP tools                          | Actions that require Safety Mode approval are currently blocked. |
| Automated scripts and CI without user input  | Actions that require approval are blocked because nobody can answer the prompt. |

For assistant tasks, approving one change does not approve later changes.
Declining stops the task, but does not undo changes already made.

`SFCC_SAFETY_CONFIRM=true` or `1` has the same effect as `confirm: true`. If any
configuration source enables it, setting it to `false` elsewhere does not turn
it off. See [how settings combine](#configuration-merge).

## Use different policies per instance {#per-instance-configuration}

Add safety settings to the corresponding entries in your existing `configs`
array. This abbreviated example omits credentials:

```json
{
  "configs": [
    {
      "name": "sandbox",
      "active": true,
      "hostname": "abcd-001.dx.commercecloud.salesforce.com",
      "safety": {"level": "NONE"}
    },
    {
      "name": "production",
      "hostname": "production-eu01-example.demandware.net",
      "safety": {"level": "READ_ONLY"}
    }
  ]
}
```

Confirm the target before requesting a change. CLI `-i production`, your
assistant's selected target, and the IDE's instance picker can each select a
different instance. A stricter environment or global level still applies.

## Global safety configuration {#global-safety-config}

The CLI and MCP look for `safety.json` in their B2C configuration directory:

| Platform      | Default location                 |
| ------------- | -------------------------------- |
| macOS / Linux | `~/.config/b2c/safety.json`      |
| Windows       | `%LOCALAPPDATA%\b2c\safety.json` |

`B2C_CONFIG_DIR` or `XDG_CONFIG_HOME` overrides the base directory, in that order;
the file is then `<base>/b2c/safety.json`.

Use `SFCC_SAFETY_CONFIG` to select an explicit file, including when sharing it
with the IDE extension. The extension currently needs this explicit path to
load a separate safety file; an instance's `dw.json` safety settings need no such
setting.

```bash
export SFCC_SAFETY_CONFIG=/path/to/safety.json
```

Set it in the environment used to launch the tool. For the IDE, restart the
editor after changing its launch environment. For the MCP, restart the server
connection. The file contains the safety object directly:

```json
{
  "level": "NO_DELETE",
  "rules": [
    {"command": "sandbox:delete", "action": "block"},
    {"command": "b2c-dx.sandbox.delete", "action": "block"}
  ]
}
```

### How settings combine {#configuration-merge}

- **Safety level:** the strictest level from your instance, global file, or
  environment variables applies.
- **Approval for blocked requests:** if any source sets `confirm: true`, requests
  blocked by the level can ask for approval. Explicit `block` rules still block.
- **Rules:** instance rules are checked before global rules. The first match
  decides the outcome, so an instance rule can make an exception to a global rule.
- **No matching rule:** the safety level decides whether the request can proceed.

For example, an instance's `NONE` level cannot lower a global `READ_ONLY` level.
An instance's explicit `allow` rule can still permit a particular request.
If another source enables `confirm: true`, DELETE requests blocked by `READ_ONLY`
can ask for approval too. Use an explicit `{"method":"DELETE","action":"block"}`
rule when DELETE must stay blocked even with that setting enabled.

## When an operation is blocked

Check the selected instance, the reason in the error, and the applicable rule
or level. If the operation is intended, adjust the narrowest relevant rule;
changing a broad level may permit more than the current task needs.

For multi-step work, a later blocked request does not undo earlier successful
changes. Review what completed before retrying a job, deployment, or API workflow.

Safety Mode controls supported B2C operations. It is not a general restriction on
an assistant's other tools or local activity. Keep account permissions, credential
handling, and assistant approvals aligned with your intended access. See
[MCP Security and Access](../mcp/security) for those controls.

## Environment variables reference

| Variable              | Purpose                                           |
| --------------------- | ------------------------------------------------- |
| `SFCC_SAFETY_LEVEL`   | `NONE`, `NO_DELETE`, `NO_UPDATE`, or `READ_ONLY`. |
| `SFCC_SAFETY_CONFIRM` | `true` or `1` enables confirmation mode.          |
| `SFCC_SAFETY_CONFIG`  | Path to the shared safety JSON file.              |
