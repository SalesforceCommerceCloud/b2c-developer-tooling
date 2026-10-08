# Action Hooks

Action hooks let an extension run server-side code at fixed points in the checkout actions (fraud checks, address verification, payment enrichment) without editing the action files. UI slots are separate; see the main skill.

## Available hook ids

The ids live in `ACTION_HOOK_IDS` in `src/targets/action-hook.server.ts`; `pnpm extensions:list` prints them too.

| Constant | Hook id |
|----------|---------|
| `CHECKOUT_FRAUD_AFTER_SUBMIT_CONTACT_INFO` | `sfcc.checkout.fraud.afterSubmitContactInfo` |
| `CHECKOUT_ADDRESS_VERIFICATION_AFTER_SUBMIT_SHIPPING_ADDRESS` | `sfcc.checkout.addressVerification.afterSubmitShippingAddress` |
| `CHECKOUT_SHIPPING_AFTER_METHODS_FETCH` | `sfcc.checkout.shipping.afterMethodsFetch` |
| `CHECKOUT_SHIPPING_AFTER_METHOD_SELECT` | `sfcc.checkout.shipping.afterMethodSelect` |
| `CHECKOUT_PAYMENTS_AFTER_SUBMIT_PAYMENT` | `sfcc.checkout.payments.afterSubmitPayment` |
| `CHECKOUT_FRAUD_BEFORE_PLACE` | `sfcc.checkout.fraud.beforePlace` (blocking) |
| `CHECKOUT_PAYMENTS_BEFORE_PLACE_ORDER` | `sfcc.checkout.payments.beforePlaceOrder` (blocking) |
| `CHECKOUT_PAYMENTS_AFTER_PLACE_ORDER` | `sfcc.checkout.payments.afterPlaceOrder` |

## Register a handler

```json
{
  "actionHooks": [
    { "hookId": "sfcc.checkout.fraud.beforePlace", "handler": "extensions/my-extension/hooks/fraud-check.ts", "order": 0 }
  ]
}
```

`handler` is a path relative to `src/`; the module's default export is the handler. It receives the hook context (`{ data, actionContext }`) and returns the (optionally modified) context, or nothing to pass it through.

```typescript
import { ActionHookError } from '@/targets/action-hook.server';
import type { ActionHookContext } from '@/targets/action-hook.server';

export default async function fraudCheck(context: ActionHookContext) {
    const risky = await scoreOrder(context.data);   // your own server-side call
    if (risky) {
        throw new ActionHookError('We could not process this order.', 'sfcc.checkout.fraud.beforePlace', 'placeOrder');
    }
    return context;
}
```

The constructor is `ActionHookError(message, hookId, step)`; the step is echoed in the 400 response.

## Semantics

- Handlers for one hook run in series as a waterfall, ordered by `order`; each receives the previous handler's output. With no handlers the original context is returned unchanged.
- Throwing `ActionHookError` aborts the action and returns an HTTP 400 JSON response with your message and the step.
- Each handler has a timeout (a few seconds); a slow handler is treated as a failure, so do not make long calls inside hooks.
- Non-blocking hooks (the default): an unexpected error is logged, the failing handler is skipped and the action continues. Blocking hooks (`fraud.beforePlace`, `payments.beforePlaceOrder` run with `blocking: true`): an unexpected error fails the action, so a broken fraud or payment check cannot silently let an order through.
- Keep handlers server-safe: they run in the action, so use `*.server` modules freely and never put secrets in client-visible config (use `server-config.ts`).

## Adding a new hook point

Call `runHookSafe` from an action with a new id you add to `ACTION_HOOK_IDS`, as `src/routes/action.place-order.ts` does. Pass `blocking: true` only when a failure must stop the action. Then run `pnpm extensions:list` to confirm it is discovered.
