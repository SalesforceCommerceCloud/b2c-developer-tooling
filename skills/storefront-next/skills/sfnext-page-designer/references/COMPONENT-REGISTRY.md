# Component Registry Reference

## Overview

The component registry maps Page Designer `typeId` values to React components. The registry is **auto-generated** at build time by the staticRegistry Vite plugin.

## Static Registry

The file `src/lib/static-registry.ts` is generated automatically. **Do not edit it by hand.** The Vite plugin scans for components with `@Component` decorators and builds the registry.

After adding or modifying decorators, rebuild the app to regenerate the registry:

```bash
pnpm build
# or during development
pnpm dev   # Hot reload regenerates automatically
```

## Component Registration

Components are registered by their `@Component` decorator `typeId`:

```typescript
// The registry maps typeId -> component module
// Example auto-generated entry:
{
    'hero-banner': () => import('@/components/hero-banner'),
    'product-carousel': () => import('@/components/product-carousel'),
    'content-card': () => import('@/components/content-card'),
}
```

## Component Loaders

Components that need server data export a `loader` function. The registry calls these loaders during `collectComponentDataPromises()` in the route loader:

```typescript
// In the component file:
export function loader({ componentData, context }) {
    const clients = createApiClients(context);
    const productIds = componentData.productIds;

    return clients.shopperProducts.getProducts({
        params: { query: { ids: productIds.join(',') } }
    }).then(({ data }) => data);
}

export function fallback() {
    return <ProductCarouselSkeleton />;
}

export default function ProductCarousel({ data, ...props }) {
    // data = resolved result from loader
    return <div>{data.products.map(p => <ProductTile key={p.id} product={p} />)}</div>;
}
```

### Data Flow

```
Route loader
  |-- fetchPageFromLoader(args, { pageId })     -> page promise
  +-- collectComponentDataPromises(args, page)  -> componentData map
        |
  For each component with a loader:
    component.loader({ componentData, context }) -> data promise
        |
  <Region> renders components with resolved data
```

## Adding a New Page Designer Component

1. Create the React component with decorator metadata class
2. Implement the component's render function
3. (Optional) Export `loader` and `fallback` if server data is needed
4. Rebuild to regenerate static registry
5. Generate metadata JSON via MCP tool (`storefront_next_generate_page_designer_metadata`)
6. Deploy cartridge via MCP tool (`cartridge_deploy`)
