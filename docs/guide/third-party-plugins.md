---
description: Community plugins for the B2C CLI including IntelliJ SFCC config integration, credential storage, docs search, catalog reduction, and pipeline visualization.
---

# 3rd Party Plugins

The B2C CLI can be extended with community-developed plugins that add new functionality or integrate with external tools.

## Installing Plugins

Plugins can be installed directly from GitHub or npm:

```bash
# Install from GitHub (owner/repo format)
b2c plugins install sfcc-solutions-share/b2c-plugin-intellij-sfcc-config

# Install from npm
b2c plugins install @some-org/b2c-plugin-example

# List installed plugins
b2c plugins

# Uninstall a plugin
b2c plugins uninstall b2c-plugin-intellij-sfcc-config
```

## Available Plugins

### IntelliJ SFCC Config Plugin

**Repository:** [sfcc-solutions-share/b2c-plugin-intellij-sfcc-config](https://github.com/sfcc-solutions-share/b2c-plugin-intellij-sfcc-config)

Loads B2C instance configuration from the [IntelliJ SFCC plugin](https://plugins.jetbrains.com/plugin/13668-salesforce-b2c-commerce-sfcc-) settings. This allows you to share configuration between your IDE and the CLI without duplicating settings.

#### Installation

```bash
b2c plugins install sfcc-solutions-share/b2c-plugin-intellij-sfcc-config
```

#### Features

- Reads connection settings from `.idea/misc.xml`
- Optionally decrypts credentials from the IntelliJ SFCC plugin's encrypted credentials file
- Supports the `--instance` flag to select specific connections
- Provides hostname, username, code version, client ID, and more

#### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SFCC_INTELLIJ_PROJECT_FILE` | Path to `.idea/misc.xml` | `./.idea/misc.xml` |
| `SFCC_INTELLIJ_CREDENTIALS_FILE` | Path to encrypted credentials file | (none) |
| `SFCC_INTELLIJ_CREDENTIALS_KEY` | Decryption key for credentials | (none) |
| `SFCC_INTELLIJ_ALGORITHM` | Encryption algorithm | `aes-192-ecb` |

#### Usage

```bash
# Basic usage - reads from .idea/misc.xml in current directory
cd /path/to/intellij-project
b2c code list

# Select a specific instance
b2c code list --instance staging

# With credentials decryption
export SFCC_INTELLIJ_CREDENTIALS_FILE=~/.intellij-sfcc-credentials
export SFCC_INTELLIJ_CREDENTIALS_KEY="your-24-byte-key"
b2c code deploy
```

### Password Store Plugin

**Repository:** [sfcc-solutions-share/b2c-plugin-password-store](https://github.com/sfcc-solutions-share/b2c-plugin-password-store)

Loads B2C credentials from [pass](https://www.passwordstore.org/) (the standard Unix password manager). This allows secure GPG-encrypted storage of credentials that works across Linux, macOS, and WSL.

#### Installation

```bash
b2c plugins install sfcc-solutions-share/b2c-plugin-password-store
```

#### Features

- Uses GPG encryption via the standard `pass` tool
- Supports global defaults via `b2c-cli/_default` (shared OAuth credentials)
- Supports instance-specific credentials at `b2c-cli/<instance>`
- Merges with other config sources (dw.json, environment variables)
- Multi-line format with password on first line, followed by key-value pairs

#### Storing Credentials

```bash
# Store global OAuth credentials (shared across all instances)
pass insert -m b2c-cli/_default
# Enter:
# (blank first line or placeholder)
# client-id: your-client-id
# client-secret: your-client-secret

# Store instance-specific credentials
pass insert -m b2c-cli/staging
# Enter:
# your-webdav-password
# username: user@example.com
# hostname: staging.salesforce.com
# code-version: version1
```

#### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SFCC_PASS_PREFIX` | Path prefix in pass store | `b2c-cli` |
| `SFCC_PASS_INSTANCE` | Fallback instance name | (none) |

#### Usage

```bash
# Use with explicit instance
b2c code deploy --instance staging

# View stored credentials
pass show b2c-cli/staging

# Edit credentials
pass edit b2c-cli/staging
```

### macOS Keychain Plugin

**Repository:** [sfcc-solutions-share/b2c-plugin-macos-keychain](https://github.com/sfcc-solutions-share/b2c-plugin-macos-keychain)

Loads B2C credentials from the macOS Keychain. This allows secure storage of sensitive credentials without keeping them in files like `dw.json`.

::: warning macOS Only
This plugin only works on macOS.
:::

#### Installation

```bash
b2c plugins install sfcc-solutions-share/b2c-plugin-macos-keychain
```

#### Features

- Stores credentials as JSON blobs in the macOS Keychain
- Supports global defaults via a `*` account (shared OAuth credentials)
- Supports instance-specific credentials that override globals
- Optional `defaultInstance` to auto-select an instance
- Merges with other config sources (dw.json, environment variables)

#### Storing Credentials

```bash
# Store global OAuth credentials (shared across all instances)
security add-generic-password -s 'b2c-cli' -a '*' \
  -w '{"clientId":"shared-id","clientSecret":"shared-secret","defaultInstance":"staging"}' -U

# Store instance-specific credentials
security add-generic-password -s 'b2c-cli' -a 'staging' \
  -w '{"username":"user@example.com","password":"my-webdav-key"}' -U
```

#### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SFCC_KEYCHAIN_SERVICE` | Service name in keychain | `b2c-cli` |
| `SFCC_KEYCHAIN_INSTANCE` | Fallback instance name | (none) |

#### Usage

```bash
# Use with explicit instance
b2c code deploy --instance staging

# Uses defaultInstance from * config if set
b2c code deploy

# Global OAuth merges with dw.json for other settings
b2c code deploy
```

### Docs Viewer Plugin

**Repository:** [taurgis/b2c-plugin-docs-viewer](https://github.com/taurgis/b2c-plugin-docs-viewer)

Searches Salesforce Help and fetches Help or Developer docs content directly from the CLI. This is useful when you want to look up platform documentation without leaving your terminal.

#### Installation

```bash
b2c plugins install b2c-plugin-help-docs-viewer
```

If Playwright Chromium is not installed yet:

```bash
npx playwright install chromium
```

#### Features

- Searches Salesforce Help with boxed, column-aligned results
- Fetches Help or Developer docs pages by URL or by ID from the latest search
- Fetches search results and article content in one command
- Reuses cached results for up to 5 days, with `--no-cache` to bypass caching
- Supports JSON output and optional raw extracted HTML

#### Usage

```bash
# Search Salesforce Help
b2c docs search-help-site "b2c commerce roles" --limit 5

# Fetch an article by URL or by search result ID
b2c docs help-site-article "https://help.salesforce.com/s/articleView?id=cc.b2c_roles_and_permissions.htm&type=5"
b2c docs help-site-article 2

# Search and fetch details in one step
b2c docs fetch-results-help-site "pipelines" --limit 3
```

### Catalog Reducer Plugin

**Repository:** [taurgis/b2c-plugin-catalog-reducer](https://github.com/taurgis/b2c-plugin-catalog-reducer)

Generates smaller, representative Salesforce B2C Commerce catalog datasets from large source XML files. This is useful for creating fixtures, benchmarks, and reduced datasets for local development.

#### Installation

```bash
b2c plugins install b2c-plugin-catalog-reducer
```

#### Features

- Reduces large catalog XML files into smaller fixture datasets
- Supports preferred product IDs, master-product targets, attribute-driven selection, and filler products
- Writes catalog, inventory, and pricebook outputs in one run
- Supports source-derived storefront catalogs and generated or source-derived pricebooks
- Validates generated XML against bundled catalog, inventory, and pricebook schemas

#### Usage

```bash
# Reduce a catalog using a custom config file
b2c catalog reduce -i ./catalog.xml -o ./catalog-reduced.xml -c ./catalog-reducer.json
```

The reducer writes the reduced catalog plus derived inventory and pricebook XML outputs. Relative paths in `pricebookSourceFiles` and `storefrontSourceFiles` are resolved from the config file location.

### Pipeline Visualizer Plugin

**Repository:** [taurgis/b2c-plugin-pipeline-visualizer](https://github.com/taurgis/b2c-plugin-pipeline-visualizer)

Generates ASCII and SVG previews of SFCC pipeline XML files. This is useful for inspecting pipeline structure, branch flow, and layout without opening Business Manager.

#### Installation

```bash
b2c plugins install b2c-plugin-pipeline-visualizer
```

#### Features

- Exports ASCII previews from pipeline XML files
- Generates SVG image output for rendered pipeline layouts
- Supports branch filtering for focused views
- Can include grids, node lists, edge lists, and bendpoint details
- Uses the same layout and edge routing logic across ASCII and SVG output

#### Usage

```bash
# Export an ASCII view
b2c pipeline ascii path/to/pipeline.xml --out debug/layouts/pipeline.txt

# Export an SVG image
b2c pipeline image path/to/pipeline.xml --out debug/layouts/pipeline.svg
```

Output is written to the file specified by `--out`.

## Creating Your Own Plugin

Want to create a plugin? See the [Extending the CLI](./extending) guide for documentation on:

- The `b2c:config-sources` hook for custom configuration sources
- Base command classes for building new commands
- Plugin structure and packaging

## Submitting Plugins

If you've created a plugin you'd like listed here, please submit a pull request to the [B2C Developer Tooling repository](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling).
