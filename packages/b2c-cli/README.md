# Salesforce B2C Commerce CLI

[![npm](https://img.shields.io/npm/v/@salesforce/b2c-cli.svg)](https://www.npmjs.com/package/@salesforce/b2c-cli)
[![License](https://img.shields.io/npm/l/@salesforce/b2c-cli.svg)](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/blob/main/license.txt)

Develop, deploy, and administer Salesforce B2C Commerce from your terminal or CI/CD pipeline.

**[Documentation](https://salesforcecommercecloud.github.io/b2c-developer-tooling/cli/overview)** ·
**[Command reference](https://salesforcecommercecloud.github.io/b2c-developer-tooling/cli/)** ·
**[Configuration](https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/configuration)**

![B2C CLI listing code versions and checking the registration status of Custom APIs.](https://salesforcecommercecloud.github.io/b2c-developer-tooling/cli-workflow.png)

## Install

Requires Node.js 22.16 or later.

```bash
npm install -g @salesforce/b2c-cli
b2c --help
```

See [configuration](https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/configuration)
to connect your B2C Commerce instances.

## What you can do

```bash
b2c code deploy                                # Deploy cartridges
b2c job run my-job --wait                      # Run a job
b2c sandbox create --realm abcd                # Create an on-demand sandbox
b2c mrt bundle deploy --project my-storefront  # Deploy a Managed Runtime storefront
b2c logs tail                                  # Stream instance logs
```

| Task                         | Commands                                                                                                                                                                                                                                                                             |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Develop and debug cartridges | [Code](https://salesforcecommercecloud.github.io/b2c-developer-tooling/cli/code), [Scaffold](https://salesforcecommercecloud.github.io/b2c-developer-tooling/cli/scaffold), [Debug](https://salesforcecommercecloud.github.io/b2c-developer-tooling/cli/debug)                       |
| Deploy and automate          | [Jobs](https://salesforcecommercecloud.github.io/b2c-developer-tooling/cli/jobs), [MRT](https://salesforcecommercecloud.github.io/b2c-developer-tooling/cli/mrt), [CI/CD](https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/ci-cd)                               |
| Manage environments and data | [Sandbox](https://salesforcecommercecloud.github.io/b2c-developer-tooling/cli/sandbox), [Sites](https://salesforcecommercecloud.github.io/b2c-developer-tooling/cli/sites), [WebDAV](https://salesforcecommercecloud.github.io/b2c-developer-tooling/cli/webdav)                     |
| Investigate operations       | [Logs](https://salesforcecommercecloud.github.io/b2c-developer-tooling/cli/logs), [CIP Analytics](https://salesforcecommercecloud.github.io/b2c-developer-tooling/cli/cip)                                                                                                           |
| Manage access                | [Account Manager](https://salesforcecommercecloud.github.io/b2c-developer-tooling/cli/account-manager), [Business Manager](https://salesforcecommercecloud.github.io/b2c-developer-tooling/cli/bm), [SLAS](https://salesforcecommercecloud.github.io/b2c-developer-tooling/cli/slas) |

## Other ways to work

Use the [B2C MCP server](https://www.npmjs.com/package/@salesforce/b2c-dx-mcp) to bring B2C Commerce
tools and skills to your AI assistant, or the
[IDE extension](https://salesforcecommercecloud.github.io/b2c-developer-tooling/vscode-extension/)
for editor workflows.

## License

Apache License 2.0. See [license.txt](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/blob/main/license.txt).
