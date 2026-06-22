---
name: b2c-hooks
description: Implement hooks with HookMgr, hooks.json registration, and system extension points for order, basket, and API lifecycle events. Use this skill whenever the user needs to register a hook implementation, extend OCAPI/SCAPI behavior with before/after hooks, customize order calculation or payment authorization, or create custom extension points. Also use when debugging hook registration or Status return values -- even if they just say 'run code when an order is placed' or 'intercept the basket API'.
---

# B2C Commerce Hooks

Hooks are extension points that allow you to customize business logic by registering scripts. B2C Commerce supports two types of hooks:

1. **OCAPI/SCAPI Hooks** - Extend API resources with before, after, and modifyResponse hooks
2. **System Hooks** - Custom extension points for order calculation, payment, and other core functionality

## Hook Types Overview

| Type | Purpose | Examples |
|------|---------|----------|
| OCAPI/SCAPI | Extend API behavior | `dw.ocapi.shop.basket.afterPOST` |
| System | Core business logic | `dw.order.calculate` |
| Custom | Your own extension points | `app.checkout.validate` |

## Hook Registration

### File Structure

```
my_cartridge/
├── package.json           # References hooks.json
└── cartridge/
    └── scripts/
        ├── hooks.json     # Hook registrations
        └── hooks/         # Hook implementations
            ├── basket.js
            └── order.js
```

### package.json

Reference the hooks configuration file:

```json
{
  "name": "my_cartridge",
  "hooks": "./cartridge/scripts/hooks.json"
}
```

### hooks.json

Register hooks with their implementing scripts:

```json
{
  "hooks": [
    {
      "name": "dw.ocapi.shop.basket.afterPOST",
      "script": "./hooks/basket.js"
    },
    {
      "name": "dw.ocapi.shop.basket.modifyPOSTResponse",
      "script": "./hooks/basket.js"
    },
    {
      "name": "dw.order.calculate",
      "script": "./hooks/order.js"
    }
  ]
}
```

### Hook Script

Export functions matching the hook method name (without package prefix):

```javascript
// hooks/basket.js
var Status = require('dw/system/Status');

exports.afterPOST = function(basket) {
    // Called after basket creation
    // Returning a value would skip system implementation
};

exports.modifyPOSTResponse = function(basket, basketResponse) {
    // Modify the API response
    basketResponse.c_customField = 'value';
};
```

## HookMgr API

Use `dw.system.HookMgr` to call hooks programmatically:

```javascript
var HookMgr = require('dw/system/HookMgr');

// Check if hook exists
if (HookMgr.hasHook('dw.order.calculate')) {
    // Call the hook
    var result = HookMgr.callHook('dw.order.calculate', 'calculate', basket);
}
```

| Method | Description |
|--------|-------------|
| `hasHook(extensionPoint)` | Returns true if hook is registered or has default implementation |
| `callHook(extensionPoint, functionName, args...)` | Calls the hook, returns result or undefined |

## Status Object

Hooks return `dw.system.Status` to indicate success or failure:

```javascript
var Status = require('dw/system/Status');

// Success - continue processing
return new Status(Status.OK);

// Error - stop processing, rollback transaction
var status = new Status(Status.ERROR);
status.addDetail('error_code', 'INVALID_ADDRESS');
status.addDetail('message', 'Address validation failed');
return status;
```

| Status | HTTP Response | Behavior |
|--------|---------------|----------|
| `Status.OK` | Continues | Hook execution continues |
| `Status.ERROR` | 400 Bad Request | Transaction rolled back, processing stops |
| Uncaught exception | 500 Internal Error | Transaction rolled back |

## Return Value Behavior (Important)

**OCAPI/SCAPI hooks that return ANY value will SKIP the system implementation and all subsequent registered hooks for that extension point.**

This is a common source of bugs. For example, if a hook returns `Status.OK`, the system's `dw.order.calculate` implementation won't run, causing cart totals to be incorrect.

### When to Return a Value

Return a `Status` object **only** when you want to:
- **Stop processing** with an error (`Status.ERROR`)
- **Skip the system implementation** intentionally

### When NOT to Return a Value

To ensure system implementations run (like cart calculation), **return nothing**:

