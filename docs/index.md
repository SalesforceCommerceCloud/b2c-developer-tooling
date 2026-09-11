---
description: Tools and guides for building, debugging, deploying, and managing Salesforce B2C Commerce.
pageClass: toolkit-overview
aside: false
outline: false
---

# Agentic B2C Developer Toolkit

<div class="page-lead">

Build, debug, deploy, and manage Salesforce B2C Commerce from your terminal, editor, or AI assistant.

</div>

<div class="cli-intro">

<div class="cli-intro-copy">

Build from your terminal. Manage code versions, check Custom APIs, run jobs, and automate everyday B2C Commerce tasks.

<div class="overview-actions">

<a class="primary-cta" href="./guide/installation">Install the B2C CLI</a>

[Get started](./guide/)

</div>

</div>

<figure class="cli-preview">

![B2C CLI listing code versions and checking the registration status of Custom APIs.](./public/cli-workflow.png)

</figure>

</div>

## Tools

<DocCards>

[![](/icons/cli.svg) CLI](./cli/overview)
Deploy cartridges, run jobs, manage sandboxes, and automate your B2C Commerce workflows.

[![](/icons/editor.svg) IDE Extension](./vscode-extension/)
Sync code, explore your instance, and debug server-side scripts in your editor.

[![](/icons/mcp.svg) MCP](./mcp/)
Debug, deploy, and manage B2C Commerce with nearly 600 API operations in your AI assistant.

[![](/icons/skills.svg) Agent Skills](./guide/agent-skills)
Explore expertise for B2C Commerce, B2C CLI, and Storefront Next. Included with the MCP or available through plugins.

</DocCards>

## Developer Tasks

<DocCards>

[Develop a Storefront Next storefront](./guide/storefront-next)
Set up your development environment and start building a storefront.

[Debug cartridge code](./guide/script-debugger)
Set breakpoints and inspect server-side scripts in your editor.

[Deploy code and metadata](./guide/import-sets)
Apply project configuration and metadata changes with import sets.

[CI/CD with GitHub Actions](./guide/ci-cd)
Automate builds, deployments, and other repeatable B2C Commerce tasks.

</DocCards>

## Administrator and Merchant Tasks

<DocCards>

[Manage users and API clients](./guide/account-manager)
Review users, roles, organizations, and API access in Account Manager.

[Investigate job failures](./mcp/toolsets#scapi-code-mode)
Ask your assistant to review job executions and identify recurring failures.

[Work with products and promotions](./mcp/toolsets#scapi-code-mode)
Create products, assign catalog categories, and review campaign promotions with your assistant.

[Explore analytics reports](./guide/analytics-reports-cip-ccac)
Query B2C Commerce data and turn operational reports into useful answers.

</DocCards>

## More Resources

<DocCards>

[All Guides](./guide/workflows)
Find practical workflows for development, deployment, administration, and migration.

[CLI Extensions](./guide/third-party-plugins)
Add integrations and commands to fit your team's workflow.

[Tooling SDK](./api/)
Build custom integrations and automation with typed TypeScript APIs.

</DocCards>
