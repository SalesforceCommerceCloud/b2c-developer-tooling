---
description: B2C CLI tools for developing, deploying, and administering Salesforce B2C Commerce from the terminal and CI/CD.
---

# B2C CLI

Develop, deploy, and administer Salesforce B2C Commerce from your terminal or
CI/CD pipeline. Manage cartridges, sandboxes, jobs, storefront deployments,
and platform access with the `b2c` command.

## Quick install

```bash
npm install -g @salesforce/b2c-cli
b2c --help
```

See [installation](../guide/installation) for package-manager options and
[configuration](../guide/configuration) to connect your environments.

![B2C CLI listing code versions, with the active and rollback versions identified.](/cli-code-versions.png)

## What you can do

| Task                          | Commands                                                                         |
| ----------------------------- | -------------------------------------------------------------------------------- |
| Develop and debug cartridges  | [Code](./code), [Scaffold](./scaffold), [Debug](./debug)                         |
| Deploy and automate           | [Jobs](./jobs), [MRT](./mrt), [Granular Replications](./replications)            |
| Manage environments and data  | [Sandbox](./sandbox), [Sites](./sites), [WebDAV](./webdav), [Content](./content) |
| Check Custom API registration | [Custom APIs](./custom-apis)                                                     |
| Investigate operations        | [Logs](./logs), [Metrics](./metrics), [CIP Analytics](./cip)                     |
| Manage access                 | [Account Manager](./account-manager), [Business Manager](./bm), [SLAS](./slas)   |

The [command reference](./index) covers all command families and global options.
See [CI/CD](../guide/ci-cd) for automation and [CLI extensions](../guide/third-party-plugins)
for additional integrations.

## Other ways to work

Use the [MCP server](../mcp/) for tools and B2C Commerce skills in your AI assistant,
or the [IDE extension](../vscode-extension/) for editor workflows. They share
B2C configuration with the CLI.
