# Agent Skills & Plugins

The B2C Developer Tooling project provides agent skills that enhance the AI-assisted development experience when working with Salesforce B2C Commerce projects.

These skills follow the [Agent Skills](https://agentskills.io/home) standard and can be used with multiple agentic IDEs including [Claude Code](https://claude.ai/code), Cursor, GitHub Copilot, and VS Code.

## Overview

When installed, the skills teach AI assistants about B2C Commerce development, CLI commands, and best practices, enabling them to help you with:

- **CLI Operations** - Deploying cartridges, running jobs, managing sandboxes, WebDAV operations
- **B2C Development** - Controllers, ISML templates, forms, localization, logging, metadata
- **Web Services** - HTTP/SOAP/FTP integrations using the Service Framework
- **Custom APIs** - Building SCAPI Custom APIs with contracts, implementations, and mappings

## Available Plugins

| Plugin | Description |
|--------|-------------|
| `b2c-cli` | Skills for B2C CLI commands and operations |
| `b2c` | Skills for B2C Commerce development patterns |

### Plugin: b2c-cli

Skills for using the B2C CLI to manage your Commerce Cloud instances. Covers code deployment, job execution, site archive import/export, WebDAV file operations, On-Demand Sandbox management, and more.

Browse skills: [plugins/b2c-cli/skills/](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/tree/main/plugins/b2c-cli/skills)

### Plugin: b2c

Skills for B2C Commerce development patterns and practices. Covers controllers, ISML templates, forms, localization, logging, metadata, web services, custom job steps, Page Designer, Business Manager extensions, and Custom API development.

Browse skills: [plugins/b2c/skills/](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/tree/main/plugins/b2c/skills)

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

### Cursor

See the [Cursor Skills documentation](https://cursor.com/docs/context/skills) for configuration instructions.

Copy skill files from the plugin directories to your Cursor skills location:

- [b2c-cli skills](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/tree/main/plugins/b2c-cli/skills)
- [b2c skills](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/tree/main/plugins/b2c/skills)

### VS Code with GitHub Copilot

See the [VS Code Agent Skills documentation](https://code.visualstudio.com/docs/copilot/customization/agent-skills) for configuration instructions.

You can also append skill content to `.github/copilot-instructions.md` in your repository.

### Other IDEs

For other AI-powered IDEs, copy the `SKILL.md` files and any `references/` directories to your IDE's custom instructions location.

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

**Build a Custom API:**
> "Help me create a Custom API for loyalty information"

**Add logging:**
> "Add logging to my checkout controller"

**Create a web service:**
> "Create an HTTP service to call the payment gateway API"

The AI will use the appropriate skills and CLI commands based on your request.
