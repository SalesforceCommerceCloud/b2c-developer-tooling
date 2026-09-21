---
description: Salesforce B2C Commerce tools for developers, administrators, and AI agents.
pageClass: toolkit-overview
aside: false
outline: false
---

# Agentic B2C Developer Toolkit

<div class="page-lead">

Salesforce B2C Commerce tools for developers, administrators, and AI agents.

</div>

<div class="cli-intro">

<div class="cli-intro-copy">

Build storefronts, deploy code, investigate issues, and manage your sites from your terminal, editor, or AI assistant.

<div class="overview-actions">

<a class="primary-cta" href="./guide/">Get started</a>

<a class="secondary-cta" href="./guide/installation">Install the B2C CLI</a>

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

[![](/icons/mcp.svg) MCP / Agent Skills](./mcp/)
Connect your assistant to B2C Commerce documentation, live tools, nearly 600 API operations, and workflow skills.

</DocCards>

## Developer Tasks

<div class="workflow-feature">

<div>

### Find the cause of a storefront bug

Let your assistant inspect live cartridge execution and connect what it finds to your source code.

<ExamplePrompt>

> This controller returns the wrong result in my sandbox. Inspect the variables while I reproduce the request, explain the cause, and recommend a fix. Don't change the code yet.

</ExamplePrompt>

[Debug with your assistant](./guide/script-debugger#debug-with-your-assistant) &middot; [Explore the MCP](./mcp/)

</div>

<figure>

[![Claude Code using the B2C MCP debugger to investigate why a loyalty controller returns before calling its service, with breakpoints in loyalty.js.](/terminal/mcp-claude-debugging.png)](/terminal/mcp-claude-debugging.png)

</figure>

</div>

<DocCards>

[Search Salesforce documentation](./mcp/toolsets#documentation)
Get answers grounded in B2C Commerce documentation, with examples and links to the sources.

[Deploy code and metadata](./guide/import-sets)
Apply project configuration and metadata changes with import sets.

[CI/CD with GitHub Actions](./guide/ci-cd)
Automate builds, deployments, and other repeatable B2C Commerce tasks.

</DocCards>

## Administrator and Merchant Tasks

<div class="workflow-feature">

<div>

### Investigate failed orders

Use the MCP and operations skills to connect failed orders with payment errors
and job updates. Understand the impact and prepare evidence for the team that
can help.

<ExamplePrompt>

> Investigate failed orders on my site over the last two hours. Look for patterns in affected products and payment errors, and prepare a handoff with the evidence. Don't change orders or retry payments.

</ExamplePrompt>

[Explore operations workflows](./guide/operations)

</div>

<figure>

[![ChatGPT investigating order failures, identifying affected products and payment rejections, and correlating them with a tax-class import failure.](/screenshots/mcp-order-investigation.png)](/screenshots/mcp-order-investigation.png)

</figure>

</div>

<DocCards>

[Manage users and API clients](./guide/account-manager)
Review users, roles, organizations, and API access in Account Manager.

[Review campaigns and promotions](./mcp/#administrator-and-merchant-tasks)
Check campaign schedules and identify promotions that need attention before launch.

[Explore analytics reports](./guide/analytics-reports-cip-ccac)
Query B2C Commerce data and turn operational reports into useful answers.

</DocCards>

## More Resources

<DocCards>

[Search B2C Commerce documentation](./mcp/#b2c-commerce-documentation)
Ask your assistant about APIs, Business Manager, or merchandising, with references to Salesforce documentation.

[CLI Extensions](./guide/third-party-plugins)
Add integrations and commands to fit your team's workflow.

[Tooling SDK](./api/)
Build custom integrations and automation with typed TypeScript APIs.

</DocCards>
