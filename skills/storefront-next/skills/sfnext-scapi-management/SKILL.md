---
name: sfnext-scapi-management
description: Add, remove, and list typed SCAPI clients in a Storefront Next project using `b2c sfnext scapi` commands, and browse API schemas to discover endpoints before writing loaders. Use this skill whenever the user says 'sfnext scapi', 'add an API to my storefront next project', 'what SCAPI clients does my sfnext project have', 'remove an API client', 'list available APIs for sfnext', 'browse schema before writing a loader', or asks how to integrate a specific SCAPI (shopper-baskets, shopper-search, etc.) into their Storefront Next project as a typed client. Also use when they want to check what parameters an endpoint accepts before coding. NOT for making actual SCAPI calls from loaders — see sfnext-data-fetching. NOT for standalone schema browsing outside a Storefront Next project — see b2c-cli:b2c-scapi-schemas.
---

# SCAPI Client Management Skill

This skill covers managing which typed SCAPI clients are available in a Storefront Next project and how to discover their shapes before writing data-fetching code.

## Overview

Storefront Next projects use typed SCAPI clients generated from OpenAPI schemas. Two complementary command sets work together:

| Command Set | Purpose | When to Use |
|-------------|---------|-------------|
| `b2c sfnext scapi` | Manage which clients exist in your project | Adding/removing APIs, checking what's configured |
| `b2c scapi schemas` | Browse API shapes (endpoints, fields, types) | Before writing a loader — discover what's available |

## Managing Project Clients

### List Available APIs

See what SCAPI APIs can be added to your project:

```bash
# show all APIs available to add
b2c sfnext scapi available

# filter by API family
b2c sfnext scapi available --api-family product

# JSON output for scripting
b2c sfnext scapi available --json
```

### Add a Client

Add a typed SCAPI client to your project. This generates type-safe client code accessible via `createApiClients(context)`:

```bash
# add the shopper-products API
b2c sfnext scapi add product shopper-products v1

# add a custom API
b2c sfnext scapi add custom my-loyalty-api v1

# force re-add (overwrite existing)
b2c sfnext scapi add product shopper-products v1 --force
```

After adding, the client becomes available in your loaders:

```typescript
import { createApiClients } from '@/lib/api-clients';

export function loader({ context }: LoaderFunctionArgs) {
    const clients = createApiClients(context);
    return {
        product: clients.shopperProducts.getProduct({
            params: { path: { id: params.productId } }
        }).then(({ data }) => data),
    };
}
```

### List Current Project Clients

See which SCAPI clients are currently configured in your project:

```bash
# list all configured clients
b2c sfnext scapi list

# JSON output
b2c sfnext scapi list --json
```

### Remove a Client

Remove an unused client to reduce bundle size:

```bash
# remove a client
b2c sfnext scapi remove product shopper-products
```

## Discovering API Shapes

Before writing a loader or action, use `b2c scapi schemas` to explore what endpoints and fields an API offers.

### The Schema-First Workflow

```
1. b2c scapi schemas list              → Find the API family/name/version
2. b2c scapi schemas get ... --list-paths   → See available endpoints
3. b2c scapi schemas get ... --expand-paths → See request params + response shape
4. Write your loader using the discovered types
```

### Step 1: Find the API

```bash
# list all available schemas
b2c scapi schemas list

# filter to product APIs
b2c scapi schemas list --api-family product
```

### Step 2: See Available Endpoints

```bash
# list all paths in shopper-products
b2c scapi schemas get product shopper-products v1 --list-paths
```

Output shows endpoints like `/products/{productId}`, `/products`, etc.

### Step 3: Expand Endpoint Details

```bash
# see the full shape of a specific endpoint
b2c scapi schemas get product shopper-products v1 --expand-paths /products/{productId}

# see the response schema type
b2c scapi schemas get product shopper-products v1 --expand-schemas Product

# combine: endpoint + its response type
b2c scapi schemas get product shopper-products v1 \
  --expand-paths /products/{productId} \
  --expand-schemas Product,ProductResult
```

### Step 4: Write Your Loader

Now that you know the endpoint path and parameter structure, write your loader:

```typescript
export function loader({ params, context }: LoaderFunctionArgs) {
    const clients = createApiClients(context);
    return {
        product: clients.shopperProducts.getProduct({
            params: { path: { id: params.productId } }
        }).then(({ data }) => data),
    };
}
```

## Example: Adding and Using a New API

Complete walkthrough — adding shopper-search and writing a search loader:

```bash
# 1. Check what's available
b2c sfnext scapi available --api-family search

# 2. Add the client
b2c sfnext scapi add search shopper-search v1

# 3. Discover endpoints
b2c scapi schemas get search shopper-search v1 --list-paths

# 4. Inspect the productSearch endpoint
b2c scapi schemas get search shopper-search v1 \
  --expand-paths /product-search \
  --expand-schemas ProductSearchResult
```

Then write the loader:

```typescript
export function loader({ request, context }: LoaderFunctionArgs) {
    const url = new URL(request.url);
    const q = url.searchParams.get('q') ?? '';
    const clients = createApiClients(context);

    return {
        results: clients.shopperSearch.productSearch({
            params: { query: { q, limit: 25 } }
        }).then(({ data }) => data),
    };
}
```

## Common Pitfalls

| Pitfall | Problem | Solution |
|---------|---------|----------|
| Writing a loader without checking the schema | Wrong parameter names or missing required fields | Run `--expand-paths` first to see exact param structure |
| Adding an API but client not appearing | Missing `pnpm install` after add | Run `pnpm install` to regenerate types |
| Trying to browse custom API schemas before registration | Schema returns empty/404 | Deploy and register the custom API first (see `sfnext-custom-apis`) |
| Using wrong API version | Types don't match runtime behavior | Use `scapi available` to verify the current version |

## Related Skills

- `storefront-next:sfnext-data-fetching` - Using the clients in loaders, actions, and useScapiFetcher
- `storefront-next:sfnext-custom-apis` - End-to-end custom API implementation and consumption
- `b2c-cli:b2c-scapi-schemas` - Full reference for schema browsing commands and flags
- `storefront-next:sfnext-project-setup` - Project creation and initial structure

## Reference Documentation

- [CLI Commands Reference](references/CLI-COMMANDS.md) - Detailed command reference for `b2c sfnext scapi`
