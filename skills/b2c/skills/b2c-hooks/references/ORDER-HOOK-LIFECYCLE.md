# Order Hook Lifecycle (SCAPI/OCAPI)

## Lifecycle Phases

The order creation request flows through these phases in order:

```
Request in
   |
   v
[1] beforePOST(basket)
       - Validation phase
       - Returning Status.ERROR rejects the request before any order is created
   |
   v
[2] Platform creates order in CREATED status (from the basket)
   |
   v
[3] afterPOST(order)                          <-- INSIDE platform transaction
       - Owns the CREATED -> NEW or CREATED -> FAILED transition
       - Status.ERROR here rolls back the entire order creation
   |
   v
   (transaction commits)
   |
   v
[4] modifyPOSTResponse(order, orderResponse)  <-- AFTER transaction commits
       - Response-shaping phase only
       - Order is already persisted; cannot be rolled back from here
   |
   v
Response out
```

| Phase | Hook | Runs relative to transaction | Purpose |
|-------|------|------------------------------|---------|
| 1 | `beforePOST(basket)` | Before order creation | Validate the incoming basket; reject with `Status.ERROR` to prevent order creation |
| 2 | (platform) | — | Platform creates order in `CREATED` status |
| 3 | `afterPOST(order)` | Inside platform transaction | Transition `CREATED` -> `NEW` (place) or `CREATED` -> `FAILED` (fail) |
| 4 | `modifyPOSTResponse(order, orderResponse)` | After commit | Shape the HTTP response; cannot roll back |

Key point: a non-null `Status` return ends `modifyPOSTResponse` hook execution (same behavior as other `modifyResponse` hooks).

## Rollback Semantics

| Hook | Transaction context | `Status.ERROR` behavior |
|------|---------------------|-------------------------|
| `afterPOST` | Inside platform transaction | Rolls back entire order creation — NO order record survives |
| `modifyPOSTResponse` | After commit | Does NOT roll back — order already persisted; only affects HTTP response |

This was empirically verified on sandbox zzpq-019 (2026-06-24). Order 00000502 returned HTTP 400 from `afterPOST` `Status.ERROR` and left 0 matches in `order_search`.

Implication: `afterPOST` alone gives you EITHER a persisted failed order (by calling `failOrder` then returning `Status.OK`) OR an HTTP error (by returning `Status.ERROR`) — not both.

## The Two-Hook Pattern: Persist Failed Order AND Return HTTP Error

Sometimes you need BOTH:
- A persisted `FAILED` order (for metrics, triage, queryability)
- An HTTP error response to the storefront (so the UI shows a decline, not a false confirmation)

A single `afterPOST` cannot do both — its transaction semantics force a choice. The solution is to split the responsibilities across two hook phases.

Solution verified on zzpq-019:

### Step 1: `afterPOST` — persist the FAILED order

```javascript
var OrderMgr = require('dw/order/OrderMgr');
var Status = require('dw/system/Status');

exports.afterPOST = function (order) {
    var authResult = authorizePayment(order);

    if (authResult.declined) {
        // Fail the order so it persists in FAILED status (queryable for metrics)
        OrderMgr.failOrder(order, false);

        // Stash decline details for modifyPOSTResponse via request.custom
        request.custom.paymentDecline = {
            code: authResult.code,
            message: authResult.message
        };

        // Return OK so the transaction COMMITS (FAILED order persists)
        return new Status(Status.OK);
    }

    // Success path: place the order
    OrderMgr.placeOrder(order);
    order.setConfirmationStatus(dw.order.Order.CONFIRMATION_STATUS_CONFIRMED);
    order.setExportStatus(dw.order.Order.EXPORT_STATUS_READY);
};
```

### Step 2: `modifyPOSTResponse` — return HTTP error without rollback

```javascript
exports.modifyPOSTResponse = function (order, orderResponse) {
    // Check if afterPOST stashed a decline
    var decline = request.custom.paymentDecline;
    if (decline) {
        // Return ERROR here — order is already committed, no rollback
        return new Status(Status.ERROR, decline.code, decline.message);
    }
    // No decline — let the normal 200 response through
};
```

### `hooks.json` registration

```json
{
  "hooks": [
    { "name": "dw.ocapi.shop.order.afterPOST", "script": "./hooks/order.js" },
    { "name": "dw.ocapi.shop.order.modifyPOSTResponse", "script": "./hooks/order.js" }
  ]
}
```

### Verified behavior (zzpq-019, 2026-06-24)

- **Tainted order 00000503** -> HTTP 400 with `extensionPoint: dw.ocapi.shop.order.modifyPOSTResponse`, `statusCode`/`statusMessage` from the `Status` AND persisted `status=FAILED` (queryable)
- **Clean order 00000504** -> HTTP 200, `status=NEW`

## Request-Scoped Data Passing: `request.custom`

`request.custom` is the idiomatic channel for passing data between hooks that fire within the same SCAPI/OCAPI request.

- `request` is `dw.system.Request` — a global object whose `.custom` attribute bag persists for the lifetime of the request
- Works between any hook phases in the same request: `beforePOST` -> `afterPOST` -> `modifyPOSTResponse`
- Type: `CustomAttributes` (key-value pairs; values can be any serializable type)

Example pattern:

```javascript
// In afterPOST — stash data
request.custom.myKey = { someData: 'value' };

// In modifyPOSTResponse — read it
var data = request.custom.myKey;
```

Use cases beyond order decline:

- Passing external service call results to response enrichment
- Flagging validation warnings (non-fatal) for response annotation
- Timing/instrumentation across hook phases

## Cross-References

- [Order afterPOST canonical example](../SKILL.md#order-afterpost-headless-order-placement) — the standard `afterPOST` pattern (without `modifyPOSTResponse`)
- [b2c-ordering](../../b2c-ordering/SKILL.md) — `OrderMgr.placeOrder`/`failOrder`, status transitions, reopen-basket behavior
- [OCAPI/SCAPI Hooks reference](./OCAPI-SCAPI-HOOKS.md) — complete hook signature list
