---
description: Commands for viewing configuration, managing instances, installing AI agent skills, and generating IDE integration scripts.
---

# Setup Commands

Commands for viewing configuration, setting up the development environment, and generating IDE integration scripts.

## b2c setup inspect

Display the resolved configuration from all sources, showing which values are set and where they came from. Useful for debugging configuration issues.

**Alias:** `b2c setup config`

### Usage

```bash
b2c setup inspect [FLAGS]
```

### Flags

| Flag                     | Description                                                   | Default                  |
| ------------------------ | ------------------------------------------------------------- | ------------------------ |
| `--unmask`               | Show sensitive values unmasked (passwords, secrets, API keys) | `false`                  |
| `--account-manager-host` | Account Manager hostname for OAuth                            | `account.demandware.com` |
| `--cloud-origin`         | MRT cloud origin URL                                          | `https://cloud.mobify.com` |
| `--json`                 | Output results as JSON                                        | `false`                  |

### Examples

```bash
# Display resolved configuration (sensitive values masked)
b2c setup inspect

# Display configuration with sensitive values unmasked
b2c setup inspect --unmask

# Output as JSON for scripting
b2c setup inspect --json

# Debug configuration with a specific instance
b2c setup inspect -i staging
```

### Output

The command displays configuration organized by category:

- **Instance**: hostname, webdavHostname, codeVersion
- **Authentication (Basic)**: username, password
- **Authentication (OAuth)**: clientId, clientSecret, scopes, authMethods, accountManagerHost
- **SCAPI**: shortCode
- **Managed Runtime (MRT)**: mrtProject, mrtEnvironment, mrtApiKey, mrtOrigin
- **Metadata**: instanceName
- **Sources**: List of configuration sources that contributed values

Each value shows its source in brackets (e.g., `[dw.json]`, `[SFCC_CLIENT_ID]`, `[~/.mobify]`).

Example output:

```
Configuration
────────────────────────────────────────────────────────────

Instance
  hostname              my-sandbox.dx.commercecloud.salesforce.com  [DwJsonSource]
  webdavHostname        -
  codeVersion           version1                                     [DwJsonSource]

Authentication (Basic)
  username              admin                                        [DwJsonSource]
  password              admi...REDACTED                              [DwJsonSource]

Authentication (OAuth)
  clientId              my-client-id                                 [password-store]
  clientSecret          my-c...REDACTED                              [password-store]
  scopes                -
  authMethods           -
  accountManagerHost    -

SCAPI
  shortCode             abc123                                       [DwJsonSource]

Managed Runtime (MRT)
  mrtProject            my-project                                   [MobifySource]
  mrtApiKey             mrtk...REDACTED                              [MobifySource]

Sources
────────────────────────────────────────────────────────────
  1. DwJsonSource         /path/to/project/dw.json
  2. MobifySource         /Users/user/.mobify
  3. password-store       pass:b2c-cli/_default
```

### Sensitive Values

By default, sensitive fields are masked to prevent accidental exposure:

- `password` - Basic auth access key
- `clientSecret` - OAuth client secret
- `mrtApiKey` - MRT API key

Use `--unmask` to reveal the actual values when needed for debugging.

### See Also

- [Configuration Guide](/guide/configuration) - How to configure the CLI

## b2c setup ide

Show help for IDE integration setup commands.

### Usage

```bash
b2c setup ide
```

### Examples

```bash
# Show setup ide subcommands
b2c setup ide --help

# Vendor Script API TypeScript definitions for IDE IntelliSense
b2c setup ide vscode-types

# Print TS Server plugin path for LSP-based editors (Neovim, Helix, Zed, etc.)
b2c setup ide tsserver-plugin --json
```

## b2c setup ide vscode-types

Vendor B2C Commerce Script API TypeScript definitions and write a `jsconfig.json` into the workspace so any IDE that drives `tsserver` (plain VS Code, WebStorm, IntelliJ Ultimate, Neovim, Helix, Zed, Sublime Text) gets `dw/*` IntelliSense, hover docs, and signature help in cartridge JavaScript files.

The B2C DX VS Code extension does not need this command — it injects the same TypeScript Server plugin at runtime without writing files into your repo. Use this command only when you're not running the extension.

### Usage

```bash
b2c setup ide vscode-types [FLAGS]
```

### Flags

| Flag             | Description                                                       | Default          |
| ---------------- | ----------------------------------------------------------------- | ---------------- |
| `--output`, `-o` | Path for the generated `jsconfig.json` (relative to project root) | `jsconfig.json`  |
| `--force`, `-f`  | Overwrite output files if they already exist                      | `false`          |
| `--[no-]copy`    | Copy bundled types into `./.b2c-script-types/`                    | `true`           |
| `--json`         | Output results as JSON                                            | `false`          |