```javascript
// Returning Status.OK skips system implementation
exports.afterPOST = function(basket) {
    doSomething(basket);
    return new Status(Status.OK);  // Skips dw.order.calculate
};

// No return value - system implementation runs
exports.afterPOST = function(basket) {
    doSomething(basket);
    // No return, or explicit: return;
};
```

### Summary

| Return Value | OCAPI/SCAPI Behavior | Custom Hook Behavior |
|-------------|---------------------|---------------------|
| `undefined` (no return) | System implementation runs, subsequent hooks run | All hooks run |
| `Status.OK` | **Skips** system implementation and subsequent hooks | All hooks run |
| `Status.ERROR` | Stops processing, returns error | All hooks run |

**Debugging tip**: If cart totals are wrong or hooks aren't firing, check if an earlier hook is returning a value.

## OCAPI/SCAPI Hooks

OCAPI and SCAPI share the same hooks. Enable in Business Manager:
**Administration > Global Preferences > Feature Switches > Enable Salesforce Commerce Cloud API hook execution**

### Hook Types

| Hook | When Called | Use Case |
|------|-------------|----------|
| `before<METHOD>` | Before processing | Validation, access control |
| `after<METHOD>` | After processing (in transaction) | Data modification, external calls |
| `modify<METHOD>Response` | Before response sent | Add/modify response properties |

### Common Hook Patterns

```javascript
// Validation in beforePUT
exports.beforePUT = function(basket, addressDoc) {
    if (!isValidAddress(addressDoc)) {
        var status = new Status(Status.ERROR);
        status.addDetail('validation_error', 'Invalid address');
        return status;
    }
};

// External call in afterPOST (within transaction)
exports.afterPOST = function(basket, paymentDoc) {
    var result = callPaymentService(paymentDoc);
    request.custom.paymentResult = result; // Pass to modifyResponse
    // Returning a Status would skip system implementation
};

// Modify response
exports.modifyPOSTResponse = function(basket, basketResponse, paymentDoc) {
    basketResponse.c_paymentStatus = request.custom.paymentResult.status;
};
```

### Passing Data Between Hooks

Use `request.custom` to pass data between hooks in the same request:

```javascript
// In afterPOST
exports.afterPOST = function(basket, doc) {
    request.custom.externalId = callExternalService();
};

// In modifyPOSTResponse
exports.modifyPOSTResponse = function(basket, response, doc) {
    response.c_externalId = request.custom.externalId;
};
```

### Detect SCAPI vs OCAPI

```javascript
exports.afterPOST = function(basket) {
    if (request.isSCAPI()) {
        // SCAPI-specific logic
    } else {
        // OCAPI-specific logic
    }
};
```

## Order `afterPOST`: Headless Order Placement

The `dw.ocapi.shop.order.afterPOST(order): Status` hook is the extension point for completing a **headless (SCAPI) checkout**. When the SCAPI Shopper Orders API (`POST /checkout/shopper-orders/.../orders`) creates an order, the order is left in **`CREATED`** status — it is *not* yet placed. This hook is where you authorize payment and decide the order's fate. Getting the operational rules wrong here produces opaque failures, so read this section carefully.

### Operational Rules (read before writing the hook)

1. **`afterPOST` already runs inside a platform transaction.** Do **NOT** wrap `OrderMgr.placeOrder()`, `OrderMgr.failOrder()`, or payment-instrument mutations in your own `Transaction.wrap()` / `Transaction.begin()`. A nested transaction causes the inner change to be **rolled back**, and the platform surfaces it to the API caller as an opaque:

   ```
   HTTP 400
   An error occurred in ExtensionPoint dw.ocapi.shop.order.afterPOST
   ```

   Call `placeOrder` / `failOrder` **directly**, with no transaction wrapper. (This is the opposite of a job- or controller-driven flow — see [b2c-ordering](../b2c-ordering/SKILL.md), where the same calls *are* wrapped because they run outside a hook transaction.)

2. **The hook owns the `CREATED → NEW` / `CREATED → FAILED` transition.** SCAPI leaves the order in `CREATED`. The hook must:
   - Authorize the payment instruments, then
   - `OrderMgr.placeOrder(order)` to advance **`CREATED → NEW`** on success, or
   - `OrderMgr.failOrder(order, true|false)` to advance to **`FAILED`** on decline (`true` reopens the basket so the shopper can retry; `false` discards it).

   If the hook does neither, the order is **stranded in `CREATED` indefinitely** — invisible to most reporting and to the Admin Orders API (which does not surface `CREATED` orders). Never leave the hook without resolving the order.

