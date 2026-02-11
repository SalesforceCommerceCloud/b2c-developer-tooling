---
description: Set up Storefront Next development environments using the B2C CLI to create sandboxes, SLAS clients, MRT environments, and deploy.
---

# Storefront Next

::: warning Pilot Preview
Storefront Next is currently in pilot. Access to Storefront Next is limited to pilot customers. Features and configuration may change.
:::

This guide walks through setting up the infrastructure for a Storefront Next project using the B2C CLI. The steps cover creating a sandbox, configuring SLAS authentication, setting up an MRT environment, configuring environment variables, and deploying. Not all steps are required — skip any that are already complete for your project.

## Prerequisites

- [B2C CLI installed](/guide/installation) or use `npx @salesforce/b2c-cli` to run commands without installing
- Commerce Cloud realm access
- A Storefront Next project
- Appropriate Account Manager roles (detailed per step below)

## Step 1: Create an On-Demand Sandbox (Optional)

If you need a new sandbox instance for development, create one with the CLI.

**Required Role:** Sandbox API User (see [Authentication Setup](/guide/authentication))

```bash
b2c sandbox create --realm <REALM> --wait
```

Note the hostname from the output — you'll need it for later configuration.

After creating a sandbox, you'll need to create or import sites. You can import SFRA in Business Manager under **Administration > Site Development > Site Import & Export**.

See [Sandbox Commands](/cli/sandbox) for more options.

## Step 2: Create a SLAS Client

Create a SLAS client for your storefront to handle shopper authentication.

**Required Role:** SLAS Organization Administrator with a tenant filter matching your tenant.

Your tenant ID is found in Business Manager under **Administration > Site Development > Salesforce Commerce API Settings**. It is the organization ID without the `f_ecom_` prefix — for example, if your organization ID is `f_ecom_abcd_001`, your tenant ID is `abcd_001`. You can pass either form to the `--tenant-id` flag and the CLI will handle it.

```bash
b2c slas client create \
  --tenant-id <TENANT_ID> \
  --channels <SITE_ID> \
  --redirect-uri "http://localhost:5173,https://*.exp-delivery.com/callback" \
  --default-scopes
```

The client is created as a private client by default (no `--public` flag needed).

::: warning
Save the client ID and secret from the output — the secret is only shown once and cannot be retrieved later.
:::

See [SLAS Commands](/cli/slas) for more options.

## Step 3: Create an MRT Environment

Set up a Managed Runtime environment to host your storefront.

