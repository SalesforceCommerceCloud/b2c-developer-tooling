# CI/CD with GitHub Actions

The B2C Developer Tooling project provides official GitHub Actions for automating Commerce Cloud operations in your CI/CD pipelines.

## Overview

Without these actions, automating B2C Commerce in GitHub Actions requires manually installing the right Node.js version, installing the CLI from npm, and mapping GitHub secrets to the `SFCC_*` environment variables the CLI expects. The official actions handle all of that setup and provide high-level, typed inputs for common operations — so your workflow files stay focused on *what* you want to deploy rather than *how* to configure the tooling.

The actions are available from the `SalesforceCommerceCloud/b2c-developer-tooling` repository and support:

- **Code deployment** — deploy cartridges with reload
- **MRT deployment** — push and deploy MRT storefront bundles
- **Job execution** — run B2C jobs with wait and timeout
- **WebDAV uploads** — upload files for data import, content, etc.
- **Any CLI command** — raw passthrough for operations not covered by high-level actions

All actions are composite YAML — no compiled JavaScript, fully transparent and auditable. They cache the npm install across runs and expose structured JSON outputs for downstream workflow steps.

## Authentication

Store credentials as GitHub [repository secrets](https://docs.github.com/en/actions/security-for-github-actions/security-guides/using-secrets-in-github-actions) and non-sensitive configuration as [repository variables](https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/store-information-in-variables).

**Recommended secrets:**

| Secret | Description |
|--------|-------------|
| `SFCC_CLIENT_ID` | OAuth Client ID |
| `SFCC_CLIENT_SECRET` | OAuth Client Secret |
| `SFCC_USERNAME` | WebDAV username |
| `SFCC_PASSWORD` | WebDAV password/access key |
| `SFCC_MRT_API_KEY` | MRT API key |

**Recommended variables:**

| Variable | Description |
|----------|-------------|
| `SFCC_SERVER` | B2C instance hostname |
| `SFCC_MRT_PROJECT` | MRT project slug |
| `SFCC_MRT_ENVIRONMENT` | MRT environment |

Credentials can be passed per-action or set once with the **setup** action so they're available to all subsequent steps.

## Quick Start: Deploy Cartridges

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # Install the B2C CLI and configure credentials for subsequent steps
      - uses: SalesforceCommerceCloud/b2c-developer-tooling/actions/setup@v1
        with:
          client-id: ${{ secrets.SFCC_CLIENT_ID }}
          client-secret: ${{ secrets.SFCC_CLIENT_SECRET }}
          server: ${{ vars.SFCC_SERVER }}
          username: ${{ secrets.SFCC_USERNAME }}
          password: ${{ secrets.SFCC_PASSWORD }}

      # Run your build steps as usual
      - run: npm ci
      - run: npm run build

      # Generate a code version from the branch name and date
      - name: Set code version
        id: version
        run: |
          BRANCH=$(echo "$GITHUB_REF_NAME" | tr '/' '-')
          echo "code-version=${BRANCH}-$(date +%Y%m%d-%H%M%S)" >> "$GITHUB_OUTPUT"

      # Deploy cartridges — only operation-specific inputs needed
      - uses: SalesforceCommerceCloud/b2c-developer-tooling/actions/code-deploy@v1
        with:
          code-version: ${{ steps.version.outputs.code-version }}
          reload: true
```

The **setup** step installs the CLI and configures credentials for all subsequent steps. Everything after that — your build, version calculation, and deploy — can focus on your project's needs.

## Actions Reference

### Root Action

```
uses: SalesforceCommerceCloud/b2c-developer-tooling@v1
```

Combines setup and command execution. Pass a `command` to run a CLI command, or omit it for setup-only.

| Input | Default | Description |
|-------|---------|-------------|
| `command` | — | CLI command to run |
| `version` | `latest` | CLI version to install |
| `node-version` | `22` | Node.js version |
| `json` | `true` | Parse JSON output |
| `working-directory` | `.` | Working directory |
| Auth inputs | — | See [Authentication](#authentication) |

### Setup

```
uses: SalesforceCommerceCloud/b2c-developer-tooling/actions/setup@v1
```

Installs the CLI and writes credentials to environment variables. Use this when you need multiple steps after setup.

```yaml
- uses: SalesforceCommerceCloud/b2c-developer-tooling/actions/setup@v1
  with:
    client-id: ${{ secrets.SFCC_CLIENT_ID }}
    client-secret: ${{ secrets.SFCC_CLIENT_SECRET }}
    server: ${{ vars.SFCC_SERVER }}
```

### Run

```
uses: SalesforceCommerceCloud/b2c-developer-tooling/actions/run@v1
```

Executes any CLI command. Pairs with the setup action.

```yaml
- uses: SalesforceCommerceCloud/b2c-developer-tooling/actions/run@v1
  with:
    command: 'sandbox list --realm abcd'
```

| Input | Default | Description |
|-------|---------|-------------|
| `command` | *(required)* | CLI command to run |
| `json` | `true` | Append `--json` and parse output |
| `working-directory` | `.` | Working directory |

### Code Deploy

```
uses: SalesforceCommerceCloud/b2c-developer-tooling/actions/code-deploy@v1
```

Deploy cartridges with typed inputs.

```yaml
- uses: SalesforceCommerceCloud/b2c-developer-tooling/actions/code-deploy@v1
  with:
    client-id: ${{ secrets.SFCC_CLIENT_ID }}
    client-secret: ${{ secrets.SFCC_CLIENT_SECRET }}
    server: ${{ vars.SFCC_SERVER }}
    username: ${{ secrets.SFCC_USERNAME }}
    password: ${{ secrets.SFCC_PASSWORD }}
    code-version: ${{ vars.SFCC_CODE_VERSION }}
    reload: true
    cartridges: 'app_storefront_base,app_custom'
```

| Input | Default | Description |
|-------|---------|-------------|
| `cartridge-path` | `.` | Path to cartridge source directory |
| `reload` | `true` | Activate code version after deploy |
| `code-version` | — | Code version (overrides env) |
| `cartridges` | — | Comma-separated cartridges to include |
| `exclude-cartridges` | — | Comma-separated cartridges to exclude |
| `delete` | `false` | Delete existing cartridges first |

### MRT Deploy

```
uses: SalesforceCommerceCloud/b2c-developer-tooling/actions/mrt-deploy@v1
```

Push and deploy an MRT bundle.

```yaml
- uses: SalesforceCommerceCloud/b2c-developer-tooling/actions/mrt-deploy@v1
  with:
    mrt-api-key: ${{ secrets.SFCC_MRT_API_KEY }}
    project: ${{ vars.SFCC_MRT_PROJECT }}
    environment: ${{ vars.SFCC_MRT_ENVIRONMENT }}
    build-directory: build
    message: 'Deploy from CI'
```

| Input | Default | Description |
|-------|---------|-------------|
| `project` | — | MRT project slug |
| `environment` | — | Target environment |
| `build-directory` | `build` | Local build directory |
| `message` | — | Bundle message |
| `bundle-id` | — | Deploy existing bundle by ID |

### Job Run

```
uses: SalesforceCommerceCloud/b2c-developer-tooling/actions/job-run@v1
```

Execute a B2C job and optionally wait for completion.

```yaml
- uses: SalesforceCommerceCloud/b2c-developer-tooling/actions/job-run@v1
  with:
    job-id: 'sfcc-site-archive-import'
    wait: true
    timeout: 600
```

| Input | Default | Description |
|-------|---------|-------------|
| `job-id` | *(required)* | Job ID to execute |
| `wait` | `true` | Wait for completion |
| `timeout` | `900` | Timeout in seconds |
| `parameters` | — | `KEY=VALUE` pairs, one per line |
| `show-log` | `true` | Show job log on failure |

### WebDAV Upload

```
uses: SalesforceCommerceCloud/b2c-developer-tooling/actions/webdav-upload@v1
```

Upload files via WebDAV.

```yaml
- uses: SalesforceCommerceCloud/b2c-developer-tooling/actions/webdav-upload@v1
  with:
    local-path: './export/site-import.zip'
    remote-path: 'src/instance/'
    root: IMPEX
```

| Input | Default | Description |
|-------|---------|-------------|
| `local-path` | *(required)* | Local file or directory |
| `remote-path` | *(required)* | Remote destination path |
| `root` | `IMPEX` | WebDAV root (IMPEX, TEMP, CARTRIDGES, etc.) |

## Patterns

### Data Import Pipeline

Upload a site archive and run the import job:

```yaml
name: Data Import

on:
  workflow_dispatch:
    inputs:
      import-file:
        description: 'Path to the site import archive'
        required: true
        default: 'export/site-import.zip'

jobs:
  import:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: SalesforceCommerceCloud/b2c-developer-tooling/actions/setup@v1
        with:
          client-id: ${{ secrets.SFCC_CLIENT_ID }}
          client-secret: ${{ secrets.SFCC_CLIENT_SECRET }}
          server: ${{ vars.SFCC_SERVER }}
          username: ${{ secrets.SFCC_USERNAME }}
          password: ${{ secrets.SFCC_PASSWORD }}

      - uses: SalesforceCommerceCloud/b2c-developer-tooling/actions/webdav-upload@v1
        with:
          local-path: ${{ github.event.inputs.import-file }}
          remote-path: 'src/instance/'

      - uses: SalesforceCommerceCloud/b2c-developer-tooling/actions/job-run@v1
        with:
          job-id: 'sfcc-site-archive-import'
          wait: true
          timeout: 600
```

### MRT Release Deploy

Build and deploy an MRT storefront on release:

```yaml
name: MRT Deploy

on:
  release:
    types: [published]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build storefront
        run: npm run build

      - uses: SalesforceCommerceCloud/b2c-developer-tooling/actions/mrt-deploy@v1
        with:
          mrt-api-key: ${{ secrets.SFCC_MRT_API_KEY }}
          project: ${{ vars.SFCC_MRT_PROJECT }}
          environment: ${{ vars.SFCC_MRT_ENVIRONMENT }}
          build-directory: build
          message: 'Release ${{ github.event.release.tag_name }}'
```

### Using Outputs

The `result` output contains the CLI's JSON output for downstream steps:

```yaml
- uses: SalesforceCommerceCloud/b2c-developer-tooling/actions/run@v1
  id: code-list
  with:
    command: 'code list'

- name: Use result
  run: echo "${{ steps.code-list.outputs.result }}"
```

## Version Pinning

Use the `version` input to pin the CLI version:

```yaml
- uses: SalesforceCommerceCloud/b2c-developer-tooling@v1
  with:
    version: '0.4.1'
```

Use `@v1` for the latest stable action version (recommended). The floating `v1` tag is updated on each backward-compatible release.

## CI Defaults

All actions automatically configure:

- **`NO_COLOR=1`** — clean log output without ANSI colors
