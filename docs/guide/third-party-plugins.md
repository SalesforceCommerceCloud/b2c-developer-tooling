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

## Creating Your Own Plugin

Want to create a plugin? See the [Extending the CLI](./extending) guide for documentation on:

- The `b2c:config-sources` hook for custom configuration sources
- Base command classes for building new commands
- Plugin structure and packaging

## Submitting Plugins

If you've created a plugin you'd like listed here, please submit a pull request to the [B2C Developer Tooling repository](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling).
