---
name: b2c-hooks
description: >-
  Register and implement B2C Commerce platform hooks declared in hooks.json and invoked by HookMgr during OCAPI/SCAPI requests or system events. Use for hooks.json, HookMgr.callHook(), dw.system.Status, dw.ocapi.shop.* before/after/modifyResponse hooks, dw.order.payment.authorize/authorizeCreditCard, dw.order.calculate, app.payment.processor.*, SCAPI order-payment authorization and placement, rollback semantics, and request.custom transport. Do not use for external Node.js webhooks, SFRA controller middleware or prepend/append chains, scheduled job steps in steptypes.json, or Git/CI hooks.
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

## Headless Order Payment: Use the Order-PI Authorization Seam

Lead with the documented Shopper Orders lifecycle. Do not authorize payment in
`dw.ocapi.shop.order.afterPOST` by default:

```text
POST /orders
  -> order persists in CREATED
PATCH /orders/{orderNo}/payment-instruments/{paymentInstrumentId}
  -> platform updates the order PI
  -> dw.order.payment.authorizeCreditCard or dw.order.payment.authorize
  -> order.payment_instrument.afterPATCH(..., successfullyAuthorized)
  -> default afterPATCH places the order when authorized coverage >= order total
```

This separates order creation from the gateway call, preserves a durable order number for recovery,
uses the same authorization extension points as the standard Commerce implementation and payment
extensions, and lets the platform own final coverage-based placement.

### Authorization Semantics

The order-PI `PATCH` chooses the payment hook as follows:

- Require the selected payment method to be active and applicable to the order. For
  `CREDIT_CARD`, include `paymentCard` in the request.
- Call `dw.order.payment.authorizeCreditCard` when the request includes `paymentCard` or the order PI
  contains a credit-card type.
- Otherwise call `dw.order.payment.authorize`.
- For a saved payment method, pass the documented customer payment-instrument ID (called
  `customer_payment_instrument_id` in the OCAPI documentation; generated SCAPI clients can expose a
  camel-case property). Commerce resolves it from the order customer's payment instruments and
  copies that PI for authorization; an unknown ID throws. Amount and card security code from the
  request are still propagated to `authorizeCreditCard`.
- Without a customer PI reference, the authorization input is populated from request data such as
  `paymentCard` or bank-account information. Do not assume the `paymentDetails` argument is the same
  object instance as the persistent PI already attached to `order`; resolve and validate the
  persistent instrument when provider state was stored there.
- Do not accept a client-supplied reusable payment token as an ownership substitute.
- Set the payment transaction's processor, amount, type, and provider transaction identifiers in the
  authorization implementation. Return `Status.OK` only for a successful authorization and
  `Status.ERROR` otherwise.

Register `dw.order.payment.authorizeCreditCard`, `dw.order.payment.authorize`, and the order-PI
`beforePATCH`/`afterPATCH` hooks. In `beforePATCH`, validate the untrusted request against persistent
order state before any gateway call: PI count, method, applicable processor, server-owned tender
allocation, amount, ownership/token provenance, and integration state. A single-PI checkout can
require the requested amount to equal the order total; validate each server-owned allocation for
split tender.

Use all four documented `afterPATCH` parameters. The platform reduces the payment authorization
`Status` to `successfullyAuthorized`; preserve a richer processor outcome in `request.custom` only
when the distinction is needed within this same request:

```javascript
var Status = require('dw/system/Status');

exports.afterPATCH = function (order, paymentInstrument, newPaymentInstrument, successfullyAuthorized) {
    if (!successfullyAuthorized) {
        if (request.custom.deterministicPaymentDecline === true) {
            return new Status(Status.ERROR, 'PAYMENT_DECLINED');
        }
        return; // Preserve indeterminate/review state for reconciliation.
    }

    var validation = validateAuthorizedInstrument(order, paymentInstrument);
    if (validation) { return validation; }
    // Return undefined so the default placement implementation still runs.
};
```

`successfullyAuthorized === true` applies to the payment instrument just processed; it does not by
itself prove that a multi-instrument order is fully covered. Let the default implementation place the
still-`CREATED` order only when authorized payment coverage equals or exceeds the order total. The
result changes the order to `NEW` and prepares it for export.

### Storefront/BFF Outcome Handling

Treat the returned order status as the authoritative placement result:

- `NEW`: placement succeeded.
- `CREATED`: the order was not placed. This can be expected while authorizing multiple instruments,
  or it can represent decline/review/unknown state.
- Deterministic authorization failure: call Shopper Orders
  `POST /orders/{orderNo}/actions/fail?reopenBasket=true` with reason code
  `payment_auth_failure` so Commerce persists the failed order and restores the basket.
- Indeterminate gateway result: do not automatically retry or reopen the basket. Preserve the
  `CREATED` order for reconciliation to avoid duplicate authorization.

In this recommended flow, use the Shopper Orders fail action for the durable state transition rather
than coordinating failure across the order POST hooks.

### Alternative: Authorize and Place in `order.afterPOST`

Use `dw.ocapi.shop.order.afterPOST` when a checkout deliberately needs one server-side phase that
creates the order, authorizes every PI, and performs the Commerce-side place-or-fail transition in
the order-creation transaction, or when a processor cannot participate in the order-PI authorization
endpoints. This keeps the storefront orchestration simple. The external gateway side effect is not
rolled back with the Commerce transaction, so balance that benefit against these tradeoffs:

- The external payment call runs inside order creation's platform transaction and consumes the
  order-POST timeout budget.
- Returning `Status.ERROR` rolls back order creation, so the caller can lose both the order and the
  original basket reference.
- The implementation must manually authorize every PI, verify total coverage, call
  `OrderMgr.placeOrder`/`failOrder`, and preserve any later platform or cartridge behavior.
- Do not add `Transaction.wrap()` around `OrderMgr.placeOrder()` or `OrderMgr.failOrder()` inside
  `afterPOST`; it already runs in a platform transaction.

If choosing this option, see
[Order Hook Lifecycle](references/ORDER-HOOK-LIFECYCLE.md) for transaction semantics and the
two-hook variant that persists a failed order while returning an HTTP error.

### `request.custom` for Inter-Hook Data Passing

Use `request.custom` only as request-scoped transport between hook phases. Do not add persistent
metadata solely to carry a richer outcome from `authorize*` to `afterPATCH` in the same request.

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
| `dw.order.payment.authorizeCreditCard` | `authorizeCreditCard` | Credit-card authorization invoked by order-PI POST/PATCH |
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
- [Order Hook Lifecycle](references/ORDER-HOOK-LIFECYCLE.md) - Lifecycle phases, rollback semantics, and the two-hook pattern
