---
description: Built-in workflow skills for B2C CLI, Commerce development, and Storefront Next, available through the B2C DX MCP Server.
---

# Workflow Skills

The B2C DX MCP Server includes workflow skills for your coding assistant,
covering cartridge deployment, debugging, B2C Commerce development, and
Storefront Next. These skills are included with the MCP installation and work
offline. You do not need a separate skills plugin or Commerce credentials to
access them.

## Included capabilities

The `skills_read` tool gives your assistant access to:

- **B2C CLI workflows** for deployment, configuration, debugging, jobs, and site archive imports/exports.
- **B2C Commerce development skills** for cartridges, platform APIs, and storefront implementation.
- **Storefront Next skills** for building and extending your storefront.
- **MCP skills** for server setup, tool selection, Commerce configuration, debugging, and SCAPI code mode.

Clients that support MCP resources can also browse the skill index and open
skills directly. Both access methods include the same skill library.

For example, you can ask your assistant to help prepare a cartridge deployment,
investigate a controller issue, or add a Storefront Next component. The skills
complement the MCP's [documentation tools](./tools/docs), which provide API
references and product documentation.

## Installation and configuration

Follow the [MCP installation guide](./installation) for your client. Skills are
enabled with every toolset and need no additional configuration.

MCP setup, configuration, debugger, and SCAPI skills remain available as resources
with any tool selection. If you select individual tools with `--tools`, include
`skills_read` to access the broader B2C, CLI, and Storefront Next collections.
To make only skills available:

```bash
npx -y @salesforce/b2c-dx-mcp@latest --tools skills_read
```

The `--docs-topics` setting applies to documentation tools; it does not restrict
workflow skills. Access to skills does not enable additional operational
tools. See [Toolsets & Tools](./toolsets) to choose the capabilities your assistant
can use.

## Access and security

Reading skills does not connect to your Commerce instance or modify your
project or remote systems. It requires no Commerce credentials and grants no
additional access to your environments.

Operations such as deployment and debugging are performed by separate tools
with their own configuration and permissions. See [MCP configuration](./configuration)
and [authentication setup](../guide/authentication) for credential and scope requirements.