3. **Returning `Status.ERROR` is how the hook declines the request**, but the platform reports it to the caller as the same generic *"An error occurred in ExtensionPoint…"* message — the decline reason is **not** propagated. Therefore **log the meaningful detail yourself** (`Logger.error(...)`) before returning, or you will have no record of *why* an order failed.

### Canonical `afterPOST` Example

Authorizes every payment instrument via the SFRA `app.payment.processor.<id>` Authorize hook convention, fails the order on any decline, and places it (setting confirmation + export status) only when fully paid. Note the complete absence of `Transaction.wrap` — every mutation runs directly in the hook's ambient transaction.

```javascript
// hooks/order.js
var HookMgr = require('dw/system/HookMgr');
var OrderMgr = require('dw/order/OrderMgr');
var Order = require('dw/order/Order');
var PaymentMgr = require('dw/order/PaymentMgr');
var Status = require('dw/system/Status');
var Logger = require('dw/system/Logger');

exports.afterPOST = function (order) {
    var log = Logger.getLogger('checkout', 'orderAfterPOST');

    // SCAPI delivers the order in CREATED status. Authorize each payment
    // instrument by delegating to its processor's Authorize hook.
    // getPaymentInstruments() returns a dw.util.Collection — call toArray()
    // for index access (Collections are not directly indexable).
    var instruments = order.getPaymentInstruments().toArray();
    for (var i = 0; i < instruments.length; i++) {
        var pi = instruments[i];
        var method = PaymentMgr.getPaymentMethod(pi.getPaymentMethod());
        var processor = method ? method.getPaymentProcessor() : null;

        if (!processor) {
            log.error('Order {0}: no payment processor for method {1}',
                order.orderNo, pi.getPaymentMethod());
            // No Transaction.wrap — we are already inside the hook transaction.
            OrderMgr.failOrder(order, false);
            return new Status(Status.ERROR, 'PAYMENT_ERROR', 'Missing payment processor');
        }

        // SFRA convention: app.payment.processor.<processorID lowercased>, fn "Authorize"
        var hookID = 'app.payment.processor.' + processor.getID().toLowerCase();
        var result;
        if (HookMgr.hasHook(hookID)) {
            result = HookMgr.callHook(hookID, 'Authorize', order.orderNo, pi, processor);
        } else {
            result = HookMgr.callHook('app.payment.processor.default', 'Authorize',
                order.orderNo, pi, processor);
        }

        if (!result || result.error) {
            // Log the real reason here — the API caller only sees a generic 400.
            log.error('Order {0}: authorization declined by {1}', order.orderNo, hookID);
            OrderMgr.failOrder(order, true); // reopen basket so the shopper can retry
            return new Status(Status.ERROR, 'PAYMENT_DECLINED', 'Payment authorization failed');
        }
    }

    // Fully authorized — place the order (CREATED -> NEW) and mark it ready.
    // placeOrder returns a dw.system.Status object; check .error (not === Status.ERROR).
    var placeStatus = OrderMgr.placeOrder(order);
    if (placeStatus.error) {
        log.error('Order {0}: placeOrder failed', order.orderNo);
        OrderMgr.failOrder(order, false);
        return new Status(Status.ERROR, 'PLACE_FAILED', 'Order placement failed');
    }

    order.setConfirmationStatus(Order.CONFIRMATION_STATUS_CONFIRMED);
    order.setExportStatus(Order.EXPORT_STATUS_READY);

    // Return nothing — let the system implementation and any later hooks run.
};
```

Register it like any order hook:

```json
{
  "hooks": [
    { "name": "dw.ocapi.shop.order.afterPOST", "script": "./hooks/order.js" }
  ]
}
```

> The `app.payment.processor.<id>` Authorize hooks are themselves custom hooks (one per payment processor, function `Authorize`). By SFRA convention they return a plain object whose `error` flag signals the outcome — `{ authorized: true }` on success, `{ error: true }` on decline — which is why the example treats a missing result or `result.error` as a failure. This mirrors the SFRA `handlePayments` checkout helper. For order-status semantics (`placeOrder`/`failOrder`, reopen-basket behavior, status transitions) see [b2c-ordering](../b2c-ordering/SKILL.md).

