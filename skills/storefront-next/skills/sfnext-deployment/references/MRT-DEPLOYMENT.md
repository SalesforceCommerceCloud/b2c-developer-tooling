# MRT Deployment Reference

## Managed Runtime (MRT)

MRT is the hosting platform for Storefront Next storefronts. It provides:

- **Server-side rendering** — Node.js runtime for SSR and loader execution
- **CDN** — Global content delivery for static assets
- **Environment management** — Separate environments for development, staging, production
- **Bundle management** — Versioned deployments with rollback capability

## Deployment Commands

```bash
# Build, then run the template's push script
pnpm run build && pnpm run push

# Push with deployment message
pnpm run push --message "Fix checkout flow"

# Push to specific environment
pnpm run push --environment production --wait

# Create a bundle without deploying (inspection/custom pipelines)
pnpm sfnext create-bundle -d . -o .bundle
```

## Environment Variables on MRT

### Setting Variables

Environment variables are set per-environment through:

1. **Runtime Admin or `b2c mrt env var set/push`** — Application variables on the selected environment; changes redeploy it.
2. **`MRT_PROJECT`, `MRT_TARGET`, `MRT_API_KEY`** — Deployment target and credentials for `pnpm sfnext push`; these do not upload application variables from `.env`.

### Variable Limits

See Salesforce's [Environment Variables constraints](https://developer.salesforce.com/docs/commerce/sfnext/guide/sfnext-mrt-environment-vars.html#constraints)
for current limits. The 32 KB value-size limit covers all environment variables,
not only `PUBLIC__` values. Public configuration paths must exist in `config.server.ts`.

### Production Configuration Example

```bash
# Commerce API credentials
PUBLIC__app__commerce__api__clientId=prod-client-id
PUBLIC__app__commerce__api__organizationId=f_ecom_abcd_001
PUBLIC__app__commerce__api__siteId=RefArchGlobal
PUBLIC__app__commerce__api__shortCode=kv7kzm78

# Site configuration
PUBLIC__app__defaultSiteId=RefArchGlobal
PUBLIC__app__commerce__sites='[{"id":"RefArchGlobal","defaultLocale":"en-US","defaultCurrency":"USD","supportedLocales":[{"id":"en-US","preferredCurrency":"USD"},{"id":"de-DE","preferredCurrency":"EUR"}],"supportedCurrencies":["USD","EUR"]}]'

# Server-only secrets (not exposed to client)
COMMERCE_API_SLAS_SECRET=production-slas-secret
```

## Bundle Management

Each `sfnext push` creates a versioned bundle on MRT:

```
Bundle v1 (active) ← current production
Bundle v2          ← previous deployment
Bundle v3          ← two deployments ago
```

### Rollback

If a deployment causes issues, roll back to a previous bundle via the MRT Dashboard or CLI.

## Multi-Environment Setup

| Environment | Purpose                   | Auto-deploy           |
| ----------- | ------------------------- | --------------------- |
| Development | Feature testing           | From feature branches |
| Staging     | Pre-production validation | From main branch      |
| Production  | Live storefront           | Manual promotion      |

## Deployment Verification

After deploying, verify:

1. **Health check** — Site loads without errors
2. **SCAPI connectivity** — Products and categories display correctly
3. **Authentication** — Login/logout flow works
4. **Page Designer** — Merchant-editable pages render correctly
5. **Performance** — No regression in page load times
