---
name: b2c-config
description: Inspect, configure, and troubleshoot the B2C CLI's setup, authentication, and instance connections. Use this skill as the **fallback whenever CLI setup, configuration, or authentication is unclear or failing** — including "command can't find my instance/credentials", auth errors (401/403, "client credentials required"), wrong sandbox being targeted, env var vs dw.json precedence, hostname mismatch warnings, missing tenantId/shortCode, OAuth scope errors, multi-instance switching, retrieving access tokens for scripts, and IDE integration. Also use when the user needs to check what `dw.json` looks like, what fields it accepts (camelCase or kebab-case keys), or where the CLI is reading config from. Triggers include "why is the CLI connecting to the wrong instance", "auth keeps failing", "what config does the CLI see", "I need an OAuth token", "my dw.json isn't being picked up", or any general "how do I configure the CLI" question.
persona: developer
category: Getting Started & Scaffolding
tags: [configuration, authentication, cli, onboarding, docs]
alsoFor: [operator]
---

# B2C Config Skill

The B2C CLI (`@salesforce/b2c-cli`) is a command-line tool for Salesforce B2C Commerce development. It provides commands organized by topic: `auth`, `code`, `webdav`, `sandbox`, `mrt`, `scapi`, `slas`, `ecdn`, `job`, `logs`, `sites`, `content`, `cip`, `setup`, and more. Use `b2c --help` or `b2c <topic> --help` for a full list.

> **Tip:** If `b2c` is not installed globally, use `npx @salesforce/b2c-cli` instead (e.g., `npx @salesforce/b2c-cli setup inspect`).

## How the CLI Discovers Configuration (read this first)

The CLI **automatically detects** instance hostname, credentials, tenant ID, MRT API key, and other settings from multiple sources. **You usually do not need to pass `--server`, `--client-id`, `--client-secret`, `--username`, `--password`, `--tenant-id`, `--short-code`, or `--api-key` as flags** — the CLI picks them up from the environment or config files.

Sources, in resolution order (highest priority first):

1. **CLI flags and environment variables** — explicit values always win. Includes `.env` files in the current project directory (auto-loaded).
2. **Plugin sources (high priority)** — custom configuration plugins (e.g., secret managers).
3. **`dw.json`** — searched starting at the current directory and walking up the directory tree. Supports a single instance or a `configs[]` array with `active: true` / `-i <name>` selection.
4. **`~/.mobify`** — home-directory file (MRT API key only).
5. **Plugin sources (low priority)**.
6. **`package.json`** under the `b2c` key — non-sensitive project defaults (e.g., `shortCode`, `clientId`, `mrtProject`). Sensitive fields like `clientSecret`/`password` are intentionally **not** allowed here.

When in doubt, **always run `b2c setup inspect` first** — it shows the resolved value and the source for every field. This is the single most useful command for setup confusion.

### `dw.json` Key Casing

Field names in `dw.json` accept **both camelCase and kebab-case** — they're equivalent. For example:

| Either form works |
|---|
| `clientId` ≡ `client-id` |
| `clientSecret` ≡ `client-secret` |
| `codeVersion` ≡ `code-version` |
| `tenantId` ≡ `tenant-id` |
| `shortCode` ≡ `short-code` ≡ `scapi-shortcode` |
| `webdavHostname` ≡ `webdav-hostname` ≡ `webdav-server` ≡ `secureHostname` |
| `certificatePassphrase` ≡ `certificate-passphrase` ≡ `passphrase` |

Legacy aliases like `server` (for `hostname`) are also still supported. If a value isn't being picked up, casing is rarely the cause — check spelling, then run `b2c setup inspect` to see what the CLI actually parsed.

