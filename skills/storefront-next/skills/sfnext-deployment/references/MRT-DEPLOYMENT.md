# MRT Deployment Reference

## Managed Runtime (MRT)

MRT is the hosting platform for Storefront Next storefronts. It provides:

- **Server-side rendering** — Node.js runtime for SSR and loader execution
- **CDN** — Global content delivery for static assets
- **Environment management** — Separate environments for development, staging, production
- **Bundle management** — Versioned deployments with rollback capability

## Deployment Commands

```bash
# Build and push in one step
pnpm build && pnpm push

# Push with deployment message
pnpm sfnext push -m "Fix checkout flow"

# Push to specific environment
pnpm sfnext push --environment production --wait

# Create a bundle without deploying (inspection/custom pipelines)
pnpm sfnext create-bundle -d . -o .bundle
```

## Environment Variables on MRT

### Setting Variables

Environment variables are set per-environment through:

1. **MRT Dashboard** — UI for managing environment variables
2. **CLI/.env values** — `SFCC_MRT_*` values used by `pnpm sfnext push`

### Variable Limits

| Constraint              | Limit              |
| ----------------------- | ------------------ |
| Variable name length    | 512 characters max |
| Total `PUBLIC__` values | 32KB max           |
| Nesting depth           | 10 levels max      |

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
