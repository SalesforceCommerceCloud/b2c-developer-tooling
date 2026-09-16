---
description: Configure B2C Commerce connections for the CLI, MCP, and IDE extension, including SLAS credentials, named instances, and shared project defaults.
---

# Configuration

The B2C CLI, B2C MCP, and IDE Extension share connection settings. If you already use a `dw.json` or project `.env`, you can reuse it across all three. Configure the credentials needed for your tasks; documentation search and included skills need no B2C Commerce connection.

For help obtaining credentials and assigning access, see [Authentication](./authentication). For settings specific to your assistant or editor, see [MCP Configuration](/mcp/configuration) or [IDE Extension Configuration](/vscode-extension/configuration).

## Choose Your Connection

| Task                                                 | What to configure                                                                                                                                                   |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Manage code versions, jobs, sites, or Admin API data | Account Manager `client-id` and `client-secret` (or JWT credentials). For SCAPI, add `short-code` and `tenant-id`; instance operations can also need `hostname`.    |
| Upload cartridges, browse files, or read logs        | `hostname` plus `username` and `password` (a WebDAV access key), or [OAuth WebDAV access](./authentication#option-b-oauth-based-webdav-api-client-access).          |
| Obtain shopper tokens                                | `short-code`, `tenant-id`, `slas-client-id`, and `site-id`. Add `slas-client-secret` for a private SLAS client.                                                     |
| Work with Managed Runtime                            | An MRT API key and project/environment defaults. Supported SCAPI MRT operations can use Account Manager credentials instead. See [MRT configuration](#mrt-api-key). |
| Analyze sales, searches, or performance with CIP     | Account Manager `client-id`, `client-secret`, and `tenant-id`, plus [CIP access](./analytics-reports-cip-ccac#authentication-and-access).                           |
| Manage sandboxes, SLAS clients, or Account Manager   | These CLI commands support browser sign-in with a built-in public client. Your user still needs the appropriate roles and tenant access.                            |

Account Manager and SLAS clients serve different purposes. `client-id` / `client-secret` are for administrative access; `slas-client-id` / `slas-client-secret` are for shopper authentication. Configuring one does not configure the other.

## Configuration File

Save a `dw.json` in your project directory, or use [interactive setup](#managing-instances-with-the-cli). Examples use placeholder credentials: replace them with values for your instance.

### Single Instance

This example supports Admin APIs and WebDAV on a sandbox:

```json
{
  "hostname": "abcd-001.dx.commercecloud.salesforce.com",
  "short-code": "kv7kzm78",
  "tenant-id": "abcd_001",
  "client-id": "your-account-manager-client-id",
  "client-secret": "your-account-manager-client-secret",
  "username": "username@example.com",
  "password": "your-webdav-access-key",
  "code-version": "version1"
}
```

Use your instance's short code and an existing code version. `tenant-id` accepts both the tenant form (`abcd_001`) and organization form (`f_ecom_abcd_001`). Staging and production tenants typically use `abcd_stg` and `abcd_prd`.

::: warning Keep credentials out of version control
Add `dw.json` and `.env` to `.gitignore`. These files store secrets as plain text. For encrypted credential storage, see the [macOS Keychain](./third-party-plugins#macos-keychain-plugin) and [Password Store](./third-party-plugins#password-store-plugin) plugins. Non-secret project defaults can go in [package.json](#project-configuration-package-json).
:::

### Shopper Authentication (SLAS)

Add these fields to the same instance entry when you need shopper tokens:

```json
{
  "short-code": "kv7kzm78",
  "tenant-id": "abcd_001",
  "slas-client-id": "your-slas-client-id",
  "site-id": "RefArch"
}
```

For a private client, also set `"slas-client-secret": "your-slas-client-secret"`. Omit the secret for a public client. The site must be allowed by that SLAS client's channel configuration, and the client needs scopes for the intended Shopper APIs. See [Salesforce SLAS setup](https://developer.salesforce.com/docs/commerce/commerce-api/guide/slas.html) and [SLAS token commands](/cli/slas#b2c-slas-token).

The IDE Extension's [API Browser](/vscode-extension/configuration#api-browser-setup) also uses these SLAS settings when you try requests in Shopper API families.

### Multiple Instances

Use a `configs` array and give each entry a name. Each entry contains its own connection settings; root-level fields are not shared defaults for the entries.

```json
{
  "configs": [
    {
      "name": "sandbox",
      "active": true,
      "hostname": "abcd-001.dx.commercecloud.salesforce.com",
      "short-code": "kv7kzm78",
      "tenant-id": "abcd_001",
      "client-id": "your-sandbox-client-id",
      "client-secret": "your-sandbox-client-secret",
      "username": "username@example.com",
      "password": "your-webdav-access-key",
      "code-version": "version1"
    },
    {
      "name": "dev",
      "hostname": "dev.example.com",
      "short-code": "kv7kzm78",
      "tenant-id": "abcd_dev",
      "client-id": "your-dev-client-id",
      "client-secret": "your-dev-client-secret"
    }
  ]
}
```

Here, `sandbox` is the default. The `dev` entry uses OAuth only; WebDAV access requires the corresponding API client permissions. Each entry can also define [Safety Mode](./safety#per-instance-configuration) restrictions.

Select an instance for one CLI command:

```bash
b2c code list -i dev
```

With the MCP, include the instance name in your request. In the IDE Extension, use the [instance picker](/vscode-extension/configuration#selecting-an-instance); its selection applies to that workspace.

### Managing Instances with the CLI

<span id="quick-setup"></span>
<span id="switching-instances"></span>
<span id="listing-and-removing"></span>

Create or maintain entries without editing JSON:

```bash
# Interactive connection setup
b2c setup instance create sandbox

# List configured instances
b2c setup instance list

# Change the shared default
b2c setup instance set-active sandbox

# Remove a saved connection (does not delete the B2C Commerce instance)
b2c setup instance remove dev
```

Interactive creation can detect the active code version using the configured SCAPI/OCAPI backend when OAuth credentials are available. The first instance you create is set active automatically. See [Setup Commands](/cli/setup) for non-interactive options and all flags.

### Configuration File Selection

The CLI uses its current directory as the project directory unless you pass `--project-directory` or set `SFCC_PROJECT_DIRECTORY`. It reads that directory's `.env`, `dw.json`, and `package.json`; it does not search parent directories for these files. Your assistant can select the relevant project for each task, and the IDE Extension has its own [project selection](/vscode-extension/configuration#how-the-extension-chooses-a-project).

The primary `dw.json` path is selected in this order:

1. An explicit path, such as CLI `--config`.
2. `SFCC_CONFIG` from the process environment.
3. `SFCC_CONFIG` from the project's `.env`.
4. `dw.json` in the project directory.

A relative `SFCC_CONFIG` in `.env` is resolved from that project directory. The [global file](#global-default-configuration), when configured, also supplies available instances.

```bash
# Use another project directory
b2c setup inspect --project-directory /path/to/storefront

# Use an explicit connection file and named instance
b2c setup inspect --config /path/to/connections.json -i sandbox
```

### Global Default Configuration

To reuse one connection file across projects:

```bash
b2c setup default-config set /path/to/dw.json
b2c setup default-config get
```

The primary and global files supply one list of available instances:

| Selection                                | Behavior                                                                                                                        |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| An instance name is specified            | Look in the primary file first, then the global file. A same-name primary entry takes precedence.                               |
| No instance name is specified            | Use the primary file's active entry or root configuration. Otherwise, use the global file's active entry or root configuration. |
| Both files have settings for an instance | Select one complete entry; fields are not merged between the files.                                                             |

Within each file, an active entry in `configs` takes precedence over the root configuration. A root configuration is an implicit default unless it has `"active": false`. If you use only a `configs` array, mark one entry active or select it by name.

Instance-management commands use these same files. Creation writes to the primary file when present, otherwise the global file; removal and changing the default update the file that owns the entry. Use `b2c setup inspect` to check which file supplies your selected connection.

To stop using the global file:

```bash
b2c setup default-config unset
```

This setting is shared by the CLI, MCP, and IDE Extension. Use these commands to manage it; you do not need to edit the toolkit's settings file.

## Environment Variables

Use the environment variable names in the [settings reference](#supported-fields) for shell sessions, CI, or an assistant's MCP server environment. Explicit CLI flags take priority over environment variables; process variables take priority over a project `.env`.

### .env File

The equivalent of the single-instance example is:

```bash
# .env
SFCC_SERVER=abcd-001.dx.commercecloud.salesforce.com
SFCC_SHORTCODE=kv7kzm78
SFCC_TENANT_ID=abcd_001
SFCC_CLIENT_ID=your-account-manager-client-id
SFCC_CLIENT_SECRET=your-account-manager-client-secret
SFCC_USERNAME=username@example.com
SFCC_PASSWORD=your-webdav-access-key
SFCC_CODE_VERSION=version1

# Optional shopper authentication
SFCC_SLAS_CLIENT_ID=your-slas-client-id
SFCC_SITE_ID=RefArch
# Private SLAS clients only:
# SFCC_SLAS_CLIENT_SECRET=your-slas-client-secret
```

You do not need both file formats. Environment values override the selected `dw.json` entry, so keep instance-specific variables out of a shared shell environment if you regularly switch between named instances.

### Storefront Next Compatibility

When you run the toolkit from a Storefront Next project, its existing environment variables can supply the equivalent B2C Commerce settings. Toolkit-specific variables remain the preferred names and take priority when both forms are set.

| Storefront Next variable                     | `dw.json` field      | Preferred toolkit environment variable |
| -------------------------------------------- | -------------------- | -------------------------------------- |
| `PUBLIC__app__commerce__api__clientId`       | `slas-client-id`     | `SFCC_SLAS_CLIENT_ID`                  |
| `PUBLIC__app__commerce__api__organizationId` | `tenant-id`          | `SFCC_TENANT_ID`                       |
| `PUBLIC__app__commerce__api__shortCode`      | `short-code`         | `SFCC_SHORTCODE`                       |
| `COMMERCE_API_SLAS_SECRET`                   | `slas-client-secret` | `SFCC_SLAS_CLIENT_SECRET`              |
| `PUBLIC__app__defaultSiteId`                 | `site-id`            | `SFCC_SITE_ID`                         |
| `MRT_PROJECT`                                | `mrt-project`        | `MRT_PROJECT`                          |
| `MRT_TARGET`                                 | `mrt-environment`    | `MRT_ENVIRONMENT`                      |

Storefront Next commonly uses the full organization ID, such as `f_ecom_bjgk_005`. The toolkit normalizes it to the tenant form `bjgk_005` internally and restores the `f_ecom_` prefix for SCAPI requests. `MRT_PROJECT` and `MRT_TARGET` are already native toolkit aliases for the Managed Runtime project and environment.

## Check Your Configuration {#debugging-configuration}

For the CLI, inspect the selected connection and the source of each value:

```bash
b2c setup inspect
b2c setup inspect -i sandbox
b2c setup inspect --json
```

Secrets are masked by default, including in JSON output. `--unmask` reveals them; use it only when needed and do not share that output. Inspection does not verify remote permissions. See [setup inspect](/cli/setup#b2c-setup-inspect) for details.

With the MCP, ask your assistant:

<ExamplePrompt>

> Check the configuration for my sandbox instance without revealing secrets. Tell me what's missing for Admin API access and reading logs.

</ExamplePrompt>

### Resolution Priority

With the built-in configuration sources, values take priority in this order:

1. Explicit overrides, such as CLI flags.
2. Process environment variables.
3. The selected project's `.env`.
4. The selected `dw.json` entry.
5. `~/.mobify` for an MRT API key.
6. `package.json` project defaults.

Installed configuration plugins can supply values before or after the file sources. See [configuration plugins](./third-party-plugins) for available integrations or [Extending the CLI](./extending#custom-configuration-sources) for custom sources. Inspection shows which source supplied each value.

### Credential Grouping

File and plugin sources keep these credential pairs together: Account Manager client ID/secret, SLAS client ID/secret, and WebDAV username/password. Once a higher-priority source supplies either member of a pair, a lower-priority source cannot fill in the other. Keep each pair in the same source.

Explicit overrides can replace individual fields. If an override changes the Account Manager or SLAS client ID, the stored secret for the old ID is discarded. Supply the matching secret, or choose an authentication flow that does not require one.

::: warning Changing the hostname
If a server override differs from the configured hostname, the lower-priority connection settings are ignored to avoid reusing another instance's credentials. Select a named instance instead, or provide the complete connection for the new server. Environment variables can also trigger this protection.
:::

## Settings Reference {#supported-fields}

`dw.json` accepts camelCase and kebab-case: `slasClientId` and `slas-client-id` are equivalent. Use one spelling per field. The tables pair each JSON field with its environment variable, where available. JSON field names use kebab-case consistently.

Settings apply to the features that use them. CLI flags and environment overrides can be command-specific; use `b2c <command> --help` for that command's options.

### Instance and Site

| Field / environment variable              | Purpose                                                                                     |
| ----------------------------------------- | ------------------------------------------------------------------------------------------- |
| `hostname`<br>`SFCC_SERVER`               | Instance hostname, without a URL path. Also accepts `server` in JSON.                       |
| `webdav-hostname`<br>`SFCC_WEBDAV_SERVER` | Separate WebDAV hostname. JSON aliases: `webdav-server`, `secureHostname`, `secure-server`. |
| `code-version`<br>`SFCC_CODE_VERSION`     | Default code version for operations that accept one.                                        |
| `short-code`<br>`SFCC_SHORTCODE`          | SCAPI short code. JSON also accepts `scapi-shortcode`.                                      |
| `tenant-id`<br>`SFCC_TENANT_ID`           | Tenant or organization ID, such as `abcd_001` or `f_ecom_abcd_001`.                         |
| `site-id`<br>`SFCC_SITE_ID`               | Default site/channel ID for supported site and shopper operations.                          |
| `name`                                    | Connection name for instance selection.                                                     |
| `active`                                  | Boolean: use this entry as the default.                                                     |
| `configs`                                 | Root-level array of named instance entries.                                                 |
| `api-backend`<br>`SFCC_API_BACKEND`       | `auto` (default), `scapi`, or `ocapi`, for operations supporting both backends.             |

`auto` uses SCAPI when the required coordinates and supported authentication are available, with OCAPI fallback for supported rejection cases. Otherwise it selects OCAPI directly. See [API backend selection](/cli/code#api-backend) and [OCAPI access](./authentication#ocapi-configuration).

### Administrative Authentication {#oauth-scapi-ocapi}

<span id="client-credentials"></span>
<span id="jwt-bearer"></span>
<span id="user-authentication-browser"></span>

| Field / environment variable                          | Purpose                                                                                                                          |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `client-id`<br>`SFCC_CLIENT_ID`                       | Account Manager API client ID.                                                                                                   |
| `client-secret`<br>`SFCC_CLIENT_SECRET`               | Account Manager client secret.                                                                                                   |
| `oauth-scopes`<br>`SFCC_OAUTH_SCOPES`                 | Requested OAuth scopes: a JSON string array or comma-separated environment value. Scope grants must be configured on the client. |
| `jwt-cert-path`<br>`SFCC_JWT_CERT`                    | PEM certificate path for JWT authentication. CLI flag: `--jwt-cert`.                                                             |
| `jwt-key-path`<br>`SFCC_JWT_KEY`                      | PEM private key path. CLI flag: `--jwt-key`.                                                                                     |
| `jwt-passphrase`<br>`SFCC_JWT_PASSPHRASE`             | Passphrase for an encrypted private key.                                                                                         |
| `auth-methods`<br>`SFCC_AUTH_METHODS`                 | Ordered JSON array or comma-separated environment value; see [authentication methods](#overriding-authentication-behavior).      |
| `user-auth`                                           | Boolean shorthand for `"auth-methods": ["user"]`. Do not set both fields. CLI flag: `--user-auth`.                               |
| `account-manager-host`<br>`SFCC_ACCOUNT_MANAGER_HOST` | Account Manager hostname override.                                                                                               |

For certificate setup, see [JWT Authentication](./authentication#jwt-authentication-certificate-based). When sharing configuration across projects or processes, absolute certificate paths avoid ambiguity about the working directory.

### Shopper Authentication

| Field / environment variable                      | Purpose                                                                                                                |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `slas-client-id`<br>`SFCC_SLAS_CLIENT_ID`         | Shopper Login and API Access Service client ID. Also selects an existing client in supported SLAS management commands. |
| `slas-client-secret`<br>`SFCC_SLAS_CLIENT_SECRET` | Secret for a private SLAS client; omit for public clients.                                                             |

Shopper authentication also uses `short-code`, `tenant-id`, and `site-id` from [Instance and Site](#instance-and-site).

### WebDAV and Certificates {#basic-authentication-webdav}

| Field / environment variable                              | Purpose                                                                                                                                                           |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `username`<br>`SFCC_USERNAME`                             | Business Manager username, typically an email address.                                                                                                            |
| `password`<br>`SFCC_PASSWORD`                             | WebDAV access key. See [Configure WebDAV File Access](https://help.salesforce.com/s/articleView?id=cc.b2c_account_manager_sso_use_webdav_file_access.htm&type=5). |
| `certificate`<br>`SFCC_CERTIFICATE`                       | PKCS12 (`.p12` / `.pfx`) client certificate for mTLS.                                                                                                             |
| `certificate-passphrase`<br>`SFCC_CERTIFICATE_PASSPHRASE` | Client certificate passphrase. JSON alias: `passphrase`; CLI flag: `--passphrase`.                                                                                |
| `self-signed`<br>`SFCC_SELFSIGNED`                        | Disable server certificate verification. Default is `false`; this is not required just because you use mTLS. JSON alias: `selfsigned`; CLI flag: `--selfsigned`.  |

### Code, Content, and Documentation

| Field / environment variable                      | Purpose                                                                                                                                                          |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cartridges`<br>`SFCC_CARTRIDGES`                 | Cartridge names for deployment/watch filtering and IDE discovery. JSON array or colon/comma-separated JSON string; explicit CLI cartridge filters take priority. |
| `auto-upload`                                     | Boolean controlling automatic code upload in the IDE Extension.                                                                                                  |
| `content-library`                                 | Default library for content list/export.                                                                                                                         |
| `catalogs`<br>`SFCC_CATALOGS`                     | Catalog IDs for WebDAV browsing.                                                                                                                                 |
| `libraries`<br>`SFCC_LIBRARIES`                   | Library IDs. JSON accepts strings or `{ "id": "RefArch", "siteLibrary": true }` entries; see [content libraries](#content-libraries-example).                    |
| `asset-query`<br>`SFCC_ASSET_QUERY`               | JSON dot-paths for finding static asset URLs in content; default `["image.path"]`.                                                                               |
| `import-set-exclude`<br>`SFCC_IMPORT_SET_EXCLUDE` | Project-relative directories to exclude recursively from import-set discovery.                                                                                   |
| `docs-categories`<br>`SFCC_DOCS_CATEGORIES`       | Documentation category allowlist for supported searches.                                                                                                         |

Use JSON arrays for list fields unless another format is noted. Environment list values are comma-separated; `SFCC_LIBRARIES` accepts IDs, not the JSON object form.

### Sandboxes and Analytics

| Field / environment variable                  | Purpose                                                                                                                                        |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `realm`                                       | Default realm for sandbox operations.                                                                                                          |
| `sandbox-api-host`<br>`SFCC_SANDBOX_API_HOST` | On-Demand Sandbox API hostname override.                                                                                                       |
| `cip-host`<br>`SFCC_CIP_HOST`                 | CIP analytics host override.                                                                                                                   |
| `SFCC_CIP_STAGING`                            | Use the staging CIP host when `true` or `1`. Without an explicit host, production tenants (`*_prd`) use production; other tenants use staging. |
| `safety`<br>See [Safety Mode](./safety)       | Per-instance restrictions and confirmation rules.                                                                                              |

CIP requires client credentials and analytics access for the tenant; it does not use SLAS credentials, JWT, or browser login. See [Analytics and Reports](./analytics-reports-cip-ccac) for production/staging availability and setup. `cip-staging` is not a `dw.json` field, and setting `SFCC_CIP_STAGING=false` does not force a non-production tenant onto the production host.

### Managed Runtime

| Field / environment variable           | Purpose                                                          |
| -------------------------------------- | ---------------------------------------------------------------- |
| `mrt-api-key`<br>`MRT_API_KEY`         | Managed Runtime API key.                                         |
| `mrt-project`<br>`MRT_PROJECT`         | Project slug; storefront ID for SCAPI MRT operations.            |
| `mrt-environment`<br>`MRT_ENVIRONMENT` | Target environment name.                                         |
| `mrt-origin`<br>`MRT_CLOUD_ORIGIN`     | MRT API origin override. JSON also accepts `cloudOrigin`.        |
| `mrt-backend`<br>`MRT_BACKEND`         | `auto` (default), `legacy`, or `scapi` for supported operations. |

The `SFCC_`-prefixed forms of these variables are also supported, with the unprefixed names taking priority. `MRT_TARGET` is another environment-name alias. MRT CLI commands also accept `MRT_STOREFRONT` / `SFCC_MRT_STOREFRONT` for the project. See [MRT backends](/cli/mrt#mrt-backends) for supported operations.

### Other Environment Settings

These are not `dw.json` fields:

| Variable                     | Purpose                                                                                                         |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `SFCC_PROJECT_DIRECTORY`     | Project directory used for configuration lookup.                                                                |
| `SFCC_CONFIG`                | Path to the primary connection file in `dw.json` format.                                                        |
| `SFCC_INSTANCE`              | Named instance to select.                                                                                       |
| `MRT_CREDENTIALS_FILE`       | MRT CLI override for the `~/.mobify` credentials file.                                                          |
| `SFCC_REDIRECT_URI`          | Account Manager browser-login redirect URI override.                                                            |
| `SFCC_OAUTH_LOCAL_PORT`      | Browser-login redirect server port; default `8080`.                                                             |
| `SFCC_DISABLE_PKCE_FALLBACK` | Set to `1` to disable the transitional [PKCE-to-implicit fallback](./authentication#implicit-flow-deprecation). |
| `SFCC_SAFETY_LEVEL`          | `NONE`, `NO_DELETE`, `NO_UPDATE`, or `READ_ONLY`.                                                               |
| `SFCC_SAFETY_CONFIRM`        | Set to `true` or `1` to enable supported safety confirmations.                                                  |
| `SFCC_SAFETY_CONFIG`         | Path to a shared safety configuration file.                                                                     |

See [Safety Mode](./safety) for precedence and behavior across the CLI, MCP, and IDE Extension. MCP tool selection, documentation topics, and startup logging are covered in [MCP Configuration](/mcp/configuration).

## Project Configuration (package.json)

Store non-secret defaults shared by your team under `package.json`'s `b2c` key:

```json
{
  "name": "my-storefront",
  "b2c": {
    "shortCode": "kv7kzm78",
    "siteId": "RefArch",
    "contentLibrary": "RefArch",
    "libraries": [{"id": "RefArch", "siteLibrary": true}],
    "importSetExclude": ["fixtures", "test/integration"],
    "mrtProject": "my-storefront"
  }
}
```

### Allowed Fields

Only these fields are read from `package.json` (camelCase and kebab-case are accepted):

| Group                 | Fields                                                          |
| --------------------- | --------------------------------------------------------------- |
| API and site defaults | `shortCode`, `clientId`, `siteId`                               |
| Content and imports   | `contentLibrary`, `libraries`, `assetQuery`, `importSetExclude` |
| Managed Runtime       | `mrtProject`, `mrtOrigin`                                       |
| Platform defaults     | `accountManagerHost`, `sandboxApiHost`, `realm`                 |

Other fields, including credentials and instance-specific fields such as `hostname`, `tenantId`, and SLAS client settings, are ignored. Use `dw.json`, environment variables, or a credential plugin for those. `package.json` supplies defaults only when a higher-priority source has not supplied the value.

### Content Libraries Example

A bare library ID denotes a shared library. An object with `siteLibrary: true` denotes a site-private library, whose ID is the site ID:

```json
{
  "b2c": {
    "libraries": ["RefArchSharedLibrary", {"id": "RefArch", "siteLibrary": true}]
  }
}
```

The IDE Extension can show both libraries. `b2c content list --library RefArch` selects the site-private library automatically; `--site-library` or `--no-site-library` can override that choice.

## CLI Flags

For a one-off override, use the command's flags. Flag names do not always match JSON fields: `hostname` uses `--server`, for example.

```bash
b2c code list -i sandbox --api-backend scapi
```

Use `b2c <command> --help` for available flags, or the [CLI Reference](/cli/). For credentials, a project configuration or credential store usually avoids repeating secrets in shell commands.

## Overriding Authentication Behavior

For OAuth, the usual credential selection order is client credentials, JWT, then browser-based user authentication. Existing CLI login sessions can also be reused; see [Auth Commands](/cli/auth). This is credential selection, not a promise to retry a rejected request with every method.

### Available Auth Methods

| Value                | Use                                                                                                                               |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `client-credentials` | Account Manager client ID and secret; supported by SCAPI Admin, OCAPI, and OAuth WebDAV. Required for CIP.                        |
| `jwt`                | Account Manager client ID and PEM certificate/private key; supported by SCAPI Admin, OCAPI, and OAuth WebDAV.                     |
| `user`               | Browser-based Authorization Code + PKCE. Supported by applicable platform commands, OCAPI, and WebDAV; not SCAPI Admin execution. |
| `implicit`           | Deprecated browser flow; explicit opt-in. See [PKCE migration](./authentication#implicit-flow-deprecation).                       |
| `basic`              | WebDAV username and access key; not an OAuth method.                                                                              |
| `api-key`            | MRT API key; not an OAuth method.                                                                                                 |

### Specifying Auth Methods

```json
{
  "auth-methods": ["client-credentials", "jwt"]
}
```

The equivalent environment value is `SFCC_AUTH_METHODS=client-credentials,jwt`; CLI flags accept `--auth-methods client-credentials,jwt` or repeated `--auth-methods` flags. Supported methods depend on the operation. These settings do not select SLAS shopper token flows.

For browser login only, use `"user-auth": true` or CLI `--user-auth`. Do not combine it with `auth-methods`. See [Authentication](./authentication) for client registration and access requirements.

## MRT API Key

MRT Cloud API operations use an API key. For supported SCAPI MRT operations, configure Account Manager credentials, short code, and tenant ID instead; see [MRT backends](/cli/mrt#mrt-backends).

Without custom configuration plugins, MRT API key precedence is:

1. CLI `--api-key`.
2. `MRT_API_KEY` (or `SFCC_MRT_API_KEY`), including project `.env` values.
3. `mrt-api-key` in the selected `dw.json` entry.
4. `api_key` in `~/.mobify`.

```json
{
  "api_key": "your-mrt-api-key"
}
```

MRT CLI `--credentials-file` (or `MRT_CREDENTIALS_FILE`) selects an alternative credentials file. With `--cloud-origin https://custom.example.com`, the default file becomes `~/.mobify--custom.example.com`. See [Get an MRT API key](./authentication#getting-an-mrt-api-key) for setup.

## Two-Factor Authentication (mTLS)

For WebDAV endpoints that require a client certificate, add the certificate settings to the connection:

```json
{
  "hostname": "staging.example.demandware.net",
  "webdav-hostname": "cert.staging.example.demandware.net",
  "username": "username@example.com",
  "password": "your-webdav-access-key",
  "certificate": "/path/to/client-cert.p12",
  "certificate-passphrase": "your-certificate-passphrase"
}
```

Use a PKCS12 certificate (`.p12` or `.pfx`). Client certificate authentication and server certificate verification are separate: keep verification enabled unless you deliberately need to accept an untrusted server certificate. `self-signed: true` disables that verification; it is not a normal requirement for staging or mTLS.

For certificate handling in CI, see [Staging Environments (Two-Factor mTLS)](/guide/ci-cd#staging-environments-two-factor-mtls).

## Troubleshooting

| Symptom                                            | What to check                                                                                                                             |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| The wrong instance or old credentials are selected | Inspect the resolved connection. Shell variables and `.env` override `dw.json`; a same-name project entry overrides a global entry.       |
| Changing `--server` makes credentials disappear    | Hostname mismatch protection discarded the previous connection. Select the intended named instance or supply its complete settings.       |
| A client ID is present but its secret is missing   | Check credential-source grouping and whether an override changed the client ID. Public clients do not use a client secret.                |
| Shopper authentication fails                       | Check the SLAS client, public/private client type, channel/site, and scopes. Account Manager credentials cannot replace SLAS credentials. |
| Settings in `package.json` have no effect          | Check the allowed fields and higher-priority sources. Instance credentials belong elsewhere.                                              |
| A connection resolves but an API denies access     | Check the client's roles, scopes, tenant filters, and API permissions in [Authentication](./authentication).                              |

## Next Steps

- [Authentication](./authentication) - obtain credentials and configure platform access.
- [Safety Mode](./safety) - restrict changes by instance or workflow.
- [MCP Configuration](/mcp/configuration) - customize the tools available to your assistant.
- [IDE Extension Configuration](/vscode-extension/configuration) - select projects and connections in your editor.
