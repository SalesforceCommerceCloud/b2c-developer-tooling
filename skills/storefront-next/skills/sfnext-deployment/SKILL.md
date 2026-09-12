---
name: sfnext-deployment
description: Build and deploy Storefront Next storefronts to Managed Runtime (MRT) using the sfnext CLI. Use when running production builds, pushing bundles to MRT with sfnext push, configuring deployment environments, or deploying Page Designer cartridges. This is for Storefront Next deployment — for general MRT management via b2c CLI, see b2c-cli:b2c-mrt.
---

# Deployment Skill

This skill covers building and deploying Storefront Next storefronts to Managed Runtime (MRT).

## Overview

Storefront Next storefronts are deployed to MRT as bundles. The `sfnext` CLI handles building and pushing bundles, while environment configuration is managed through MRT environment variables.

Reuse the MRT project, environment, and credentials created by Business Manager
storefront setup. Follow the [deployment guide](https://developer.salesforce.com/docs/commerce/sfnext/guide/sfnext-push-mrt-auto.html)
for source deployments and the [launch guide](https://developer.salesforce.com/docs/commerce/sfnext/guide/sfnext-mrt-launch-storefront.html)
for staging/production rollout. Creating new SLAS clients or MRT resources is not
a prerequisite to each deployment.

## Production Build

```bash
# Build for production
pnpm build

# The build output goes to build/ directory
```

The production build:

- Compiles TypeScript to JavaScript
- Bundles client and server code separately
- Optimizes and minifies assets
- Generates the static Page Designer registry

## Deploying to MRT

### Using the Template's Push Script

Use the project's `push` script (`sfnext push --project-directory .`). Build first;
the push command requires existing build output. With the template's pnpm setup:

```bash
# Push the current build to MRT
pnpm run push

# Push with a specific message
pnpm run push --message "Release v1.2.0"

# Push to a specific environment
pnpm run push --environment staging --wait
```

### Deployment Flow

```
pnpm run build → pnpm run push → MRT receives bundle → Deployed to environment
```

See [MRT Deployment Reference](references/MRT-DEPLOYMENT.md) for detailed deployment options.

## Environment Configuration

Environment variables for MRT are configured through:

1. **Runtime Admin or `b2c mrt env var set/push`** — Set application variables per environment; `PUBLIC__` values merge into runtime configuration and are browser-visible. Changes redeploy the environment.
2. **CLI flags or `MRT_*` environment variables** — Control push/deploy targets
3. **`.env` files** — Local development only (not deployed)

Use `b2c mrt env var push --file .env.staging --project <project> --environment <environment>`
to explicitly apply a reviewed file. It shows a diff and prompts; omit local-only
values and use credentials for the target instance. See [Environment Variables](https://developer.salesforce.com/docs/commerce/sfnext/guide/sfnext-mrt-environment-vars.html)
for visibility, naming, and limits. MRT variable management and log tailing use
the B2C CLI; there are no equivalent dedicated MCP tools.

### MRT Deployment Variables

```bash
# Project slug (required for push)
MRT_PROJECT=my-project-slug

# Target environment (optional — if omitted, bundle is uploaded but not deployed)
MRT_TARGET=development
```

### Application Variables (set in MRT Dashboard)

```bash
PUBLIC__app__commerce__api__clientId=prod-client-id
PUBLIC__app__commerce__api__organizationId=prod-org-id
PUBLIC__app__commerce__api__shortCode=prod-short-code
```

## Page Designer Cartridge Deployment

Page Designer metadata must be deployed separately to Commerce Cloud (not MRT):

```bash
# Generate cartridge metadata
pnpm generate:cartridge

# Deploy cartridge to B2C instance
pnpm deploy:cartridge

# Deploy with clean (removes old cartridge first)
pnpm deploy:cartridge:clean

# Validate cartridge structure
pnpm validate:cartridge
```

Cartridge metadata is also auto-generated as part of `pnpm build`.

## Pre-Deployment Checklist

1. **Run tests** — `pnpm test`
2. **Check bundle size** — `pnpm bundlesize:test`
3. **Verify environment variables** — All required vars set in target environment
4. **Build successfully** — `pnpm build` completes without errors
5. **Verify SCAPI credentials** — Client ID and org ID match the target environment

## Troubleshooting

| Issue                          | Cause                         | Solution                                    |
| ------------------------------ | ----------------------------- | ------------------------------------------- |
| Build fails                    | TypeScript errors             | Fix type errors; run `pnpm typecheck`       |
| Push rejected                  | Authentication issue          | Verify sfnext CLI credentials               |
| 500 errors after deploy        | Missing environment variables | Check all required vars in MRT dashboard    |
| Stale Page Designer components | Cartridge not deployed        | Re-deploy cartridge via MCP tool or b2c CLI |

## Related Skills

- `storefront-next:sfnext-project-setup` - Project structure and build configuration
- `storefront-next:sfnext-configuration` - Environment variable configuration
- `storefront-next:sfnext-page-designer` - Page Designer cartridge deployment
- `storefront-next:sfnext-performance` - Bundle size optimization before deployment
- `b2c-cli:b2c-mrt` - General MRT management via b2c CLI (NOT Storefront Next specific)

## Reference Documentation

- [MRT Deployment Reference](references/MRT-DEPLOYMENT.md) - Detailed deployment options and configuration