The generated `paths` mappings are written relative to the repo root, so `--output` is only intended for renaming the file itself (e.g., `--output jsconfig.cartridges.json`), not for relocating it into a subdirectory.

### Examples

```bash
# Default: write ./jsconfig.json and ./.b2c-script-types/types/ at the repo root
b2c setup ide vscode-types

# Re-vendor after upgrading the CLI
b2c setup ide vscode-types --force

# Regenerate jsconfig only (skip the type bundle copy; types must already be vendored)
b2c setup ide vscode-types --no-copy --force
```

### Output

The command produces:

- `./.b2c-script-types/types/` — vendored copy of the Script API definitions, version-pinned to the CLI release. Safe to commit.
- `./jsconfig.json` (or the path passed to `--output`) — TypeScript Language Service configuration mapping `dw/*` to the vendored types. Cartridge-relative requires (`~/cartridge/...`, `*/cartridge/...`) can't be expressed in standalone TypeScript `paths` mappings and will appear unresolved without the B2C DX VS Code extension.

See the [IDE Integration guide](/guide/ide-integration#script-api-intellisense) for editor-specific setup notes (Neovim, Helix, Zed, etc.).

## b2c setup ide tsserver-plugin

Print absolute paths to the bundled `@salesforce/b2c-script-types` TypeScript Server plugin and types directory. Use this when configuring an LSP-based editor (Neovim, Helix, Zed, Sublime, etc.) to load the plugin via `init_options.plugins[]` — full feature parity with the B2C DX VS Code extension, including cartridge-relative require resolution.

The command performs no filesystem writes; it just resolves and prints paths.

### Usage

```bash
b2c setup ide tsserver-plugin [FLAGS]
```

### Flags

| Flag     | Description            | Default |
| -------- | ---------------------- | ------- |
| `--json` | Output results as JSON | `false` |

### Examples

```bash
# Human-readable
b2c setup ide tsserver-plugin

# JSON for tooling (e.g. nvim-sfcc)
b2c setup ide tsserver-plugin --json
```

### Output

```json
{
  "pluginName": "@salesforce/b2c-script-types",
  "pluginPath": "/usr/local/lib/node_modules/@salesforce/b2c-cli/dist/script-types",
  "typesPath": "/usr/local/lib/node_modules/@salesforce/b2c-cli/dist/script-types/types",
  "version": "26.7.0"
}
```

Pass `pluginName` as `name` and `pluginPath` as `location` in your editor's `tsserver` `init_options.plugins[]` entry. The plugin auto-discovers cartridges in the project root and honors `dw.json`'s `cartridges` field for ordering — no host-side wiring needed.

## b2c setup instance list

List all configured B2C Commerce instances from dw.json.

### Usage

```bash
b2c setup instance list [FLAGS]
```

### Flags

| Flag               | Description                                                          | Default |
| ------------------ | -------------------------------------------------------------------- | ------- |
| `--columns`, `-c`  | Columns to display (comma-separated): name, hostname, source, active | All     |
| `--extended`, `-x` | Show all columns including extended fields                           | `false` |
| `--json`           | Output results as JSON                                               | `false` |

### Examples

```bash
# List all configured instances
b2c setup instance list

# Output as JSON
b2c setup instance list --json
```

### Output

The command displays a table of configured instances:

```
Instances
────────────────────────────────────────────────────────────
Name           Hostname                          Source        Active
production     prod.demandware.net               DwJsonSource
staging        staging.demandware.net            DwJsonSource  ✓
development    dev.demandware.net                DwJsonSource
```

## b2c setup instance create

Create a new B2C Commerce instance configuration in dw.json.

### Usage

```bash
b2c setup instance create [NAME] [FLAGS]
```

### Arguments

| Argument | Description   | Required          |
| -------- | ------------- | ----------------- |
| `NAME`   | Instance name | Yes (or prompted) |

### Flags

| Flag               | Description            | Default                   |
| ------------------ | ---------------------- | ------------------------- |
| `--hostname`, `-s` | B2C instance hostname  | Prompted                  |
| `--username`       | WebDAV username        |                           |
| `--password`       | WebDAV password        | Prompted if username set  |
| `--client-id`      | OAuth client ID        |                           |
| `--client-secret`  | OAuth client secret    | Prompted if client-id set |
| `--code-version`   | Code version           |                           |
| `--active`         | Set as active instance | `false`                   |
| `--force`          | Non-interactive mode   | `false`                   |
| `--json`           | Output results as JSON | `false`                   |

### Examples

```bash
# Interactive mode (prompts for all values)
b2c setup instance create staging

# Create with hostname
b2c setup instance create staging --hostname staging.example.com

# Create and set as active
b2c setup instance create staging --hostname staging.example.com --active

# Non-interactive mode (CI/CD)
b2c setup instance create staging --hostname staging.example.com --username admin --password secret --force
```

### Interactive Mode

When run without `--force`, the command provides an interactive experience:

1. Prompts for instance name (if not provided)
2. Prompts for hostname (if not provided)
3. Prompts for authentication type (Basic, OAuth, Both, or Skip)
4. Prompts for credentials based on selection
5. Asks whether to set as active instance
6. Shows summary and confirms before creating

## b2c setup instance remove

Remove a B2C Commerce instance configuration from dw.json.

### Usage

```bash
b2c setup instance remove NAME [FLAGS]
```

### Arguments

| Argument | Description             | Required |
| -------- | ----------------------- | -------- |
| `NAME`   | Instance name to remove | Yes      |

### Flags

| Flag      | Description              | Default |
| --------- | ------------------------ | ------- |
| `--force` | Skip confirmation prompt | `false` |
| `--json`  | Output results as JSON   | `false` |

### Examples

```bash
# Remove with confirmation
b2c setup instance remove staging

# Remove without confirmation
b2c setup instance remove staging --force
```

## b2c setup instance set-active

Set a B2C Commerce instance as the default (active) instance.

### Usage

```bash
b2c setup instance set-active NAME [FLAGS]
```

### Arguments

| Argument | Description                    | Required |
| -------- | ------------------------------ | -------- |
| `NAME`   | Instance name to set as active | Yes      |

### Flags

| Flag     | Description            | Default |
| -------- | ---------------------- | ------- |
| `--json` | Output results as JSON | `false` |

### Examples

```bash
# Set staging as the active instance
b2c setup instance set-active staging

# Set production as active
b2c setup instance set-active production
```

### How Active Instance Works

The active instance is used as the default when no `--instance` or `-i` flag is provided to other commands. This allows you to work with multiple instances without specifying which one to use each time.

Example workflow:

```bash
# Configure multiple instances
b2c setup instance create staging --hostname staging.example.com
b2c setup instance create production --hostname prod.example.com

# Set staging as active
b2c setup instance set-active staging

# Commands now use staging by default
b2c code list              # Uses staging
b2c code list -i production # Uses production
```

## b2c setup skills

Install agent skills from the B2C Developer Tooling project to AI-powered IDEs.

This command downloads skills from GitHub releases and installs them to the configuration directories of supported IDEs. Skills teach AI assistants about B2C Commerce development, CLI commands, and best practices.

### Usage

```bash
b2c setup skills [SKILLSET]
```

### Arguments

| Argument   | Description                              | Default                |
| ---------- | ---------------------------------------- | ---------------------- |
| `SKILLSET` | Skill set to install: `b2c`, `b2c-cli`, `storefront-next`, or `cap-dev` | Prompted interactively |

### Flags

| Flag                  | Description                                                                                    | Default     |
| --------------------- | ---------------------------------------------------------------------------------------------- | ----------- |
| `--list`, `-l`        | List available skills without installing                                                       | `false`     |
| `--skill`             | Install specific skill(s) (can be repeated)                                                    |             |
| `--ide`               | Target IDE(s): claude-code, cursor, windsurf, vscode, codex, opencode, agentforce-vibes, manual | Auto-detect |
| `--directory`, `-d`   | Custom installation directory (overrides IDE default path)                                     |             |
| `--global`, `-g`      | Install to user home directory (global scope)                                                  | `false`     |
| `--update`, `-u`      | Update existing skills (overwrite)                                                             | `false`     |
| `--version`           | Specific release version                                                                       | `latest`    |
| `--force`             | Skip confirmation prompts (non-interactive)                                                    | `false`     |
| `--columns`, `-c`     | Columns to display (comma-separated): name, description, skillSet, hasReferences               |             |
| `--extended`, `-x`    | Show all columns including extended fields                                                     | `false`     |
| `--json`              | Output results as JSON                                                                         | `false`     |

### Supported IDEs

| IDE Value          | IDE Name                 | Project Path          | Global Path                                         |
| ------------------ | ------------------------ | --------------------- | --------------------------------------------------- |
| `claude-code`      | Claude Code              | `.claude/skills/`     | `~/.claude/skills/`                                 |
| `cursor`           | Cursor                   | `.cursor/skills/`     | `~/.cursor/skills/`                                 |
| `windsurf`         | Windsurf                 | `.windsurf/skills/`   | `~/.codeium/windsurf/skills/`                       |
| `vscode`           | VS Code / GitHub Copilot | `.github/skills/`     | `~/.copilot/skills/`                                |
| `codex`            | OpenAI Codex CLI         | `.codex/skills/`      | `~/.codex/skills/`                                  |
| `opencode`         | OpenCode                 | `.opencode/skills/`   | `~/.config/opencode/skills/`                        |
| `agentforce-vibes` | Agentforce Vibes         | `.a4drules/skills/`   | `~/Library/Application Support/Code/User/globalStorage` (macOS) |
| `manual`           | Manual                   | `.agents/skills/`     | `~/.agents/skills/`                                 |

Use `agentforce-vibes` for Salesforce Agentforce for VS Code. Use `manual` for generic installation with a custom `--directory` path.

### Examples

```bash
# Interactive mode (prompts for skillset and IDEs)
b2c setup skills

# List available skills in a skillset
b2c setup skills b2c --list
b2c setup skills b2c-cli --list
b2c setup skills storefront-next --list

# Install b2c skills to Cursor (project scope)
b2c setup skills b2c --ide cursor

# Install b2c-cli skills to Cursor (global/user scope)
b2c setup skills b2c-cli --ide cursor --global

# Install to multiple IDEs
b2c setup skills b2c --ide cursor --ide windsurf

# Install specific skills only
b2c setup skills b2c-cli --skill b2c-code --skill b2c-webdav --ide cursor

# Install to Agentforce Vibes (.a4drules/skills/)
b2c setup skills b2c --ide agentforce-vibes

# Install to a custom directory
b2c setup skills b2c --ide manual --directory ./my-skills

# Update existing skills
b2c setup skills b2c --ide cursor --update

# Non-interactive mode (for CI/CD) - skillset required
b2c setup skills b2c-cli --ide cursor --global --force

# Install a specific version
b2c setup skills b2c --version v0.1.0 --ide cursor

# Output as JSON
b2c setup skills b2c --list --json
```

### Interactive Mode

When run without `--force`, the command provides an interactive experience:

1. Prompts you to select skill set(s) (if not provided as argument) - you can select multiple sets
2. Downloads skills from the latest release (or specified version)
3. Auto-detects installed IDEs
4. Prompts you to select target IDEs
5. Shows installation preview
6. Confirms before installing
7. Reports results

In non-interactive mode (`--force`), the skillset argument is required.

### Claude Code Recommendation

For Claude Code users, we recommend using the plugin marketplace for automatic updates:

```bash
claude plugin marketplace add SalesforceCommerceCloud/b2c-developer-tooling
claude plugin install b2c-cli
claude plugin install b2c
claude plugin install storefront-next
# Add storefront-next-figma for Figma design-kit workflows (requires the Figma MCP server)
claude plugin install storefront-next-figma
```

The marketplace provides:

- Automatic updates when new versions are released
- Centralized plugin management
- Version tracking

Use `--ide manual` if you prefer manual installation, or `--ide agentforce-vibes` to install to the `.a4drules/skills/` directory used by Salesforce Agentforce for VS Code.

### Skill Sets

| Skill Set               | Description                                                         |
| ----------------------- | ------------------------------------------------------------------- |
| `b2c`                   | B2C Commerce development patterns and practices                     |
| `b2c-cli`               | B2C CLI commands and operations                                     |
| `storefront-next`       | Storefront Next development — routing, components, deployment       |
| `storefront-next-figma` | Storefront Next Figma design-kit workflows (requires Figma MCP server) |
| `cap-dev`               | Commerce App Package scaffolding, validation, and submission        |

### Output

When installing, the command reports:

- Successfully installed skills with paths
- Skipped skills (already exist, use `--update` to overwrite)
- Errors encountered during installation

Example output:

```
Downloading skills from release latest...
Detecting installed IDEs...
Installing 12 skills to Cursor (project)

Successfully installed 12 skill(s):
  - b2c-code → .cursor/skills/b2c-code/
  - b2c-webdav → .cursor/skills/b2c-webdav/
  ...
```

### Environment

Skills are downloaded from the GitHub releases of the [b2c-developer-tooling](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling) repository:

| Artifact             | Contents                                     |
| -------------------- | -------------------------------------------- |
| `b2c-cli-skills.zip` | Skills for B2C CLI commands and operations   |
| `b2c-skills.zip`     | Skills for B2C Commerce development patterns |

Downloaded artifacts are cached locally at: `~/.cache/b2c-cli/skills/{version}/{skillset}/`

### See Also

- [Agent Skills & Plugins Guide](/guide/agent-skills) - Overview of available skills
- [Claude Code Skills Documentation](https://claude.ai/code) - Claude Code skill format
- [Cursor Skills Documentation](https://cursor.com/docs/skills) - Cursor skill format. Cursor also auto-loads skills from `.claude/skills/` and `~/.claude/skills/`, so `--ide claude-code` installs are picked up by Cursor automatically.
