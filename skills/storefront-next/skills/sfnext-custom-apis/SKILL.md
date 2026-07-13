---
name: sfnext-custom-apis
description: End-to-end workflow for consuming custom SCAPI endpoints from a Storefront Next project — adding them as typed clients via `b2c sfnext scapi add custom`, discovering their schema, and calling them from loaders/actions/useScapiFetcher. Use this skill whenever the user wants to call a custom API from their Storefront Next app, gets a 404 or 401 when calling a custom endpoint from their sfnext loader, needs to add a custom API as a typed client in their storefront, asks about the full workflow from custom API cartridge to sfnext consumption, or says 'custom API in storefront next'. Also use when they ask how createApiClients exposes custom API methods or how to use useScapiFetcher with a custom endpoint. NOT for writing the custom API cartridge files (schema.yaml/script.js) from scratch — see b2c:b2c-custom-api-development. NOT for just checking registration status — see b2c-cli:b2c-scapi-custom.
---

# Custom APIs in Storefront Next

This skill covers the end-to-end workflow for implementing and consuming custom SCAPI endpoints from a Storefront Next project.

## Overview

Custom APIs let you define your own REST endpoints on B2C Commerce. In a Storefront Next project, you call these from loaders and actions just like standard SCAPI clients — with full type safety.

### End-to-End Workflow

```
Create custom API    →  Deploy & register  →  Add typed client  →  Discover schema  →  Call from loader
(cartridge)             (b2c code deploy)     (sfnext scapi add)   (scapi schemas)     (createApiClients)
```

## Step 1: Create the Custom API

A custom API consists of three files in a cartridge:

```
my-cartridge/cartridge/rest-apis/my-loyalty-api/
├── schema.yaml     # OpenAPI 3.0 schema (endpoints, params, responses)
├── api.json        # API metadata (version, security scheme)
└── script.js       # Implementation (controller script)
```

For full details on writing these files, see the `b2c:b2c-custom-api-development` skill.

**Key choices that affect the client:**

| Choice | Impact |
|--------|--------|
| Directory name (`my-loyalty-api`) | Becomes the API name for `scapi add` |
| `type` in api.json (`shopper` or `admin`) | Determines auth scheme and whether `siteId` is required |
| Paths in schema.yaml | Become the methods on the typed client |

## Step 2: Deploy and Register

Deploy the cartridge and verify the custom API is registered:

```bash
# deploy the cartridge
b2c code deploy ./my-cartridge --activate

# verify registration
b2c scapi custom status
```

A successful registration shows `status: active` for your endpoints. If you see `not_registered`, debug with:

```bash
b2c scapi custom status --status not_registered --columns type,apiName,endpointPath,errorReason
```

See `b2c-cli:b2c-scapi-custom` for full diagnostics.

## Step 3: Add as Typed Client

Once registered, add the custom API to your Storefront Next project:

```bash
b2c sfnext scapi add custom my-loyalty-api v1
```

This generates typed client code. The client becomes available as:

```typescript
const clients = createApiClients(context);
clients.myLoyaltyApi.getPoints({...});
```

## Step 4: Discover the API Shape

Use schema browsing to understand your custom API's endpoints and response types:

```bash
# list endpoints
b2c scapi schemas get custom my-loyalty-api v1 --list-paths

# expand a specific endpoint
b2c scapi schemas get custom my-loyalty-api v1 \
  --expand-paths /loyalty/points/{customerId}
```

This shows you the exact parameter names and response shape to use in your loader.

## Step 5: Call from Loaders and Actions

### Calling from a Loader (Shopper API)

```typescript
import { createApiClients } from '@/lib/api-clients';

export function loader({ params, context }: LoaderFunctionArgs) {
    const clients = createApiClients(context);
    return {
        loyaltyPoints: clients.myLoyaltyApi.getPoints({
            params: {
                path: { customerId: params.customerId },
                query: { siteId: context.siteId }
            }
        }).then(({ data }) => data),
    };
}
```

### Calling from an Action (Mutation)

