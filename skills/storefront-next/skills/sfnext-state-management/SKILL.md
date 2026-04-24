---
name: sfnext-state-management
description: Manage client-side state in Storefront Next using React context providers and feature-level Zustand stores. Use when handling basket/auth UI state, creating extension stores (for example store locator), or syncing client-visible state after server mutations. NOT for server-side data loading — see sfnext-data-fetching for loader patterns.
---

# State Management Skill

This skill covers client-side state management in Storefront Next with server-first data loading.

## Overview

Storefront Next keeps business data on the server (`loader`/`action`) and uses client state for UX continuity. In practice, app-wide state is commonly exposed through providers (for example auth/basket), while complex extension-specific state can use Zustand.

| State Type            | Mechanism                      | Example                                                |
| --------------------- | ------------------------------ | ------------------------------------------------------ |
| Server data           | React Router `loader`          | Product details, category listings                     |
| App-wide client state | React context providers        | Session display state, basket snapshot/hydration state |
| Feature client state  | Zustand store                  | Store locator modal/search state                       |
| Mutations             | React Router `action` (server) | Add to cart, update profile                            |

## Zustand Store Pattern (Feature-Level)

```typescript
// src/extensions/store-locator/stores/store-locator-store.ts
import {createStore} from 'zustand/vanilla';

type StoreLocatorState = {
  isOpen: boolean;
  mode: 'input' | 'device';
  selectedStoreInfo: SelectedStoreInfo | null;
};

type StoreLocatorActions = {
  open: () => void;
  close: () => void;
  setSelectedStoreInfo: (info: SelectedStoreInfo) => void;
};

type StoreLocatorStore = StoreLocatorState & StoreLocatorActions;

export const createStoreLocatorStore = (init?: Partial<StoreLocatorState>) => {
  return createStore<StoreLocatorStore>()((set) => ({
    isOpen: false,
    mode: 'input',
    selectedStoreInfo: init?.selectedStoreInfo ?? null,
    open: () => set({isOpen: true}),
    close: () => set({isOpen: false}),
    setSelectedStoreInfo: (selectedStoreInfo) => set({selectedStoreInfo}),
  }));
};
```

## Context Integration

Expose app-level state to components via providers/hooks:

```typescript
import { useBasket, useBasketSnapshot } from '@/providers/basket';

// In components
function CartIcon() {
    const basket = useBasket();
    const snapshot = useBasketSnapshot();

    const itemCount =
        basket?.productItems?.length ??
        snapshot?.uniqueProductCount ??
        0;

    return <Badge count={itemCount} />;
}
```

## Post-Mutation Sync Pattern

Keep mutations on the server and update request-context resources there:

```typescript
import {data} from 'react-router';
import {getBasket, updateBasketResource} from '@/middlewares/basket.server';

export async function action({request, context}: ActionFunctionArgs) {
  const formData = await request.formData();
  const productId = formData.get('productId') as string;

  const basketResource = await getBasket(context);
  const clients = createApiClients(context);

  const {data: updatedBasket} = await clients.basket.addItemToBasket({
    params: {path: {basketId: basketResource.current?.basketId ?? ''}},
    body: {productId, quantity: 1},
  });

  // Sync basket resource in request context for current response/revalidation flow
  updateBasketResource(context, updatedBasket);

  return data({success: true, basket: updatedBasket});
}
```

## Best Practices

1. **Server-first data** — Load/mutate commerce data with `loader`/`action`
2. **Provider-first app state** — Use providers for shared basket/auth UI state
3. **Scoped Zustand usage** — Use Zustand for feature-local complexity (typically extensions)
4. **Sync in server actions** — Update server basket/auth resources inside `action` handlers
5. **Keep state minimal** — Store only what cannot be derived cheaply

## When to Use Each Mechanism

| Scenario                      | Use                                                      |
| ----------------------------- | -------------------------------------------------------- |
| Product data on page load     | `loader`                                                 |
| Shopping cart badge count     | Basket provider hooks (`useBasket`, `useBasketSnapshot`) |
| Complex extension UI workflow | Zustand store                                            |
| Search results                | `loader`                                                 |
| Add to cart                   | Server `action` + resource update                        |

## Related Skills

- `storefront-next:sfnext-data-fetching` - Server-side data loading with loaders (NOT client state)
- `storefront-next:sfnext-authentication` - Auth state management
- `storefront-next:sfnext-components` - Using store data in components
