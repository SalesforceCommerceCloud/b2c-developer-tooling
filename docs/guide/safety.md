---
description: Control B2C Commerce changes from the CLI, MCP, and IDE extension with safety levels, confirmations, and per-instance rules.
---

# Safety Mode

Safety Mode helps prevent unwanted B2C Commerce changes when you deploy code,
manage sandboxes, run jobs, or work with data through your assistant. Choose a
policy for each instance, add exceptions for specific tasks, and decide which
operations should be blocked or require confirmation.

The CLI, MCP, and IDE extension use the same safety configuration format.
**Safety Mode is off by default** (`NONE`). It adds controls alongside your
B2C Commerce permissions; it does not grant access you do not already have.

## Start with an instance policy {#quick-start}

Add a `safety` object to an existing instance in `dw.json`. Keep its connection
and credential fields unchanged. For example, start with a policy that blocks
DELETE requests:

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

Levels restrict supported operations by their HTTP method and, for some actions,
the request path. Rules can make specific exceptions.

| Level       | Default behavior                                                                                                                | Useful for                                                           |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `NONE`      | No level-based restrictions; explicit rules still apply.                                                                        | A sandbox where you want only selected actions blocked or confirmed. |
| `NO_DELETE` | Blocks DELETE requests. Creates and updates remain allowed.                                                                     | Routine work where deletion needs a separate decision.               |
| `NO_UPDATE` | Blocks DELETE and POST requests to reset, stop, restart, and sandbox operation paths. Other creates and updates remain allowed. | Restricting instance lifecycle actions as well as deletion.          |
| `READ_ONLY` | Blocks POST, PUT, PATCH, and DELETE requests.                                                                                   | Inspecting data with write requests restricted.                      |

**`NO_UPDATE` does not block every update.** Use `READ_ONLY` when that is your
intent. Because these checks use HTTP methods, `READ_ONLY` also blocks searches
that use POST. You can [allow a specific search](#allow-a-search-without-enabling-other-writes)
without permitting other POST requests.

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
instance's safety policy:

```json
{
  "safety": {
    "rules": [{"command": "code:deploy", "action": "confirm"}]
  }
}
```

An interactive `b2c code deploy` asks for confirmation. With piped input or in
CI, it is blocked because there is no interactive confirmation. An approval for
the command does not override separate request-level restrictions.

### MCP and AI assistants {#mcp}

Put the policy on the instance your assistant will use. This works with both
plugin and manual MCP installation; no custom launch flags are needed for an
instance policy.

With `READ_ONLY`, SCAPI code mode can inspect products, catalogs, and other data
through GET requests, while requests to create, update, or delete records are
blocked. A POST-based search needs an explicit exception, as shown below.

<ExamplePrompt>

> Review the products in this category and identify any that are offline. Report your findings without changing products. If the configured policy blocks a request, explain which part of the review could not be completed.

</ExamplePrompt>

MCP requests that require Safety Mode confirmation are **blocked**. Your
assistant's tool approval dialog is a separate control: approving a tool there
does not satisfy a Safety Mode `confirm` rule. For a permitted recurring task,
configure a narrow `allow` rule after reviewing the operation.

For a manual server launch, you can also set `SFCC_SAFETY_LEVEL` in the client's
MCP server environment. SCAPI code mode reads safety settings from the selected
project's `.env`; launch environment values take precedence over `.env` values.
See [MCP Security and Access](../mcp/security#safety-settings) for details.

### IDE extension: VS Code and compatible editors {#ide-extension}

The Salesforce B2C Commerce IDE Extension applies the safety policy for its
selected instance. Add the `safety` object to that instance's `dw.json` entry;
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
Other request-level restrictions remain in effect after a command is approved.

The extension also supports Safety Mode confirmation for sandbox delete, reset,
and lifecycle requests. Actions without a confirmation dialog stop with an error
when confirmation is required. Do not assume every blocked request will offer
an override button.

CLI and extension command names differ. A `code:deploy` rule applies to the CLI;
it does not select an IDE command or MCP tool. See
[extension configuration](../vscode-extension/configuration#selecting-an-instance)
for selecting the intended instance.

## Add rules for specific tasks {#safety-rules}

Rules are checked in order. **The first matching rule wins.**

| Action    | Result                                                                        |
| --------- | ----------------------------------------------------------------------------- |
| `allow`   | Permits the matching operation even when the level would block it.            |
| `block`   | Refuses the operation, including when confirmation mode is enabled.           |
| `confirm` | Requires a supported interactive confirmation; otherwise the operation stops. |

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

This permits the job execution search endpoint. Starting jobs and other POST
requests remain blocked unless another rule allows them. Check the path reported
by a blocked request before adding an exception; use the full request pathname,
not a documentation label or tool name.

### Rule matchers

Choose one matcher family per rule:

| Matcher                 | Example                                                | Applies to                                                                     |
| ----------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------ |
| HTTP method and/or path | `{"method":"DELETE","action":"block"}`                 | Supported HTTP requests across the tools.                                      |
| Job ID                  | `{"job":"sfcc-site-archive-import","action":"block"}`  | Job checks that carry an ID, including OCAPI `/jobs/{id}/executions` requests. |
| CLI command ID          | `{"command":"code:deploy","action":"confirm"}`         | CLI commands; use colons between command words.                                |
| IDE command ID          | `{"command":"b2c-dx.sandbox.delete","action":"block"}` | Extension commands that support Safety Mode.                                   |

Patterns support wildcards: `*` matches within a path segment; `**` can span
segments. Method and path must both match when both are supplied. A rule for an
OCAPI URL does not automatically match its SCAPI equivalent. For SCAPI job APIs
whose URLs do not contain the job ID, use a method/path rule rather than assuming
a job-name rule will match.

## Require confirmation {#confirmation-mode}

Set `confirm: true` to request confirmation for operations that the **level**
would otherwise block:

```json
{
  "safety": {
    "level": "NO_DELETE",
    "confirm": true
  }
}
```

This does not turn explicit `block` rules into confirmation prompts, and it does
not prompt for operations the level already allows. For one specific action,
prefer a `confirm` rule.

| Where you work                            | What happens                                                                                                                         |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Interactive CLI                           | Command rules prompt in the terminal. Request-level confirmations are available where the command supports them; otherwise it stops. |
| IDE extension                             | Command rules and supported sandbox operations show a modal **Proceed** dialog. Other confirmation-required requests stop.           |
| MCP, CI, or CLI without interactive input | Confirmation-required operations are blocked.                                                                                        |

`SFCC_SAFETY_CONFIRM=true` or `1` also enables confirmation mode. Review the
[combined policy](#configuration-merge): setting it to `false` in one place does
not disable confirmation enabled by another source.

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

## Share a safety file {#global-safety-config}

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

- **Level:** the most restrictive environment, instance, or global level wins.
- **Confirmation:** enabled if any of those sources enables it.
- **Rules:** instance rules are checked before global rules; the first matching
  rule wins. An instance rule can therefore make an exception to a global rule.
- **No matching rule:** the level applies, with confirmation mode where enabled.

For example, an instance's `NONE` level cannot lower a global `READ_ONLY` level.
An instance's explicit `allow` rule can still permit a particular request.

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

## SDK usage

Custom tooling can use `SafetyGuard` and `createSafetyMiddleware` to apply these
policies, and `withSafetyConfirmation` to provide a confirmation interface.
SDK consumers must connect safety checks to their operations; importing a client
does not automatically apply a policy. See the [SDK reference](../api/).