For the full field reference, see the [Configuration guide](https://b2c-developer-tooling.dx.commercecloud.salesforce.com/guide/configuration.html) (or `docs/guide/configuration.md` in the repo).

## Authentication

Most commands that interact with a B2C Commerce instance require authentication. The CLI supports several methods:

- **Client credentials (API client):** Configure `clientId` and `clientSecret` in dw.json or environment variables. This is the default for automated/CI use.
- **Browser-based (implicit OAuth):** Use `--user-auth` on any OAuth-enabled command to authenticate interactively via the browser. This opens Account Manager in your default browser for login.
- **Basic auth:** Configure `username` and `password` for WebDAV operations.
- **Stateful sessions:** Use `b2c auth login` for persistent browser-based login sessions or `b2c auth client` for persistent client authentication. Later commands reuse the valid saved session when no other client is configured.

### `--user-auth` Flag

Many commands support `--user-auth` to use browser-based implicit OAuth instead of client credentials. This is useful when:

- You don't have a `clientSecret` configured
- You need user-level permissions (e.g., Account Manager admin roles)
- You're working interactively

```bash
# Interactive browser-based auth for any OAuth command
b2c sandbox list --user-auth
b2c scapi schemas list --user-auth
b2c auth token --user-auth
```

Coding agents can also use `--user-auth` — the browser flow works in any environment where a browser can be opened. The flag is exclusive with `--auth-methods`.

**Running behind a proxy:** If `localhost:8080` isn't reachable by the browser (e.g., running in a container or behind a reverse proxy), set `SFCC_REDIRECT_URI` to the proxy URL. The local OAuth server still listens on the default port (or `SFCC_OAUTH_LOCAL_PORT`), but the redirect URI sent to Account Manager will use your proxy URL. Add the proxy URL to the API client's redirect URLs in Account Manager.

## Tenant ID and Organization ID

B2C Commerce uses two related identifiers:

- **Tenant ID** — the short form (e.g., `zzxy_prd` or `zzxy-prd`)
- **Organization ID** — the SCAPI form with `f_ecom_` prefix (e.g., `f_ecom_zzxy_prd`)

The CLI automatically normalizes and translates between these formats. You can provide either form in configuration or flags — the CLI handles the conversion. It also extracts tenant IDs from hostnames (e.g., `zzxy-prd.dx.commercecloud.salesforce.com` resolves to `zzxy_prd`).

In dw.json or environment variables, use the `tenantId` config key. The CLI will add the `f_ecom_` prefix when making SCAPI calls.

## Inspecting Configuration

Use `b2c setup inspect` to view the resolved configuration and understand where each value comes from. Use `b2c setup instance` commands to manage named instance configurations.

> **Note:** `b2c setup config` works as an alias for `b2c setup inspect`.

### When to Use

Use `b2c setup inspect` when you need to:

- Verify which configuration file is being used
- Check if environment variables are being read correctly
- Debug authentication failures by confirming credentials are loaded
- Understand credential source priority (dw.json vs env vars vs plugins)
- Identify hostname mismatch protection issues
- Verify MRT API key is loaded from ~/.mobify

### View Current Configuration

```bash
# Display resolved configuration (sensitive values masked by default)
b2c setup inspect

# View configuration for a specific instance from dw.json
b2c setup inspect -i staging

# View configuration with a specific config file
b2c setup inspect --config /path/to/dw.json
```

### Debug Sensitive Values

```bash
# Show actual passwords, secrets, and API keys (use with caution)
b2c setup inspect --unmask
```

### JSON Output for Scripting

```bash
# Output as JSON for parsing in scripts
b2c setup inspect --json

# Pretty-print with jq
b2c setup inspect --json | jq '.config'

# Check which sources are loaded
b2c setup inspect --json | jq '.sources'
```

## IDE Integration

Use `b2c setup ide` to configure IDE tooling that consumes the resolved CLI configuration and to enable Script API IntelliSense.

```bash
# Vendor Script API TypeScript definitions + jsconfig.json (plain VS Code, WebStorm, etc.)
b2c setup ide vscode-types

# Print the TS Server plugin path for LSP-based editors (Neovim, Helix, Zed, ...)
b2c setup ide tsserver-plugin --json
```

The B2C DX VS Code extension needs no setup — it injects the same TypeScript Server plugin at runtime.

## Managing Instances

### List Configured Instances

```bash
# Show all instances from dw.json
b2c setup instance list

# Output as JSON
b2c setup instance list --json
```

### Create a New Instance

```bash
# Interactive mode - prompts for all values
b2c setup instance create staging

# With hostname
b2c setup instance create staging --hostname staging.example.com

# Create and set as active
b2c setup instance create staging --hostname staging.example.com --active

# Non-interactive mode (for scripts)
b2c setup instance create staging \
  --hostname staging.example.com \
  --username admin \
  --password secret \
  --force
```

### Switch Active Instance

```bash
# Set staging as the default instance
b2c setup instance set-active staging

# Now commands use staging by default
b2c code list  # Uses staging
```

### Remove an Instance

```bash
# Remove with confirmation prompt
b2c setup instance remove staging

# Remove without confirmation
b2c setup instance remove staging --force
```

## Understanding the Output

The `setup inspect` command displays configuration organized by category:

- **Instance**: hostname, webdavHostname (if set), codeVersion
- **Authentication (Basic)**: username, password (for WebDAV)
- **Authentication (OAuth)**: clientId, clientSecret, scopes, authMethods, accountManagerHost (if set), sandboxApiHost (if set)
- **TLS/mTLS**: certificate, certificatePassphrase, selfSigned (only shown when configured)
- **SCAPI**: shortCode, tenantId
- **Managed Runtime (MRT)**: mrtProject, mrtEnvironment, mrtApiKey, mrtOrigin (if set)
- **Metadata**: instanceName (from multi-instance configs)
- **Sources**: List of all configuration sources that were loaded

Each value shows its source in brackets:

- `[DwJsonSource]` — Value from dw.json file
- `[EnvSource]` — Value from an SFCC_* environment variable
- `[MobifySource]` — Value from ~/.mobify file
- `[PackageJsonSource]` — Value from package.json `b2c` key
- Plugin-provided source names (e.g., a credential plugin)

## Configuration Priority

Values are resolved with this priority (highest to lowest):

1. CLI flags and environment variables
2. Plugin sources (high priority)
3. dw.json file
4. ~/.mobify file (MRT API key only)
5. Plugin sources (low priority)
6. package.json `b2c` key

When troubleshooting, check the source column to understand which configuration is taking precedence.

## Troubleshooting

**Always start with `b2c setup inspect`** — it shows resolved values and their sources. Add `--unmask` to see full secrets, `--json` for scripting. If a value isn't where you expect, the source column will tell you which file/env var/plugin won.

### Command says "credentials required" or "client-id is required"

- The CLI is not finding `clientId`/`clientSecret`. Run `b2c setup inspect` and check the OAuth section.
- Confirm `dw.json` exists in the current directory or a parent (the CLI walks up from `cwd`).
- Confirm `SFCC_CLIENT_ID`/`SFCC_CLIENT_SECRET` env vars are exported in *this* shell, not just defined elsewhere.
- Credential groups are **atomic**: if `clientId` comes from one source and `clientSecret` from a lower-priority one, the lower-priority secret is discarded. Provide both from the same source, or use a higher-priority override.

### Command targets the wrong instance

- `b2c setup inspect` will show the resolved hostname and its source.
- For multi-instance `dw.json`, the `active: true` config is used by default. Override with `-i <name>` per-command, or change the default with `b2c setup instance set-active <name>`.
- `SFCC_SERVER` (or any env var) overrides `dw.json`. Unset it if you want `dw.json` to win.
- **Hostname mismatch protection:** if you pass `--server` (or `SFCC_SERVER`) that differs from the `dw.json` hostname, the CLI ignores **all** other values from `dw.json` to prevent mixing credentials across instances. Either match the hostname or pass full credentials explicitly.

### `dw.json` is not being picked up

- Check the `Sources` block from `b2c setup inspect` — if `DwJsonSource` isn't listed, the file wasn't found.
- The CLI searches from the current working directory upward. Run from your project root, set `SFCC_PROJECT_DIRECTORY`, or pass `--config /path/to/dw.json`.
- Ensure the file is valid JSON (a parse error silently skips it).
- Field name casing doesn't matter — both `clientId` and `client-id` work. See "dw.json Key Casing" above.

### 401/403 errors on SCAPI/OCAPI calls

- Confirm the resolved `clientId`/`clientSecret` belong to the *target* instance (Account Manager scopes the API client per tenant).
- Check OAuth scopes: required scopes vary by command (e.g., `sfcc.cdn-zones`, `sfcc.orders`). Pass `--auth-scope` or set `SFCC_OAUTH_SCOPES`.
- For SCAPI commands, verify `tenantId` is correct — tenant IDs use underscores (`zzxy_001`), hostnames use hyphens (`zzxy-001`). The CLI normalizes between them, but a wrong tenant ID will produce 403s.

### Missing `tenantId` / `shortCode`

- These resolve from `dw.json`, `SFCC_TENANT_ID`/`SFCC_SHORTCODE`, or `package.json`. Run `b2c setup inspect` to see which source provided them.
- For sandboxes, `tenantId` is derived from the hostname (replace `-` with `_`): `zzxy-001.dx...` → `zzxy_001`.

### MRT commands say "API key required"

- `MRT_API_KEY` (or `SFCC_MRT_API_KEY`) env var, or `~/.mobify` file (`{ "api_key": "..." }`).
- When using `--cloud-origin <host>`, the CLI looks for `~/.mobify--<host>` instead of plain `~/.mobify`.

### Sensitive values masked in `setup inspect`

- By default secrets show as `admi...REDACTED`. Add `--unmask` to see full values when debugging.

### Missing values

- If a field shows `-`, no source provided it. Check spelling in `dw.json`, env var presence, and plugin output. Remember: `clientSecret`, `password`, and `mrtApiKey` cannot be set via `package.json` — use `dw.json` or env vars.

### Wrong source taking precedence

- Review the priority list in "How the CLI Discovers Configuration" above. Common surprise: env vars (or a `.env` file) override `dw.json`.

### Still stuck

Compare two outputs:

```bash
b2c setup inspect --unmask --json > expected.json   # in a known-good shell
# ... run the failing command in the broken shell, then:
b2c setup inspect --unmask --json > actual.json
diff expected.json actual.json
```

The diff usually points directly at the missing or overridden field.

## Getting Admin OAuth Tokens

Use `b2c auth token` to get an admin OAuth access token for Account Manager credentials (OCAPI and Admin APIs). This is useful for testing APIs, scripting, or CI/CD pipelines.

```bash
# Get access token (outputs raw token to stdout)
b2c auth token

# Get token with browser-based auth
b2c auth token --user-auth

# Get token with specific scopes (accepts multiple: repeat --auth-scope or comma-separate)
b2c auth token --auth-scope sfcc.orders --auth-scope sfcc.products
b2c auth token --auth-scope "sfcc.orders,sfcc.products"

# Get token as JSON (includes expiration and scopes)
b2c auth token --json

# Use in curl for OCAPI calls
curl -H "Authorization: Bearer $(b2c auth token)" \
  "https://your-instance.dx.commercecloud.salesforce.com/s/-/dw/data/v24_1/sites"
```

The token is obtained using the `clientId` and `clientSecret` from your configuration (dw.json or environment variables). If only `clientId` is configured, or `--user-auth` is used, an implicit OAuth flow is used (browser-based).

**Note:** This command returns **admin** tokens for OCAPI/Admin APIs. For **shopper** tokens (SLAS), see the [b2c-slas skill](../b2c-slas/SKILL.md).

> **Calling SCAPI Admin APIs (system or custom)?** The token must carry the tenant scope `SALESFORCE_COMMERCE_API:<tenant_id>` **plus** the API-specific scopes. `b2c auth token` does not add the tenant scope for you (unlike the SCAPI subcommands such as `b2c scapi custom status`), so pass it explicitly:
>
> ```bash
> b2c auth token \
>   --auth-scope "SALESFORCE_COMMERCE_API:zzpq_013" \
>   --auth-scope sfcc.orders --auth-scope sfcc.products.rw
> ```
>
> See the `b2c:b2c-scapi-admin` and `b2c:b2c-custom-api-development` skills for details.

## More Commands

See `b2c setup --help` for other setup commands including `b2c setup skills` for AI agent skill installation.
