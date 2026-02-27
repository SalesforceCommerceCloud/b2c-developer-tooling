# Client-Side State Management

## Zustand Store Pattern

Storefront Next uses Zustand for client-side state (basket, wishlist):

```typescript
// src/middlewares/basket.client.ts
import {create} from 'zustand';

interface BasketStore {
  basket: Basket | null;
  setBasket: (basket: Basket | null) => void;
  clearBasket: () => void;
}

export const useBasketStore = create<BasketStore>((set) => ({
  basket: null,
  setBasket: (basket) => set({basket}),
  clearBasket: () => set({basket: null}),
}));
```

## Context Integration

Access Zustand state via context helpers:

```typescript
import { getBasket, updateBasket } from '@/middlewares/basket.client';

// In clientLoader
export const clientLoader: ClientLoaderFunction = ({ context }) => {
    const basket = getBasket(context);
    return { basket, itemCount: basket?.productItems?.length ?? 0 };
};

// In components
function CartIcon() {
    const basket = getBasket(context);
    return <Badge count={basket?.productItems?.length ?? 0} />;
}
```

## Update Pattern

After mutations, update the store:

```typescript
export async function clientAction({request, context}: ActionFunctionArgs) {
  const formData = await request.formData();
  const productId = formData.get('productId') as string;

  const basket = getBasket(context);
  const clients = createApiClients(context);

  const {data: updatedBasket} = await clients.shopperBasketsV2.addItemToBasket({
    params: {path: {basketId: basket.basketId}},
    body: [{productId, quantity: 1}],
  });

  // Update Zustand store
  updateBasket(context, updatedBasket);

  return Response.json({success: true, basket: updatedBasket});
}
```

## Best Practices

1. **Use for ephemeral client state**: Shopping cart, UI state, temporary selections
2. **Don't duplicate server state**: Prefer React Router loaders for server data
3. **Keep stores focused**: Separate stores for basket, wishlist, etc.
4. **Sync with server**: Update store after successful mutations

For full documentation on client-side state management patterns, see the Zustand documentation and React Router state management patterns.
