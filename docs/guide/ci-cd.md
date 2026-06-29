---
description: Automate B2C Commerce code deployment, data import, MRT bundles, and job execution with the official B2C CLI GitHub Actions for CI/CD pipelines.
---

# CI/CD with GitHub Actions

The B2C Developer Tooling project provides official GitHub Actions for automating B2C Commerce operations in your CI/CD pipelines.

## Overview

The official actions handle CLI installation, credential configuration, and Node.js setup automatically — so your workflow files stay focused on *what* you want to deploy rather than *how* to configure the tooling. High-level actions provide typed inputs for common operations like code deployment and data import, while a raw command passthrough covers everything else.

The actions are available from the `SalesforceCommerceCloud/b2c-developer-tooling` repository and support:

- **Code deployment** — deploy and activate cartridges
- **Data import** — import site archives in a single step
- **MRT deployment** — push and deploy MRT storefront bundles
- **Job execution** — run B2C jobs with wait and timeout
- **WebDAV uploads** — upload files for data import, content, etc.
- **Any CLI command** — raw passthrough for operations not covered by high-level actions

All actions are composite YAML — no compiled JavaScript, fully transparent and auditable. The high-level actions (`code-deploy`, `data-import`, `job-run`, `mrt-deploy`, `webdav-upload`) reuse an already-installed CLI and only install one when none is present — so running a deploy after a setup step, or repeated operations on a self-hosted runner, do not trigger a redundant reinstall. The `setup` action called directly is explicit: it installs the version you request. Actions expose structured JSON outputs for downstream workflow steps.

## Authentication

