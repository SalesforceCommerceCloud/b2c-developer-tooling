---
description: Control MCP tool access, protect B2C Commerce credentials, and understand deployment, debugging, and data access.
---

# Security and Access

The MCP server runs locally with the permissions of the process that starts it.
Connected tools use your configured B2C Commerce or Managed Runtime credentials.
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

The shared [Safety Mode settings](../guide/safety) can restrict supported HTTP
operations. Review the complete policy: explicit allow rules can override a
safety level. These settings do not provide a universal restriction on local
file writes or every debugger action.

For a skills-only or documentation-only assistant, select those tools
explicitly. Do not treat `READ_ONLY` as a complete MCP sandbox. SCAPI code mode
supports Safety Mode confirmation in clients with form elicitation. Review the
target and request details before approving. Other MCP tools and clients without
form elicitation stop at confirmation-required requests.

Declining or cancelling an approval stops the entire code-mode execution.
Unanswered approvals have no server deadline, and waiting does not consume the
execution runtime budget. Clients may impose their own timeout. Pending approvals
occupy one of four execution slots until answered, cancelled, or the server
disconnects or shuts down. Earlier changes are not rolled back. You can ask your
assistant to cancel an execution using the ID shown in its approval prompt.

For SCAPI code mode, the selected project's `.env` can set `SFCC_SAFETY_LEVEL`, `SFCC_SAFETY_CONFIRM`,
and `SFCC_SAFETY_CONFIG`. Launch environment values take precedence over `.env`.
Relative safety-file paths resolve from the selected project. The effective level
is the most restrictive of environment, global file, and instance settings;
explicit rules still take precedence over the level.

`READ_ONLY` uses HTTP methods, so it also blocks searches that use POST. See
[allow a search without enabling other writes](../guide/safety#allow-a-search-without-enabling-other-writes)
for a job-investigation example. An assistant's tool approval does not satisfy
a Safety Mode confirmation or override a block.

## SCAPI code mode

SCAPI code mode can create, update, or delete B2C Commerce records using your
Account Manager credentials and granted API scopes. The configured
[Safety Mode policy](../guide/safety) applies to its Salesforce Commerce API requests.
Multi-step tasks can partially complete: review completed changes before
retrying a failed or interrupted task.

Code mode runs generated JavaScript locally with restrictions on file and process
access. It is not a security sandbox or network isolation; Safety Mode governs
Salesforce Commerce API requests, not arbitrary JavaScript.

Custom Admin APIs use the same safety policy. Grant `sfcc.scapi-schemas` for live
contract discovery and the endpoint's declared `c_*` scope for execution. The
`sfcc.custom-apis` scope grants registration visibility, not access to custom
business logic.

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
