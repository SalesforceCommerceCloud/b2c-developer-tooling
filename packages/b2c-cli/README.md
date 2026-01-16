# Salesforce Commerce Cloud B2C CLI

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)

> [!NOTE]
> This project is currently in **Developer Preview**. Not all features are implemented, and the API may change in future releases. Please provide feedback via GitHub issues.

A command-line interface for Salesforce Commerce Cloud B2C instances and platform services.

## Installation

### npm (Recommended)

```sh
npm install -g @salesforce/b2c-cli
```

### Homebrew (macOS/Linux)

```sh
brew tap SalesforceCommerceCloud/tooling
brew install b2c-cli
```

### GitHub Release Tarball

For pre-release versions not yet published to npm, download the tarball from [GitHub Releases](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/releases) and install:

```sh
npm install -g ./salesforce-b2c-cli-<version>.tgz
```

## Usage

```sh
b2c COMMAND
b2c --help [COMMAND]
```

## Configuration

The CLI can be configured via command-line flags or environment variables:

See the documentation for full configuration options: [https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/configuration.html](https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/configuration.html)


| Environment Variable | Description |
|---------------------|-------------|
| `SFCC_SERVER` | B2C instance hostname |
| `SFCC_CODE_VERSION` | Code version |
| `SFCC_CLIENT_ID` | OAuth client ID |
| `SFCC_CLIENT_SECRET` | OAuth client secret |
| `SFCC_USERNAME` | Username for WebDAV |
| `SFCC_PASSWORD` | Password/access key for WebDAV |

## Commands

### Code Management

Deploy and manage code versions on B2C Commerce instances.

```sh
# List code versions
b2c code list

# Deploy cartridges
b2c code deploy --server my-sandbox.demandware.net --code-version v1

# Watch and sync changes during development
b2c code watch

# Activate a code version
b2c code activate v1

# Delete a code version
b2c code delete old-version
```

### Jobs and Site Import/Export

Execute jobs and manage site archives.

```sh
# Run a job
b2c job run my-job --wait

# Import a site archive
b2c job import ./site-data.zip

# Export site data
b2c job export --global-data meta_data

# Search job executions
b2c job search --status RUNNING
```

### On-Demand Sandboxes (ODS)

Create and manage on-demand sandboxes.

```sh
# List sandboxes
b2c ods list

# Create a new sandbox
b2c ods create

# Get sandbox details
b2c ods get <sandbox-id>

# Start/stop/restart a sandbox
b2c ods start <sandbox-id>
b2c ods stop <sandbox-id>
b2c ods restart <sandbox-id>

# Delete a sandbox
b2c ods delete <sandbox-id>
```

### Managed Runtime (MRT)

Manage MRT projects, environments, and deployments.

```sh
# Push a bundle
b2c mrt push --project my-storefront --environment staging

# Create an environment
b2c mrt env create staging --project my-storefront --name "Staging"

# Manage environment variables
b2c mrt env var list -p my-project -e staging
b2c mrt env var set API_KEY=secret -p my-project -e staging
b2c mrt env var delete OLD_KEY -p my-project -e staging
```

### SLAS Client Management

Manage Shopper Login and API Security (SLAS) clients.

```sh
# List SLAS clients
b2c slas client list

# Create a client
b2c slas client create --name "My App"

# Get client details
b2c slas client get <client-id>

# Update a client
b2c slas client update <client-id>

# Delete a client
b2c slas client delete <client-id>
```

### WebDAV Operations

File operations on instance WebDAV.

```sh
# List files
b2c webdav ls /cartridges

# Upload/download files
b2c webdav put local-file.txt /remote/path/
b2c webdav get /remote/path/file.txt

# Create directory
b2c webdav mkdir /remote/new-dir

# Delete files
b2c webdav rm /remote/path/file.txt

# Archive operations
b2c webdav zip /remote/dir archive.zip
b2c webdav unzip /remote/archive.zip
```

### Sites

List and inspect storefront sites.

```sh
b2c sites list
```

### Authentication

Get OAuth tokens for scripting.

```sh
b2c auth token
```

## Logging

Control log output with flags or environment variables:

```sh
# Debug logging
b2c code deploy --log-level debug
b2c code deploy -D  # shorthand

# JSON output for scripting
b2c code deploy --json
```

See the [documentation](https://salesforcecommercecloud.github.io/b2c-developer-tooling/cli/logging) for more logging options.

## Documentation

Full documentation is available at: https://salesforcecommercecloud.github.io/b2c-developer-tooling/

## License

This project is licensed under the Apache License 2.0. See [LICENSE.txt](../../LICENSE.txt) for full details.

## Disclaimer

This project is currently in **Developer Preview** and is provided "as-is" without warranty of any kind. It is not yet generally available (GA) and should not be used in production environments. Features, APIs, and functionality may change without notice in future releases.