Store credentials as GitHub [repository secrets](https://docs.github.com/en/actions/security-for-github-actions/security-guides/using-secrets-in-github-actions) and non-sensitive configuration as [repository variables](https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/store-information-in-variables).

**Recommended secrets:**

| Secret | Description |
|--------|-------------|
| `SFCC_CLIENT_ID` | OAuth Client ID |
| `SFCC_CLIENT_SECRET` | OAuth Client Secret |
| `SFCC_USERNAME` | WebDAV username |
| `SFCC_PASSWORD` | WebDAV password/access key |
| `MRT_API_KEY` | MRT API key |

**Recommended variables:**

| Variable | Description |
|----------|-------------|
| `SFCC_SERVER` | B2C instance hostname |
| `MRT_PROJECT` | MRT project slug |
| `MRT_ENVIRONMENT` | MRT environment |

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
          activate: true
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
| `json` | `true` | Append `--json` flag and parse output |
| `working-directory` | `.` | Working directory |
| Auth inputs | — | See [Authentication](#authentication) |

### Setup

```
uses: SalesforceCommerceCloud/b2c-developer-tooling/actions/setup@v1
```

Installs the CLI and writes credentials to environment variables. Use this when you need multiple steps after setup. Called directly, `setup` always installs the requested `version`. Set `skip-if-present: 'true'` to reuse an already-installed CLI and install only when none is present (this is what the high-level actions do internally so they never reinstall on top of an existing CLI).

```yaml
- uses: SalesforceCommerceCloud/b2c-developer-tooling/actions/setup@v1
  with:
    client-id: ${{ secrets.SFCC_CLIENT_ID }}
    client-secret: ${{ secrets.SFCC_CLIENT_SECRET }}
    server: ${{ vars.SFCC_SERVER }}
    plugins: |
      @myorg/b2c-plugin-custom
      sfcc-solutions-share/b2c-plugin-intellij-sfcc-config
```

Plugins are installed after the CLI; already-installed plugins are skipped by exact name match. Each line is an npm package name or GitHub `owner/repo`. For reliable skip-on-reinstall, prefer the published npm package name — when a GitHub `owner/repo` slug differs from the package it publishes, the plugin is reinstalled each run (harmless, just slower).

The setup action accepts the following inputs (each maps to the corresponding `SFCC_*` environment variable):

| Input | Environment Variable |
|-------|---------------------|
| `client-id` | `SFCC_CLIENT_ID` |
| `client-secret` | `SFCC_CLIENT_SECRET` |
| `server` | `SFCC_SERVER` |
| `code-version` | `SFCC_CODE_VERSION` |
| `username` | `SFCC_USERNAME` |
| `password` | `SFCC_PASSWORD` |
| `short-code` | `SFCC_SHORTCODE` |
| `tenant-id` | `SFCC_TENANT_ID` |
| `account-manager-host` | `SFCC_ACCOUNT_MANAGER_HOST` |
| `webdav-server` | `SFCC_WEBDAV_SERVER` |
| `certificate` | `SFCC_CERTIFICATE` |
| `certificate-passphrase` | `SFCC_CERTIFICATE_PASSPHRASE` |
| `selfsigned` | `SFCC_SELFSIGNED` |
| `mrt-api-key` | `MRT_API_KEY` |
| `mrt-project` | `MRT_PROJECT` |
| `mrt-environment` | `MRT_ENVIRONMENT` |
| `log-level` | `SFCC_LOG_LEVEL` |

The `webdav-server`, `certificate`, `certificate-passphrase`, and `selfsigned` inputs are only needed for staging environments that require a separate WebDAV hostname and a client certificate (mTLS). See [Staging Environments (Two-Factor mTLS)](#staging-environments-two-factor-mtls).

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
    activate: true
    cartridges: 'app_storefront_base,app_custom'
```

| Input | Default | Description |
|-------|---------|-------------|
| `cartridge-path` | `.` | Path to cartridge source directory |
| `activate` | `false` | Activate code version after deploy |
| `code-version` | — | Code version (overrides env) |
| `cartridges` | — | Comma-separated cartridges to include |
| `exclude-cartridges` | — | Comma-separated cartridges to exclude |
| `delete` | `false` | Delete existing cartridges first |

### Data Import

```
uses: SalesforceCommerceCloud/b2c-developer-tooling/actions/data-import@v1
```

Import a site archive. Handles upload, job execution, waiting, and cleanup in one step.

```yaml
- uses: SalesforceCommerceCloud/b2c-developer-tooling/actions/data-import@v1
  with:
    client-id: ${{ secrets.SFCC_CLIENT_ID }}
    client-secret: ${{ secrets.SFCC_CLIENT_SECRET }}
    server: ${{ vars.SFCC_SERVER }}
    username: ${{ secrets.SFCC_USERNAME }}
    password: ${{ secrets.SFCC_PASSWORD }}
    target: './export/site-import.zip'
    timeout: 600
```

| Input | Default | Description |
|-------|---------|-------------|
| `target` | *(required)* | Local file, directory, or zip to import |
| `timeout` | — | Timeout in seconds |
| `keep-archive` | `false` | Keep archive on instance after import |
| `show-log` | `true` | Show job log on failure |

### MRT Deploy

```
uses: SalesforceCommerceCloud/b2c-developer-tooling/actions/mrt-deploy@v1
```

Push and deploy an MRT bundle.

```yaml
- uses: SalesforceCommerceCloud/b2c-developer-tooling/actions/mrt-deploy@v1
  with:
    mrt-api-key: ${{ secrets.MRT_API_KEY }}
    project: ${{ vars.MRT_PROJECT }}
    environment: ${{ vars.MRT_ENVIRONMENT }}
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
    parameters: |
      ImportFile=site-import.zip
      ImportMode=merge
```

| Input | Default | Description |
|-------|---------|-------------|
| `job-id` | *(required)* | Job ID to execute |
| `wait` | `true` | Wait for completion |
| `timeout` | `900` | Timeout in seconds (when wait=true) |
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

## Staging Environments (Two-Factor mTLS)

Internal staging instances typically require:

- A separate WebDAV hostname (often a `cert.*` variant of the main hostname)
- A PKCS12 (`.p12`) client certificate with passphrase for mutual TLS
- Permission to accept self-signed server certificates

See [Two-Factor Authentication (mTLS)](/guide/configuration#two-factor-authentication-mtls) for the underlying configuration model.

### CLI Flags

The same options that go in `dw.json` are available as CLI flags. For local use against a staging instance:

```bash
b2c code deploy \
  --server staging-internal-ccdemo.demandware.net \
  --webdav-server cert.staging.internal.ccdemo.demandware.net \
  --certificate /path/to/STG-2FA-ccdemo/deploy.p12 \
  --passphrase 'your-cert-passphrase' \
  --selfsigned \
  --client-id "$SFCC_CLIENT_ID" \
  --client-secret "$SFCC_CLIENT_SECRET"
```

| Flag | dw.json Field | Environment Variable |
|------|---------------|---------------------|
| `--server` | `hostname` | `SFCC_SERVER` |
| `--webdav-server` | `webdav-hostname` | `SFCC_WEBDAV_SERVER` |
| `--certificate` | `certificate` | `SFCC_CERTIFICATE` |
| `--passphrase` | `certificate-passphrase` | `SFCC_CERTIFICATE_PASSPHRASE` |
| `--selfsigned` | `self-signed` | `SFCC_SELFSIGNED` |

### GitHub Actions

Staging mTLS works with the standard actions — the `setup` action accepts `webdav-server`, `certificate`, `certificate-passphrase`, and `selfsigned` inputs alongside the usual auth inputs.

Because the `.p12` is a binary file, store it as a base64-encoded GitHub secret and decode it to disk in a workflow step before calling `setup`. The `certificate` input then points at the decoded path.

These are in addition to the [authentication](#authentication) secrets and variables — the same `SFCC_*` names used elsewhere map straight through to the `setup` inputs:

| Secret | Maps to input → env var | Description |
|--------|-------------------------|-------------|
| `SFCC_CLIENT_ID` | `client-id` → `SFCC_CLIENT_ID` | OAuth Client ID |
| `SFCC_CLIENT_SECRET` | `client-secret` → `SFCC_CLIENT_SECRET` | OAuth Client Secret |
| `SFCC_CERTIFICATE_PASSPHRASE` | `certificate-passphrase` → `SFCC_CERTIFICATE_PASSPHRASE` | Passphrase for the `.p12` |
| `STAGING_CERTIFICATE_P12_BASE64` | *(none — decoded to a file)* | Base64-encoded `.p12` client certificate |

| Variable | Maps to input → env var | Description |
|----------|-------------------------|-------------|
| `SFCC_SERVER` | `server` → `SFCC_SERVER` | e.g. `staging-internal-ccdemo.demandware.net` |
| `SFCC_WEBDAV_SERVER` | `webdav-server` → `SFCC_WEBDAV_SERVER` | e.g. `cert.staging.internal.ccdemo.demandware.net` |

`STAGING_CERTIFICATE_P12_BASE64` is the only value here that is **not** an `SFCC_*` environment variable — it holds the raw base64 of the certificate file, which a workflow step decodes to disk. The `certificate` input then points at that decoded path (the tooling reads the file path from `SFCC_CERTIFICATE`, not the certificate contents).

To create the base64 secret locally:

```bash
base64 -i deploy.p12 | pbcopy   # macOS
# or
base64 -w0 deploy.p12           # Linux
```

Then paste the value into a GitHub repository secret.

**Workflow example:**

```yaml
name: Deploy to Staging

on:
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # Decode the .p12 to a file inside the runner workspace
      - name: Decode staging client certificate
        run: |
          echo "${{ secrets.STAGING_CERTIFICATE_P12_BASE64 }}" \
            | base64 --decode > "$RUNNER_TEMP/staging-deploy.p12"
          chmod 600 "$RUNNER_TEMP/staging-deploy.p12"

      - uses: SalesforceCommerceCloud/b2c-developer-tooling/actions/setup@v1
        with:
          client-id: ${{ secrets.SFCC_CLIENT_ID }}
          client-secret: ${{ secrets.SFCC_CLIENT_SECRET }}
          server: ${{ vars.SFCC_SERVER }}
          webdav-server: ${{ vars.SFCC_WEBDAV_SERVER }}
          certificate: ${{ runner.temp }}/staging-deploy.p12
          certificate-passphrase: ${{ secrets.SFCC_CERTIFICATE_PASSPHRASE }}
          selfsigned: 'true'

      - run: npm ci && npm run build

      - uses: SalesforceCommerceCloud/b2c-developer-tooling/actions/code-deploy@v1
        with:
          code-version: staging-${{ github.run_number }}
          activate: true
```

Once the `setup` step writes `SFCC_CERTIFICATE`, `SFCC_WEBDAV_SERVER`, etc. to `$GITHUB_ENV`, every subsequent action picks them up automatically — no need to repeat them on `code-deploy`, `data-import`, `job-run`, or `webdav-upload`.

::: tip Multiple Environments in One Workflow
If a single workflow targets both a normal sandbox and a staging instance, run `setup` again before each phase with the appropriate inputs. The second `setup` only overrides env vars for inputs you actually pass — anything left blank keeps its value from the previous `setup`. To fully switch environments, re-pass every variable that should change (or use the `env:` block on individual steps to scope overrides).
:::

::: warning Cleanup
The decoded `.p12` lives only inside the runner's ephemeral workspace and is destroyed when the job ends. Never commit the file or write it outside `$RUNNER_TEMP` / the workspace.
:::

## Patterns

### Data Import Pipeline

Import a site archive:

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

      - uses: SalesforceCommerceCloud/b2c-developer-tooling/actions/data-import@v1
        with:
          client-id: ${{ secrets.SFCC_CLIENT_ID }}
          client-secret: ${{ secrets.SFCC_CLIENT_SECRET }}
          server: ${{ vars.SFCC_SERVER }}
          username: ${{ secrets.SFCC_USERNAME }}
          password: ${{ secrets.SFCC_PASSWORD }}
          target: ${{ github.event.inputs.import-file }}
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
          mrt-api-key: ${{ secrets.MRT_API_KEY }}
          project: ${{ vars.MRT_PROJECT }}
          environment: ${{ vars.MRT_ENVIRONMENT }}
          build-directory: build
          message: 'Release ${{ github.event.release.tag_name }}'
```

### Using Outputs

When `json` is enabled (the default), the `result` output contains the command's structured JSON. Reference it directly in downstream steps:

```yaml
- uses: SalesforceCommerceCloud/b2c-developer-tooling/actions/code-deploy@v1
  id: deploy
  with:
    code-version: v25_03_1
    activate: true

- name: Show deploy result
  run: echo '${{ steps.deploy.outputs.result }}'
```

```json
{
  "cartridges": [
    { "name": "app_storefront_base", "dest": "app_storefront_base", "src": "..." },
    { "name": "app_custom", "dest": "app_custom", "src": "..." }
  ],
  "codeVersion": "v25_03_1",
  "reloaded": true
}
```

Actions exit with the CLI's exit code, so a failed job will fail the step. Use `continue-on-error` and `fromJSON()` when you need to inspect the result after a failure:

```yaml
- uses: SalesforceCommerceCloud/b2c-developer-tooling/actions/job-run@v1
  id: job
  continue-on-error: true
  with:
    job-id: 'sfcc-site-archive-import'
    wait: true

- name: Handle job failure
  if: steps.job.outputs.exit-code != '0'
  run: echo "Job failed with status ${{ fromJSON(steps.job.outputs.result).exit_status.code }}"
```

## Version Pinning

Use the `version` input to pin the CLI version:

```yaml
- uses: SalesforceCommerceCloud/b2c-developer-tooling@v1
  with:
    version: '0.4.1'
```

Use `@v1` for the latest stable action version (recommended). The floating `v1` tag is updated on each backward-compatible release.

> **Note:** High-level actions (`code-deploy`, `data-import`, `job-run`, `mrt-deploy`, `webdav-upload`) and the root action internally reference `actions/setup@v1` and `actions/run@v1`. This means even if you pin the outer action to a specific SHA or tag, the setup and run steps resolve to the latest `v1` release. For full SHA-level reproducibility, use `actions/setup` + `actions/run` directly — each can be pinned independently to an exact SHA. For most users, `@v1` on the high-level actions is the recommended approach.

## Plugins

The CLI supports [plugins](/guide/extending) for custom configuration sources, HTTP middleware, and more. Install plugins in CI with the `plugins` input on the `setup` action:

```yaml
- uses: SalesforceCommerceCloud/b2c-developer-tooling/actions/setup@v1
  with:
    client-id: ${{ secrets.SFCC_CLIENT_ID }}
    client-secret: ${{ secrets.SFCC_CLIENT_SECRET }}
    server: ${{ vars.SFCC_SERVER }}
    plugins: |
      @myorg/b2c-plugin-custom
      sfcc-solutions-share/b2c-plugin-intellij-sfcc-config
```

Each line is an npm package name or GitHub `owner/repo`. Plugins are installed after the CLI; already-installed plugins are skipped on re-invocation.

## Logging

The `setup` action accepts a `log-level` input that sets `SFCC_LOG_LEVEL` for all subsequent steps:

```yaml
- uses: SalesforceCommerceCloud/b2c-developer-tooling/actions/setup@v1
  with:
    log-level: debug
```

Available levels (most to least verbose): `trace`, `debug`, `info` (default), `warn`, `error`, `silent`.

You can also set the environment variable directly in your workflow:

```yaml
env:
  SFCC_LOG_LEVEL: debug
```

Logs are always human-readable on stderr. The `--json` flag only controls the structured result on stdout. If you need machine-readable log lines (e.g., for log aggregation), set `SFCC_JSON_LOGS=true`.

## CI Defaults

All actions automatically configure:

- **`NO_COLOR=1`** — clean log output without ANSI colors
