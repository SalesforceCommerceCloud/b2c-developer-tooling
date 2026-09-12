# B2C Commerce GitHub Actions

GitHub Actions for automating Salesforce B2C Commerce operations with the [`@salesforce/b2c-cli`](https://www.npmjs.com/package/@salesforce/b2c-cli).

Action v2 uses CLI 2.x by default. The maintained Action v1 line remains on CLI 1.x, so existing workflows do not cross the CLI major-version boundary until their `uses:` references are updated.

## Actions

### Foundation

| Action    | Path                                               | Description                               |
| --------- | -------------------------------------------------- | ----------------------------------------- |
| **Root**  | `SalesforceCommerceCloud/b2c-developer-tooling@v2` | Setup CLI + run a command in one step     |
| **Setup** | `.../actions/setup@v2`                             | Install CLI and set environment variables |
| **Run**   | `.../actions/run@v2`                               | Execute any CLI command                   |

### High-level Operations

| Action            | Path                           | Description                         |
| ----------------- | ------------------------------ | ----------------------------------- |
| **Code Deploy**   | `.../actions/code-deploy@v2`   | Deploy cartridges with typed inputs |
| **Data Import**   | `.../actions/data-import@v2`   | Import site archives                |
| **MRT Deploy**    | `.../actions/mrt-deploy@v2`    | Push/deploy MRT bundles             |
| **Job Run**       | `.../actions/job-run@v2`       | Execute B2C jobs                    |
| **WebDAV Upload** | `.../actions/webdav-upload@v2` | Upload files via WebDAV             |

## Quick Start

### One-step code deploy

```yaml
- uses: actions/checkout@v6
- uses: SalesforceCommerceCloud/b2c-developer-tooling@v2
  with:
    client-id: ${{ secrets.SFCC_CLIENT_ID }}
    client-secret: ${{ secrets.SFCC_CLIENT_SECRET }}
    server: ${{ vars.SFCC_SERVER }}
    code-version: ${{ vars.SFCC_CODE_VERSION }}
    command: 'code deploy --reload'
```

### High-level code deploy

```yaml
- uses: actions/checkout@v6
- uses: SalesforceCommerceCloud/b2c-developer-tooling/actions/code-deploy@v2
  with:
    client-id: ${{ secrets.SFCC_CLIENT_ID }}
    client-secret: ${{ secrets.SFCC_CLIENT_SECRET }}
    server: ${{ vars.SFCC_SERVER }}
    code-version: ${{ vars.SFCC_CODE_VERSION }}
    activate: true
    cartridges: 'app_storefront_base,app_custom'
```

### Data import

```yaml
- uses: actions/checkout@v6
- uses: SalesforceCommerceCloud/b2c-developer-tooling/actions/data-import@v2
  with:
    client-id: ${{ secrets.SFCC_CLIENT_ID }}
    client-secret: ${{ secrets.SFCC_CLIENT_SECRET }}
    server: ${{ vars.SFCC_SERVER }}
    username: ${{ secrets.SFCC_USERNAME }}
    password: ${{ secrets.SFCC_PASSWORD }}
    target: './export/site-import.zip'
    timeout: 600
```

### Raw CLI command

```yaml
- uses: SalesforceCommerceCloud/b2c-developer-tooling/actions/setup@v2
  with:
    client-id: ${{ secrets.SFCC_CLIENT_ID }}
    client-secret: ${{ secrets.SFCC_CLIENT_SECRET }}
    server: ${{ vars.SFCC_SERVER }}

- uses: SalesforceCommerceCloud/b2c-developer-tooling/actions/run@v2
  with:
    command: 'sandbox list --realm abcd'
```

## Authentication

All actions accept auth inputs directly or read from `SFCC_*` environment variables. The `actions/setup` action writes provided credentials to `$GITHUB_ENV` so subsequent steps can use them automatically.

**Recommended approach:** Store secrets in GitHub repository secrets and non-sensitive config in repository variables.

| Input                    | Environment Variable          | Used By                         |
| ------------------------ | ----------------------------- | ------------------------------- |
| `client-id`              | `SFCC_CLIENT_ID`              | OAuth operations                |
| `client-secret`          | `SFCC_CLIENT_SECRET`          | OAuth operations                |
| `server`                 | `SFCC_SERVER`                 | All instance operations         |
| `code-version`           | `SFCC_CODE_VERSION`           | Code deploy                     |
| `username`               | `SFCC_USERNAME`               | WebDAV operations               |
| `password`               | `SFCC_PASSWORD`               | WebDAV operations               |
| `short-code`             | `SFCC_SHORTCODE`              | SCAPI operations                |
| `tenant-id`              | `SFCC_TENANT_ID`              | SCAPI operations                |
| `mrt-api-key`            | `MRT_API_KEY`                 | MRT operations                  |
| `mrt-project`            | `MRT_PROJECT`                 | MRT operations                  |
| `mrt-environment`        | `MRT_ENVIRONMENT`             | MRT operations                  |
| `account-manager-host`   | `SFCC_ACCOUNT_MANAGER_HOST`   | Account Manager                 |
| `webdav-server`          | `SFCC_WEBDAV_SERVER`          | Staging WebDAV (cert. hostname) |
| `certificate`            | `SFCC_CERTIFICATE`            | Two-factor mTLS (PKCS12 path)   |
| `certificate-passphrase` | `SFCC_CERTIFICATE_PASSPHRASE` | Two-factor mTLS                 |
| `selfsigned`             | `SFCC_SELFSIGNED`             | Allow self-signed server certs  |

For staging environments that require a separate WebDAV hostname and a client certificate, see the [Staging Environments guide](https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/ci-cd.html#staging-environments-two-factor-mtls) for the full pattern (decoding a base64-encoded `.p12` from a secret + wiring it through `setup`).

## Plugins

Install CLI plugins via the `plugins` input on the `setup` action (one per line):

```yaml
- uses: SalesforceCommerceCloud/b2c-developer-tooling/actions/setup@v2
  with:
    plugins: |
      @myorg/b2c-plugin-custom
      sfcc-solutions-share/b2c-plugin-intellij-sfcc-config
```

Each entry is an npm package name or GitHub `owner/repo`. Already-installed plugins are skipped on re-invocation.

## Logging

Control log verbosity via the `log-level` input on the `setup` action:

```yaml
- uses: SalesforceCommerceCloud/b2c-developer-tooling/actions/setup@v2
  with:
    log-level: debug
```

Levels: `trace`, `debug`, `info` (default), `warn`, `error`, `silent`. You can also set `SFCC_LOG_LEVEL` directly as a workflow environment variable.

## CI Defaults

All actions automatically set:

- `NO_COLOR=1` — disables color output for clean logs

## Outputs

When `json: true` (default), the `result` output contains the parsed JSON from the CLI command. Use it in downstream steps:

```yaml
- uses: SalesforceCommerceCloud/b2c-developer-tooling/actions/run@v2
  id: list
  with:
    command: 'code list'

- run: echo "${{ steps.list.outputs.result }}"
```

## Version Pinning

- **Action version:** Use `@v2` for compatible v2 updates (recommended), or an immutable release tag such as `@v2.0.0`
- **CLI version:** Action v2 defaults to the latest CLI 2.x release; Action v1 defaults to the latest CLI 1.x release

```yaml
- uses: SalesforceCommerceCloud/b2c-developer-tooling@v2
  with:
    version: '2.0.0' # Pin an exact CLI version
```

Set `version: latest` explicitly only when the workflow should cross future CLI major versions automatically.

### Upgrading from Action v1

Change every B2C Action reference in the workflow from `@v1` to `@v2`; do not mix majors in one job because high-level actions reuse an already-installed CLI. Then update consumers of structured job output from snake_case to camelCase. For example, use `executionStatus` and `exitStatus.code` instead of `execution_status` and `exit_status.code`. Review other commands whose JSON output the workflow parses before upgrading.

To remain on the maintained CLI 1.x line, keep `@v1`. You can also set `version: '1'` explicitly or use an exact CLI version such as `1.23.2`.

> **Reproducibility:** Each released high-level or root action internally references its matching immutable `actions/setup@v2.x.y` and `actions/run@v2.x.y` release. Pin the outer action to an exact release tag for a fixed Action suite. Use direct `actions/setup` and `actions/run` references pinned to full commit SHAs when organizational policy requires SHA pins for every action.
