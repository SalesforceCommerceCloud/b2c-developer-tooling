# B2C Commerce GitHub Actions

GitHub Actions for automating Salesforce B2C Commerce operations with the [`@salesforce/b2c-cli`](https://www.npmjs.com/package/@salesforce/b2c-cli).

## Actions

### Foundation

| Action | Path | Description |
|--------|------|-------------|
| **Root** | `SalesforceCommerceCloud/b2c-developer-tooling@v1` | Setup CLI + run a command in one step |
| **Setup** | `.../actions/setup@v1` | Install CLI and set environment variables |
| **Run** | `.../actions/run@v1` | Execute any CLI command |

### High-level Operations

| Action | Path | Description |
|--------|------|-------------|
| **Code Deploy** | `.../actions/code-deploy@v1` | Deploy cartridges with typed inputs |
| **Data Import** | `.../actions/data-import@v1` | Import site archives |
| **MRT Deploy** | `.../actions/mrt-deploy@v1` | Push/deploy MRT bundles |
| **Job Run** | `.../actions/job-run@v1` | Execute B2C jobs |
| **WebDAV Upload** | `.../actions/webdav-upload@v1` | Upload files via WebDAV |

## Quick Start

### One-step code deploy

```yaml
- uses: actions/checkout@v4
- uses: SalesforceCommerceCloud/b2c-developer-tooling@v1
  with:
    client-id: ${{ secrets.SFCC_CLIENT_ID }}
    client-secret: ${{ secrets.SFCC_CLIENT_SECRET }}
    server: ${{ vars.SFCC_SERVER }}
    code-version: ${{ vars.SFCC_CODE_VERSION }}
    command: 'code deploy --reload'
```

### High-level code deploy

```yaml
- uses: actions/checkout@v4
- uses: SalesforceCommerceCloud/b2c-developer-tooling/actions/code-deploy@v1
  with:
    client-id: ${{ secrets.SFCC_CLIENT_ID }}
    client-secret: ${{ secrets.SFCC_CLIENT_SECRET }}
    server: ${{ vars.SFCC_SERVER }}
    code-version: ${{ vars.SFCC_CODE_VERSION }}
    reload: true
    cartridges: 'app_storefront_base,app_custom'
```

### Data import

```yaml
- uses: actions/checkout@v4
- uses: SalesforceCommerceCloud/b2c-developer-tooling/actions/data-import@v1
  with:
    client-id: ${{ secrets.SFCC_CLIENT_ID }}
    client-secret: ${{ secrets.SFCC_CLIENT_SECRET }}
    server: ${{ vars.SFCC_SERVER }}
    username: ${{ secrets.SFCC_USERNAME }}
    password: ${{ secrets.SFCC_PASSWORD }}
    target: './export/site-import.zip'
    timeout: 300
```

### Raw CLI command

```yaml
- uses: SalesforceCommerceCloud/b2c-developer-tooling/actions/setup@v1
  with:
    client-id: ${{ secrets.SFCC_CLIENT_ID }}
    client-secret: ${{ secrets.SFCC_CLIENT_SECRET }}
    server: ${{ vars.SFCC_SERVER }}

- uses: SalesforceCommerceCloud/b2c-developer-tooling/actions/run@v1
  with:
    command: 'sandbox list --realm abcd'
```

## Authentication

All actions accept auth inputs directly or read from `SFCC_*` environment variables. The `actions/setup` action writes provided credentials to `$GITHUB_ENV` so subsequent steps can use them automatically.

**Recommended approach:** Store secrets in GitHub repository secrets and non-sensitive config in repository variables.

| Input | Environment Variable | Used By |
|-------|---------------------|---------|
| `client-id` | `SFCC_CLIENT_ID` | OAuth operations |
| `client-secret` | `SFCC_CLIENT_SECRET` | OAuth operations |
| `server` | `SFCC_SERVER` | All instance operations |
| `code-version` | `SFCC_CODE_VERSION` | Code deploy |
| `username` | `SFCC_USERNAME` | WebDAV operations |
| `password` | `SFCC_PASSWORD` | WebDAV operations |
| `short-code` | `SFCC_SHORTCODE` | SCAPI operations |
| `tenant-id` | `SFCC_TENANT_ID` | SCAPI operations |
| `mrt-api-key` | `SFCC_MRT_API_KEY` | MRT operations |
| `mrt-project` | `SFCC_MRT_PROJECT` | MRT operations |
| `mrt-environment` | `SFCC_MRT_ENVIRONMENT` | MRT operations |
| `account-manager-host` | `SFCC_ACCOUNT_MANAGER_HOST` | Account Manager |

## Logging

Control log verbosity via the `log-level` input on the `setup` action:

```yaml
- uses: SalesforceCommerceCloud/b2c-developer-tooling/actions/setup@v1
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
- uses: SalesforceCommerceCloud/b2c-developer-tooling/actions/run@v1
  id: list
  with:
    command: 'code list'

- run: echo "${{ steps.list.outputs.result }}"
```

## Version Pinning

- **Action version:** Use `@v1` for the latest stable action (recommended), or pin to a specific tag like `@v1.0.0`
- **CLI version:** Use the `version` input to pin the CLI version (default: `latest`)

```yaml
- uses: SalesforceCommerceCloud/b2c-developer-tooling@v1
  with:
    version: '0.4.1'  # Pin CLI version
```