```typescript
import { data } from 'react-router';
import { createApiClients } from '@/lib/api-clients';

export async function action({ request, context }: ActionFunctionArgs) {
    const formData = await request.formData();
    const clients = createApiClients(context);

    try {
        await clients.myLoyaltyApi.redeemPoints({
            params: {
                path: { customerId: formData.get('customerId') as string },
                query: { siteId: context.siteId },
                body: { points: Number(formData.get('points')) }
            }
        });
        return data({ success: true });
    } catch (error) {
        return data({ success: false, error: error.message }, { status: 400 });
    }
}
```

### Using useScapiFetcher (Interactive)

For on-demand fetching triggered by user interactions:

```typescript
import { useScapiFetcher } from '@/hooks/use-scapi-fetcher';

export function useLoyaltyPoints(customerId: string) {
    const parameters = useMemo(
        () => ({
            params: {
                path: { customerId },
                query: { siteId: getSiteId() }
            }
        }),
        [customerId]
    );

    const fetcher = useScapiFetcher(
        'myLoyaltyApi',
        'getPoints',
        parameters
    );

    return {
        points: fetcher.data,
        isLoading: fetcher.state === 'loading',
        refresh: () => fetcher.load(),
    };
}
```

## Step 6: Debug Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Client property not available | Forgot `sfnext scapi add` | Run `b2c sfnext scapi add custom <name> <version>` |
| 404 from custom endpoint | API not registered | Check `b2c scapi custom status`; redeploy with `--activate` |
| 401 Unauthorized | Wrong security scheme | Shopper APIs use ShopperToken; Admin APIs use BearerToken |
| Missing `siteId` error | Shopper custom APIs require siteId | Always include `siteId` in query params for Shopper APIs |
| Schema returns empty | API not yet registered | Deploy and activate the cartridge first, then browse schemas |
| Types outdated after schema change | Stale generated types | Re-run `b2c sfnext scapi add custom <name> <version> --force` |

## Custom API Client Naming

The API directory name maps to a camelCase property on `createApiClients()`:

| Directory Name | Client Property | Example Call |
|---------------|-----------------|-------------|
| `my-loyalty-api` | `clients.myLoyaltyApi` | `clients.myLoyaltyApi.getPoints({...})` |
| `order-status` | `clients.orderStatus` | `clients.orderStatus.getStatus({...})` |
| `inventory-check` | `clients.inventoryCheck` | `clients.inventoryCheck.checkStock({...})` |

## Shopper vs Admin Custom APIs

| Aspect | Shopper API | Admin API |
|--------|-------------|-----------|
| Auth scheme | ShopperToken (SLAS) | BearerToken (Account Manager) |
| Requires `siteId` | Yes | No |
| Called from | Storefront loaders/actions | Admin tools, batch jobs |
| Typical use | Customer-facing features | Back-office operations |

Most Storefront Next custom APIs are **Shopper** type since they serve storefront pages.

## Common Pitfalls

| Pitfall | Problem | Solution |
|---------|---------|----------|
| Using admin auth for a shopper endpoint | 401 errors in storefront context | Set `type: "shopper"` in api.json |
| Forgetting to redeploy after schema changes | Stale endpoints | Redeploy cartridge and re-add client with `--force` |
| Not including `siteId` for shopper APIs | Request rejected | Always pass `siteId` in query params |
| Calling custom API before registration completes | Intermittent 404s | Wait for `status: active` in `b2c scapi custom status` |

## Related Skills

- `storefront-next:sfnext-scapi-management` - Managing typed clients (add/remove/list)
- `storefront-next:sfnext-data-fetching` - Loader/action/useScapiFetcher patterns
- `b2c:b2c-custom-api-development` - Creating the custom API cartridge (schema + script + mapping)
- `b2c-cli:b2c-scapi-custom` - Checking custom API registration status
- `b2c-cli:b2c-scapi-schemas` - Schema discovery commands
- `b2c-cli:b2c-code` - Deploying and activating code versions

## Reference Documentation

- [Workflow Examples](references/WORKFLOW-EXAMPLES.md) - Complete end-to-end worked examples
