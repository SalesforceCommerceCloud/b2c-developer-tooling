# Salesforce B2C Commerce MCP Server

Give your coding assistant Commerce documentation and workflow skills,
cartridge and Managed Runtime deployment, script debugging, logs, and SCAPI
discovery. Supports Codex, Claude Code, Cursor, GitHub Copilot, and other MCP
clients.

## Install

Requires Node.js 22.16 or later. Add this server command to your MCP client:

```bash
npx -y @salesforce/b2c-dx-mcp@latest --project-directory /absolute/path/to/project
```

See the [installation guide](https://salesforcecommercecloud.github.io/b2c-developer-tooling/mcp/installation)
for client-specific configuration and plugin installation.

## Capabilities and configuration

All toolsets are enabled by default. Use `--toolsets` or `--tools` to customize
what your assistant can access. Skills and documentation require no Commerce
credentials. Deployment, debugging, and observability require the relevant
instance or MRT access.

- [Tools and capabilities](https://salesforcecommercecloud.github.io/b2c-developer-tooling/mcp/toolsets)
- [Configuration](https://salesforcecommercecloud.github.io/b2c-developer-tooling/mcp/configuration)
- [Workflow skills](https://salesforcecommercecloud.github.io/b2c-developer-tooling/mcp/skills)
- [Security and access](https://salesforcecommercecloud.github.io/b2c-developer-tooling/mcp/security)

To expose skills and documentation only:

```bash
npx -y @salesforce/b2c-dx-mcp@latest --tools skills_read,docs_search,docs_read,docs_list
```

Telemetry is enabled by default. Disable it with `SFCC_DISABLE_TELEMETRY=true`
in your MCP client's server environment.

For development and testing, see [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

Apache License 2.0. See [license.txt](../../license.txt).