## System Hooks

### Calculate Hooks

| Extension Point | Function | Purpose |
|-----------------|----------|---------|
| `dw.order.calculate` | `calculate` | Full basket/order calculation |
| `dw.order.calculateShipping` | `calculateShipping` | Shipping calculation |
| `dw.order.calculateTax` | `calculateTax` | Tax calculation |

```javascript
// hooks/calculate.js
var Status = require('dw/system/Status');
var HookMgr = require('dw/system/HookMgr');

exports.calculate = function(lineItemCtnr) {
    // Calculate shipping
    HookMgr.callHook('dw.order.calculateShipping', 'calculateShipping', lineItemCtnr);

    // Calculate promotions, totals...

    // Calculate tax
    HookMgr.callHook('dw.order.calculateTax', 'calculateTax', lineItemCtnr);

    return new Status(Status.OK);
};
```

### Payment Hooks

| Extension Point | Function | Purpose |
|-----------------|----------|---------|
| `dw.order.payment.authorize` | `authorize` | Payment authorization |
| `dw.order.payment.capture` | `capture` | Capture authorized payment |
| `dw.order.payment.refund` | `refund` | Refund payment |
| `dw.order.payment.validateAuthorization` | `validateAuthorization` | Check authorization validity |
| `dw.order.payment.reauthorize` | `reauthorize` | Re-authorize expired auth |

### Order Hooks

| Extension Point | Function | Purpose |
|-----------------|----------|---------|
| `dw.order.createOrderNo` | `createOrderNo` | Custom order number generation |

```javascript
var OrderMgr = require('dw/order/OrderMgr');
var Site = require('dw/system/Site');

exports.createOrderNo = function() {
    var seqNo = OrderMgr.createOrderSequenceNo();
    var prefix = Site.current.ID;
    return prefix + '-' + seqNo;
};
```

## Custom Hooks

Create your own extension points:

```javascript
// Define custom hook
var HookMgr = require('dw/system/HookMgr');

function processCheckout(basket) {
    // Call custom hook if registered
    if (HookMgr.hasHook('app.checkout.validate')) {
        var status = HookMgr.callHook('app.checkout.validate', 'validate', basket);
        if (status && status.error) {
            return status;
        }
    }
    // Continue processing...
}
```

Register in hooks.json:

```json
{
  "hooks": [
    {
      "name": "app.checkout.validate",
      "script": "./hooks/checkout.js"
    }
  ]
}
```

Custom hooks always execute all registered implementations regardless of return value.

## Remote Includes in Hooks

Enhance API responses with data from other SCAPI endpoints:

```javascript
var RESTResponseMgr = require('dw/system/RESTResponseMgr');

exports.modifyGETResponse = function(product, doc) {
    // Include Custom API response
    var include = RESTResponseMgr.createScapiRemoteInclude(
        'custom',           // API family
        'my-api',           // API name
        'v1',               // Version
        'endpoint'          // Endpoint
    );
    doc.c_additionalData = { value: [include] };
};
```

## Best Practices

- Return `undefined` (no return) from OCAPI/SCAPI hooks to ensure system implementations run
- Only return `Status.ERROR` when you need to stop processing
- Returning `Status.OK` skips system implementation and subsequent hooks
- Use `request.custom` to pass data between hooks
- Check `request.isSCAPI()` when supporting both APIs
- Keep hooks focused and performant
- Use custom properties (`c_` prefix) in modifyResponse
- Avoid transactions in calculate hooks (breaks SCAPI)
- Avoid slow external calls in beforeGET (affects caching)

## Error Handling

### Circuit Breaker

Too many hook errors triggers circuit breaker (HTTP 503):

```json
{
  "title": "Hook Circuit Breaker",
  "type": "https://api.commercecloud.salesforce.com/.../hook-circuit-breaker",
  "detail": "Failure rate above threshold of '50%'",
  "extensionPointName": "dw.ocapi.shop.basket.afterPOST"
}
```

### Timeout

Hooks must complete within the SCAPI timeout (HTTP 504 on timeout).

## Detailed References

- [OCAPI/SCAPI Hooks](references/OCAPI-SCAPI-HOOKS.md) - API hook patterns and available hooks
- [System Hooks](references/SYSTEM-HOOKS.md) - Calculate, payment, and order hooks
