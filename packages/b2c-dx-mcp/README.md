# Salesforce B2C Commerce MCP Server

The B2C DX MCP Server provides B2C Commerce documentation, development skills,
debugging, deployment, and API access for your AI assistant.

## Get started

**Install the B2C MCP plugin** for Codex, Claude Code, or GitHub Copilot.
Choose your client in the
[installation guide](https://salesforcecommercecloud.github.io/b2c-developer-tooling/mcp/installation).
Requires Node.js 22.16 or later. Documentation and skills work without B2C Commerce
credentials; connect an instance when you want to use live tools.

Direct MCP registration is available for other clients or advanced configuration:

```bash
npx -y @salesforce/b2c-dx-mcp@latest
```

## Learn more

- [What you can do](https://salesforcecommercecloud.github.io/b2c-developer-tooling/mcp/)
- [Tool reference](https://salesforcecommercecloud.github.io/b2c-developer-tooling/mcp/toolsets)
- [Configuration](https://salesforcecommercecloud.github.io/b2c-developer-tooling/mcp/configuration)
- [Agent Skills & Plugins](https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/agent-skills)
- [Security and access](https://salesforcecommercecloud.github.io/b2c-developer-tooling/mcp/security)

Telemetry is enabled by default. Disable it with `SFCC_DISABLE_TELEMETRY=true`
in the environment that launches the server. For development and testing,
see [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

Apache License 2.0. See [license.txt](../../license.txt).
