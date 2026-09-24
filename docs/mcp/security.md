---
description: Control MCP tool access, protect B2C Commerce credentials, and understand deployment, debugging, and data access.
---

# Security and Access

The MCP server runs on your computer and uses the access available to your local
user account. Connected tools use your configured B2C Commerce or Managed Runtime credentials.
Start with a sandbox and grant only the access needed for your work. Review
changes through your client's approval controls and use Safety Mode to restrict
supported operations.

## Review access and changes

Use your client's tool approval controls for operations you want to review.
Approval behavior varies by client. Approvals do not replace account permissions
or Safety Mode restrictions.
These controls apply within that client; your assistant may also have access to
other MCP servers or a terminal.

The default installation includes all toolsets, but connected operations still
require credentials. To limit the available tools, see
[advanced tool selection](./configuration#toolset-selection).

## Protect credentials and data

Use sandbox credentials for development and grant only the scopes needed by
the selected tools. Keep credential-bearing `dw.json` and `.env` files out of
version control and avoid placing secrets directly in shared MCP launch arguments.

Logs, debugger variables, and API responses can contain customer data, session
identifiers, or secrets. Once returned to your assistant, that data is subject
to the assistant provider's storage and data-use settings. Review those settings
before connecting sensitive environments, and review results before sharing them.

See [authentication setup](../guide/authentication) for API scopes and account
permissions.

## Deployments {#deployments}

Cartridge deployment writes to the selected code version. MRT publishing uploads
a bundle and can activate it in an environment. Confirm the project, instance, code version, and
MRT environment before requesting these operations.
Selected cartridge uploads overwrite matching files and preserve other files.
Code-version reload can briefly activate another version before activating the target.

## Instance files

File reads and transfers require WebDAV permissions for the requested directory,
using configured Business Manager credentials/access keys or OAuth WebDAV access.
Grant read access for log investigation and write access only where uploads are needed.
See [WebDAV permissions](../guide/authentication#webdav-access).

Remote uploads can replace files when explicitly requested. Downloads write a new
file on the machine running the MCP server; they do not overwrite an existing file.
The configured Safety Mode applies to remote WebDAV requests, including uploads.
Local download destinations use that machine's filesystem permissions.

## Debugger access {#debugger}

Debugging requires a Business Manager username/password or access key with
`WebDAV_Manage_Customization` permission. OAuth is not supported. Prefer a
development sandbox: breakpoints can pause application requests, and expression
evaluation can change application state.

If debugging leaves a request paused, ask your assistant to disconnect the debugger.
See [script debugging](../guide/script-debugger) for CLI and IDE alternatives.

## Safety settings

Use [Safety Mode](../guide/safety) to keep investigations read-only, block selected
actions, or require approval before changes. It uses the same settings as the CLI
and IDE Extension. Rules can make exceptions to the selected safety level, so
review both when checking what is allowed.

For [SCAPI Code Mode](./toolsets#scapi-code-mode) data tasks, your assistant can
show the target and proposed change for review before proceeding. Your assistant
app must support these approval prompts. If it cannot show one, the change is
blocked. Other B2C MCP tools currently block actions that require Safety Mode
approval. Permission to use a tool, which your app may request separately, does
not approve the specific change or override a block.

Declining stops the task; changes already made remain in place. You can also ask
your assistant to cancel a pending task. The B2C tools do not set a time limit
for your answer, but your assistant app may. Keep the session connected while
you decide.

Start with the [product approval example](../guide/safety.md#scapi-code-mode-example)
or [shared SCAPI policy](../guide/safety.md#global-scapi-confirmation). Some searches
use POST and need a rule to run under `READ_ONLY`; see the
[job search example](../guide/safety#allow-a-search-without-enabling-other-writes).

Use your existing `dw.json`, global safety configuration, or environment variables;
SCAPI Code Mode needs no separate safety setup. See
[how settings combine](../guide/safety#configuration-merge).

Safety Mode controls supported B2C requests. It does not restrict all local file
changes, debugger actions, or other tools your assistant can access. Use
[tool selection](./configuration#toolset-selection) if you only want to provide
documentation or skills.

## SCAPI code mode

SCAPI code mode can create, update, or delete B2C Commerce records using your
Account Manager credentials and granted API scopes. The configured
[Safety Mode policy](../guide/safety) applies to its Salesforce Commerce API requests.
Multi-step tasks can partially complete: review completed changes before
retrying a failed or interrupted task.

Code mode runs code written by your assistant on your computer, with limits on
file access and starting other programs. These limits do not provide complete
isolation. Safety Mode checks its supported API requests, not everything that
code could do.

Custom Admin APIs use the same safety policy. Grant `sfcc.scapi-schemas` to read
your instance's API definitions and the API's declared `c_*` scope to call it.
The `sfcc.custom-apis` scope lets you check whether an API is registered; calling
that API requires its own permissions.

Code mode can export Account Manager or SLAS access tokens when you need them
for a separate HTTP client. Normal SCAPI requests authenticate automatically;
no token export is needed. Configuring SLAS does not enable Shopper execution
through code mode.
Exported tokens are credentials and may appear in your assistant's conversation
history. Requests made by an external client are outside MCP Safety Mode.

Save or install only workflows you trust, and keep credentials out of their source.
Saved workflows use the credentials and safety policy of the project where you
run them.

## Analytics access {#cip}

CIP uses Account Manager client credentials with the **Salesforce Commerce API**
role and a tenant filter for the selected instance. It does not require a SCAPI
short code. Non-production analytics requires supported Reports & Dashboards
data tracking; see the [analytics configuration guide](../guide/analytics-reports-cip-ccac).

Reports and SQL can return business-sensitive data. Request only the sites,
dates, and fields needed, and review your assistant provider's data-use settings.

CIP uses POST even for analytics reads. `READ_ONLY` can therefore block report
execution and live table discovery. Where appropriate, configure an explicit
allow rule for POST requests to the selected CIP tenant path, such as `/abcd_prd`,
instead of permitting POST everywhere. The [Safety Mode guide](../guide/safety)
explains rule precedence and confirmation behavior.