**Prerequisites:**
- An MRT API key from [runtime.commercecloud.com](https://runtime.commercecloud.com/)
- An MRT project (see [`b2c mrt project create`](/cli/mrt#b2c-mrt-project-create) to create one)

::: tip
Configure your API key in `~/.mobify`, `dw.json`, or via the `SFCC_MRT_API_KEY` environment variable so you don't need to pass it on every command. See [Configuration](/guide/configuration) for all available options.
:::

Find your short code in Business Manager under **Administration > Salesforce Commerce API Settings**.

```bash
b2c mrt env create <SLUG> \
  --project <PROJECT> \
  --name "<NAME>" \
  --allow-cookies \
  --proxy "api=<SHORT_CODE>.api.commercecloud.salesforce.com" \
  --wait
```

### Connect the B2C Commerce Instance

After creating the environment, link it to your B2C Commerce instance by setting the tenant and site IDs:

```bash
b2c mrt env b2c -p <PROJECT> -e <ENVIRONMENT> \
  --instance-id <TENANT_ID> \
  --sites <SITE_ID>
```

See [MRT Commands](/cli/mrt) for more options.

## Step 4: Set Environment Variables

Configure your MRT environment with the required Storefront Next variables.

Your organization ID and short code are found in Business Manager under **Administration > Site Development > Salesforce Commerce API Settings**. The organization ID has the form `f_ecom_abcd_001`.

```bash
b2c mrt env var set \
  PUBLIC__app__commerce__api__clientId=<SLAS_CLIENT_ID> \
  PUBLIC__app__commerce__api__organizationId=<ORG_ID> \
  PUBLIC__app__commerce__api__siteId=<SITE_ID> \
  PUBLIC__app__commerce__api__shortCode=<SHORT_CODE> \
  PUBLIC__app__commerce__api__proxy=/mobify/proxy/api \
  PUBLIC__app__commerce__api__callback=/callback \
  PUBLIC__app__commerce__api__privateKeyEnabled=true \
  COMMERCE_API_SLAS_SECRET=<SLAS_CLIENT_SECRET> \
  PUBLIC__app__defaultSiteId=<SITE_ID> \
  -p <PROJECT> -e <ENVIRONMENT>
```

### Variable Reference

| Variable | Description |
|----------|-------------|
| `PUBLIC__app__commerce__api__clientId` | SLAS client ID from Step 2 |
| `PUBLIC__app__commerce__api__organizationId` | Commerce Cloud organization ID (e.g., `f_ecom_aaaa_prd`) |
| `PUBLIC__app__commerce__api__siteId` | Site ID (e.g., `RefArch`) |
| `PUBLIC__app__commerce__api__shortCode` | Short code from Business Manager |
| `PUBLIC__app__commerce__api__proxy` | Proxy path for API requests |
| `PUBLIC__app__commerce__api__callback` | OAuth callback path |
| `PUBLIC__app__commerce__api__privateKeyEnabled` | Must be `true` for private SLAS clients |
| `COMMERCE_API_SLAS_SECRET` | SLAS client secret from Step 2 |
| `PUBLIC__app__defaultSiteId` | Default site ID for the storefront |

Most of these values match what's in your project's `.env` file. The `privateKeyEnabled` variable must be set to `true` when using a private SLAS client.

::: warning
The `COMMERCE_API_SLAS_SECRET` contains sensitive credentials. Treat it accordingly and avoid committing it to source control.
:::

::: tip
If your project uses multiple sites, you can also set `PUBLIC__app__commerce__sites` with your sites configuration.
:::

## Step 5: Deploy

Deploy your Storefront Next project from the project directory.

**Primary method** using the Storefront Next CLI:

```bash
pnpm sfnext push --project-slug <PROJECT> --target <ENVIRONMENT>
```

This is run from your Storefront Next project directory.

**Alternative** using the B2C CLI directly (builds and deploys):

```bash
b2c mrt bundle deploy -p <PROJECT> -e <ENVIRONMENT> \
  --ssr-only '["server/**/*", "loader.js", "sfnext-server-*.mjs", "streamingHandler.{js,mjs,cjs}", "streamingHandler.{js,mjs,cjs}.map", "!static/**/*", "!**/*.stories.tsx", "!**/*.stories.ts", "!**/*-snapshot.tsx", "!.storybook/**/*", "!storybook-static/**/*", "!**/__mocks__/**/*", "!**/__snapshots__/**/*"]' \
  --ssr-shared '["client/**/*", "static/**/*", "**/*.css", "**/*.png", "**/*.jpg", "**/*.jpeg", "**/*.gif", "**/*.svg", "**/*.ico", "**/*.woff", "**/*.woff2", "**/*.ttf", "**/*.eot", "!**/*.stories.tsx", "!**/*.stories.ts", "!**/*-snapshot.tsx", "!.storybook/**/*", "!storybook-static/**/*", "!**/__mocks__/**/*", "!**/__snapshots__/**/*"]'
```

These patterns match the defaults used by `pnpm sfnext push`. The `--ssr-only` and `--ssr-shared` flags accept either a JSON array (for patterns with brace expansion) or a comma-separated string, and can be overridden if your project structure differs.

## Summary

| Step | Command | Required? |
|------|---------|-----------|
| 1. Create Sandbox | `b2c sandbox create` | Optional |
| 2. Create SLAS Client | `b2c slas client create` | Yes |
| 3. Create MRT Environment | `b2c mrt env create` | Yes |
| 4. Set Environment Variables | `b2c mrt env var set` | Yes |
| 5. Deploy | `pnpm sfnext push` or `b2c mrt bundle deploy` | Yes |

## Next Steps

- [Configuration](/guide/configuration) — configure CLI defaults and credentials
- [Authentication Setup](/guide/authentication) — detailed auth setup for all commands
- [Sandbox Commands](/cli/sandbox) — manage on-demand sandboxes
- [SLAS Commands](/cli/slas) — manage SLAS clients and tenants
- [MRT Commands](/cli/mrt) — manage MRT projects, environments, and deployments
