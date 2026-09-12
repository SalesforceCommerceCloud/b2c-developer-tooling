---
description: Support Storefront Next development and operations with the B2C CLI, MCP, and agent skills. Manage environment variables, tail logs, and work with deployments.
---

# Storefront Next

Develop and operate your Storefront Next storefront with the B2C CLI and your AI assistant. Manage environment variables together, investigate runtime errors, and get help with routing, data fetching, and Page Designer components.

<span id="step-1-create-an-on-demand-sandbox-optional"></span>
<span id="step-2-create-a-slas-client"></span>
<span id="step-3-create-an-mrt-environment"></span>
<span id="connect-the-b2c-commerce-instance"></span>

## Start with Storefront Setup

Use **storefront setup in Business Manager** to create your storefront and its API clients, Managed Runtime project, default environment, and initial configuration. Follow the Salesforce guide for your source-code workflow:

- [Create Storefront Next with a GitHub repository](https://developer.salesforce.com/docs/commerce/sfnext/guide/sfnext-quick-start-create-bm-github.html)
- [Create Storefront Next with local code](https://developer.salesforce.com/docs/commerce/sfnext/guide/sfnext-quick-start-create-bm.html)

Use the generated configuration for local development and the existing MRT resources for the operations below. For additional environments and production launch, follow [Launch Your Storefront Next](https://developer.salesforce.com/docs/commerce/sfnext/guide/sfnext-mrt-launch-storefront.html).

## Prerequisites

Use an existing Storefront Next project and an MRT API key with access to its project and target environment. See [CLI installation](/guide/installation) and [MRT configuration](/guide/configuration#mrt-api-key) for credentials and defaults. You can also replace `b2c` in these examples with `npx @salesforce/b2c-cli`.

Replace `my-storefront` and `staging` with your MRT project and environment IDs.

<span id="step-4-set-environment-variables"></span>
<span id="variable-reference"></span>
<span id="multi-site-configuration"></span>

## Manage Environment Variables

Storefront setup configures the initial MRT variables. Use the CLI to inspect or change selected values as your storefront evolves. Salesforce's [Environment Variables guide](https://developer.salesforce.com/docs/commerce/sfnext/guide/sfnext-mrt-environment-vars.html) covers naming, visibility, and supported configuration paths.

### Update Several Values Together

```bash
# Inspect the target environment's variables.
b2c mrt env var list --project my-storefront --environment staging

# Set locale defaults together in one update.
b2c mrt env var set \
  PUBLIC__app__i18n__fallbackLng=en-US \
  'PUBLIC__app__i18n__supportedLngs=["en-US","fr-FR"]' \
  --project my-storefront --environment staging
```

Use locales supported by your storefront and sites. Variable changes redeploy the environment; wait for that deployment before checking the result. Keep secrets out of `PUBLIC__` variables, which are exposed to the browser.

### Apply an Environment File

Keep the values intended for each MRT environment in a separate file. Review the proposed changes before applying them:

```bash
b2c mrt env var push --file .env.staging \
  --project my-storefront --environment staging
```

The command compares the file with the target, shows the differences, and asks for confirmation. It leaves remote variables absent from the file unchanged and excludes `MRT_` variables by default. Review local-only values and instance-specific credentials before sharing configuration across environments; keep files containing secrets out of source control.

See [MRT environment variable commands](/cli/mrt#environment-variable-commands) for individual updates, removal, and file options.

<span id="step-6-debugging-with-log-tailing"></span>

## Tail Application Logs

Stream logs while reproducing a server-rendering error or checking a deployment:

```bash
b2c mrt tail-logs --project my-storefront --environment staging

# Show errors and warnings.
b2c mrt tail-logs --project my-storefront --environment staging \
  --level ERROR --level WARN

# Match an error or request pattern.
b2c mrt tail-logs --project my-storefront --environment staging \
  --search 'timeout|500'
```

Press Ctrl+C to stop. See [Logging in Storefront Next](https://developer.salesforce.com/docs/commerce/sfnext/guide/sfnext-logging.html) for application logging conventions. For historical investigation across MRT, SLAS, and eCDN, follow [Debug Your Storefront Next Site Using Log Center](https://developer.salesforce.com/docs/commerce/sfnext/guide/sfnext-debug-log-center.html).

<span id="step-5-deploy"></span>

## Work with Deployments

For source builds and uploads, follow the [Storefront Next deployment workflow](https://developer.salesforce.com/docs/commerce/sfnext/guide/sfnext-push-mrt-auto.html) using the template's `push` package script (`sfnext push`). It uses the MRT resources created during setup.

Use the B2C CLI to inspect uploaded bundles or deploy an existing bundle to a selected environment:

```bash
b2c mrt bundle list --project my-storefront

# Deploy a reviewed bundle; replace 12345 with its ID.
b2c mrt bundle deploy 12345 --project my-storefront --environment staging
```

For release automation, see [MRT commands](/cli/mrt#bundle-commands) and [CI/CD with GitHub Actions](/guide/ci-cd). For vanity domains, routing, and access-control headers, use the [Storefront Next launch guide](https://developer.salesforce.com/docs/commerce/sfnext/guide/sfnext-mrt-launch-storefront.html) alongside the [eCDN commands](/cli/ecdn).

## Work with Your AI Assistant

The [B2C MCP](/mcp/) includes Storefront Next skills for routing, data fetching, configuration, Page Designer, testing, and deployment. Your assistant can use that guidance alongside documentation search and the toolkit's operations. No separate skills installation is needed; [standalone Agent Skills](/guide/agent-skills) are also available.

<ExamplePrompt>

> Review my Storefront Next project's configuration and the staging MRT environment. Identify differences relevant to this deployment and explain the proposed changes before applying them.

</ExamplePrompt>

<ExamplePrompt>

> Add a Page Designer component with an editable heading, image, and link. Follow the patterns in this Storefront Next project and explain how to preview it.

</ExamplePrompt>

MRT environment-variable management and log tailing use the B2C CLI, so make it available when asking your assistant to perform those tasks.

## Next Steps

- [Storefront Next documentation](https://developer.salesforce.com/docs/commerce/sfnext/guide/sfnext-get-started.html) - Platform setup and development guides.
- [Manage Sites for Storefront Next](https://developer.salesforce.com/docs/commerce/sfnext/guide/sfnext-manage-sites.html) - Site assignments in Business Manager.
- [Deploy the Page Designer cartridge](https://developer.salesforce.com/docs/commerce/sfnext/guide/sfnext-pd-deploy-cartridge.html) - Publish component metadata to your B2C Commerce instance.
- [Operations](/guide/operations) - Investigate job health and checkout incidents with your assistant.
