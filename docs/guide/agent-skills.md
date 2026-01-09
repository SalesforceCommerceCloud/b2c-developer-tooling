# Agent Skills & Plugins

The B2C Developer Tooling project provides agent skills that enhance the AI-assisted development experience when working with Salesforce B2C Commerce projects.

These skills follow the [Agent Skills](https://agentskills.io/home) standard and can be used with multiple agentic IDEs including [Claude Code](https://claude.ai/code), Cursor, GitHub Copilot, and OpenAI Codex.

## Overview

When installed, the skills teach AI assistants about B2C Commerce development, CLI commands, and best practices, enabling them to help you with:

- **CLI Operations** - Deploying cartridges, running jobs, managing sandboxes, WebDAV operations
- **Custom API Development** - Building SCAPI Custom APIs with contracts, implementations, and mappings
- **Best Practices** - Authentication patterns, troubleshooting workflows, and development practices

## Available Plugins

| Plugin | Description |
|--------|-------------|
| `b2c-cli` | Skills for B2C CLI commands and operations |
| `b2c` | Skills for B2C Commerce development practices |

### Plugin: b2c-cli

Skills for using the B2C CLI to manage your Commerce Cloud instances:

| Skill | Description |
|-------|-------------|
| `b2c-code` | Code version deployment and management |
| `b2c-job` | Job execution and site archive import/export (IMPEX) |
| `b2c-sites` | Storefront sites listing and inspection |
| `b2c-webdav` | WebDAV file operations (ls, get, put, rm, zip, unzip) |
| `b2c-ods` | On-Demand Sandbox management |
| `b2c-mrt` | Managed Runtime project and deployment management |
| `b2c-slas` | SLAS client management |
| `b2c-scapi-custom` | Custom API endpoint status and management |

### Plugin: b2c

Skills for B2C Commerce development practices and patterns:

| Skill | Description |
|-------|-------------|
| `b2c-custom-api-development` | Comprehensive guide for building SCAPI Custom APIs |

The Custom API development skill covers:
- The three required components (contract, implementation, mapping)
- OAS 3.0 schema authoring with security schemes
- Implementation patterns with RESTResponseMgr
- Shopper vs Admin API differences
- Caching and remote includes
- Circuit breaker protection
- Troubleshooting workflows

## Installation with Claude Code

### Prerequisites

- [Claude Code](https://claude.ai/code) installed and configured

### Add the Marketplace

First, add the B2C Developer Tooling marketplace:

```bash
claude plugin marketplace add SalesforceCommerceCloud/b2c-developer-tooling
```

### Install Plugins

Install the plugins at your preferred scope:

::: code-group

```bash [Project Scope]
# Available only in the current project
claude plugin install b2c-cli --scope project
claude plugin install b2c --scope project
```

```bash [User Scope]
# Available in all your projects
claude plugin install b2c-cli --scope user
claude plugin install b2c --scope user
```

:::

### Verify Installation

```bash
claude plugin list
```

You should see `b2c-cli@b2c-developer-tooling` and `b2c@b2c-developer-tooling` in the list.

### Updating Plugins

To get the latest plugin updates:

```bash
claude plugin marketplace update
claude plugin update b2c-cli@b2c-developer-tooling
claude plugin update b2c@b2c-developer-tooling
```

### Uninstalling

To remove the plugins:

```bash
claude plugin uninstall b2c-cli@b2c-developer-tooling
claude plugin uninstall b2c@b2c-developer-tooling
```

To remove the marketplace:

```bash
claude plugin marketplace remove b2c-developer-tooling
```

## Installation with Other IDEs

The B2C skills follow the [Agent Skills](https://agentskills.io/home) standard and can be used with other AI-powered development tools.

### CLI Setup Command

::: warning Coming Soon
The `b2c setup skills` command is not yet available. Use the manual method below for now.
:::

```bash
# Configure skills for your IDE (coming soon)
b2c setup skills --ide cursor
b2c setup skills --ide copilot
```

### Manual Setup

You can manually copy skill files from the GitHub repository to your IDE's configuration:

- **b2c-cli skills**: [plugins/b2c-cli/skills/](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/tree/main/plugins/b2c-cli/skills)
- **b2c skills**: [plugins/b2c/skills/](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/tree/main/plugins/b2c/skills)

#### Cursor

Copy the `SKILL.md` files to `.cursor/rules/` in your project or configure globally in Cursor settings.

#### GitHub Copilot

Append the skill content to `.github/copilot-instructions.md` in your repository.

#### OpenAI Codex

Configure per the OpenAI Codex documentation for custom instructions.

## Usage Examples

Once installed, you can ask your AI assistant to help with B2C Commerce tasks:

**Deploy code:**
> "Deploy the cartridges in ./cartridges to my sandbox"

**Check code versions:**
> "List all code versions on my instance and show which one is active"

**Run a job:**
> "Run the reindex job on my sandbox"

**Manage files:**
> "Download the latest log files from my instance"

**Create a sandbox:**
> "Create a new On-Demand Sandbox with TTL of 48 hours"

**Check Custom API status:**
> "Show me the status of my Custom API endpoints"

**Build a Custom API:**
> "Help me create a Custom API for loyalty information"

The AI will use the appropriate skills and CLI commands based on your request.
