# B2C CLI Agent Skills & Claude Code Plugins

This directory contains agent skills and [Claude Code](https://claude.ai/code) plugins that enhance the AI-assisted development experience when working with Salesforce B2C Commerce projects.

These skills follow the [Agent Skills](https://agentskills.io/home) format and can be used with multiple agentic IDEs including Claude Code, Cursor, GitHub Copilot, and OpenAI Codex.

## Available Plugins

| Plugin | Description |
|--------|-------------|
| `b2c-cli` | Skills for Salesforce Commerce Cloud B2C CLI operations |
| `b2c` | B2C Commerce development skills including Custom API development guides |

## Installation

### 1. Add the Marketplace

First, add the B2C Developer Tooling marketplace to Claude Code:

```bash
claude plugin marketplace add SalesforceCommerceCloud/b2c-developer-tooling
```

### 2. Install the Plugin

Install the b2c-cli plugin at your preferred scope:

```bash
# Install for the current project only
claude plugin install b2c-cli --scope project

# Install for the current user (available in all projects)
claude plugin install b2c-cli --scope user

# Install locally (development/testing)
claude plugin install b2c-cli --scope local
```

### 3. Verify Installation

```bash
claude plugin list
```

## Plugin: b2c-cli

The `b2c-cli` plugin provides skills that teach Claude about B2C Commerce CLI commands and best practices. When installed, Claude can help you with:

- **Code Deployment** (`b2c-code`) - Deploy cartridges and manage code versions
- **Job Execution** (`b2c-job`) - Run jobs and import/export site archives
- **Site Management** (`b2c-sites`) - List and inspect storefront sites
- **WebDAV Operations** (`b2c-webdav`) - File operations on instances
- **Sandbox Management** (`b2c-sandbox`) - Manage On-Demand Sandboxes
- **MRT Management** (`b2c-mrt`) - Manage Managed Runtime projects and deployments
- **SLAS Configuration** (`b2c-slas`) - Manage SLAS API clients and credentials

### Skills

Each skill is defined in the `b2c-cli/skills/` directory:

```
skills/b2c-cli/skills/
├── b2c-code/SKILL.md      # Code deployment commands
├── b2c-job/SKILL.md       # Job execution commands
├── b2c-mrt/SKILL.md       # Managed Runtime commands
├── b2c-sandbox/SKILL.md   # On-Demand Sandbox commands
├── b2c-sites/SKILL.md     # Sites commands
├── b2c-slas/SKILL.md      # SLAS commands
└── b2c-webdav/SKILL.md    # WebDAV commands
```

## Plugin: b2c

The `b2c` plugin provides skills for B2C Commerce development practices and patterns. When installed, Claude can help you with:

- **Custom API Development** (`b2c-custom-api-development`) - Build SCAPI Custom APIs with contracts, implementations, and mappings

### Skills

Each skill is defined in the `b2c/skills/` directory:

```
skills/b2c/skills/
└── b2c-custom-api-development/SKILL.md    # Custom API development guide
```

## For Contributors

When modifying CLI commands, update the corresponding skill in `skills/b2c-cli/skills/b2c-<topic>/SKILL.md` to keep documentation in sync.

## Using Skills with Other Agentic IDEs

The skills in this plugin follow the [Agent Skills](https://agentskills.io/home) standard and can be used with other AI-powered development tools like Cursor, GitHub Copilot, and OpenAI Codex.

### Option 1: CLI Setup Command

::: warning Coming Soon
The `b2c setup skills` command is not yet available. Use the manual method below for now.
:::

```bash
# Configure skills for your IDE (coming soon)
b2c setup skills --ide cursor
b2c setup skills --ide copilot
```

### Option 2: Manual Setup

Copy the skill files from [`skills/b2c-cli/skills/`](./b2c-cli/skills/) to your IDE's rules or instructions directory:

- **Cursor**: Copy to `.cursor/rules/` or configure in Cursor settings
- **GitHub Copilot**: Add to `.github/copilot-instructions.md`
- **Codex**: Configure per OpenAI Codex documentation

Each skill is a Markdown file (`SKILL.md`) containing instructions and examples that teach the AI about B2C Commerce CLI commands.

## Learn More

- [Agent Skills Standard](https://agentskills.io/home)
- [Claude Code Plugin Documentation](https://code.claude.com/docs/en/plugins)
- [Plugin Marketplaces](https://code.claude.com/docs/en/plugin-marketplaces)
- [B2C CLI Documentation](https://salesforcecommercecloud.github.io/b2c-developer-tooling/)
