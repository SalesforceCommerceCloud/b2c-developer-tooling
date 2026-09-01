# Shopper Order Payment Lifecycle (SCAPI/OCAPI)

## Recommended Lifecycle

Use the documented Shopper Orders payment-instrument authorization seam:

```text
POST /orders
  |
  v
beforePOST(basket) -> platform creates and commits order in CREATED -> afterPOST(order)
  |
  v
PATCH /orders/{orderNo}/payment-instruments/{paymentInstrumentId}
  |
  +-> order.payment_instrument.beforePATCH(order, persistentPI, requestPI)
  +-> platform updates/resolves the payment instrument
  +-> dw.order.payment.authorizeCreditCard or dw.order.payment.authorize
  +-> order.payment_instrument.afterPATCH(..., successfullyAuthorized)
  +-> default afterPATCH places when authorized coverage >= order total
  +-> order.payment_instrument.modifyPATCHResponse(...)
  |
  v
NEW = placed; CREATED = not yet placed
```

Do not perform a slow gateway call in `order.afterPOST` by default. Let order creation commit first,
then authorize through the order-PI endpoint. This keeps a durable order number available when the
gateway declines, times out, or returns an indeterminate result.

## Hook Responsibilities

| Phase | Responsibility |
|-------|----------------|
| `order.beforePOST` | Validate the basket at the final server-owned boundary before order creation |
| `order.afterPOST` | Add fast order metadata only; do not authorize/place in the recommended flow |
| `order.payment_instrument.beforePATCH` | Reject untrusted method, amount, processor, ownership, and token-provenance input before the gateway call |
| `dw.order.payment.authorizeCreditCard` | Authorize credit cards and persist the payment transaction result |
| `dw.order.payment.authorize` | Authorize non-card instruments and persist the payment transaction result |
| `order.payment_instrument.afterPATCH` | Use `successfullyAuthorized`, perform final persistent-state checks, and return no value on success |
| Platform default `afterPATCH` | Place a still-`CREATED` order when authorized payment coverage equals or exceeds the total |
| `order.payment_instrument.modifyPATCHResponse` | Shape the response or perform post-placement reporting; determine success from persisted order status |

The `afterPATCH` signature is:

```javascript
afterPATCH(order, paymentInstrument, newPaymentInstrument, successfullyAuthorized)
```

- `paymentInstrument` is the updated persistent order PI.
- `newPaymentInstrument` is request data and remains untrusted.
- `successfullyAuthorized` is the payment-hook result reduced to a boolean.
- A non-null `Status` ends hook execution. Return `undefined` after successful validation so the
  platform placement implementation still runs.

Use `request.custom` to retain a richer authorization outcome within the request when the boolean is
insufficient. For example, distinguish a deterministic decline from a gateway timeout or manual
review. Do not add object metadata solely as inter-hook transport.

## Payment-Instrument Resolution

The order-PI endpoint invokes:

- Require an applicable payment method; include payment-card data when the method is `CREDIT_CARD`.
- `dw.order.payment.authorizeCreditCard` when the request includes payment-card data or the PI has a
  credit-card type.
- `dw.order.payment.authorize` otherwise.

For a saved payment method, pass the documented customer payment-instrument ID (named
`customer_payment_instrument_id` in the OCAPI documentation; generated SCAPI clients can expose a
camel-case property). Commerce resolves the reference from the order customer's instruments and
copies that customer PI for authorization; an unknown ID throws. Request amount and card security
code are still propagated to `authorizeCreditCard`.

Without that reference, the payment hook input is populated from request data such as payment-card
or bank-account information. Do not assume this `paymentDetails` argument is the same object instance
as the persistent PI attached to `order`. Resolve the persistent instrument when the integration
stored token or approval state on it. Treat reusable payment tokens and all `c_*` request properties
as untrusted input; possession of a client-supplied token does not prove wallet ownership.

## Success and Failure Handling

After the final required payment-instrument request:

- Treat `NEW` as placement success.
- Treat `CREATED` as not placed. During a multi-instrument flow this is expected until total
  authorized coverage is sufficient.
- On a deterministic authorization failure, call the Shopper Orders fail action with
  `reopenBasket=true` to persist the failed order and restore the basket.
- On timeout or indeterminate provider state, preserve the `CREATED` order for reconciliation. Do not
  automatically retry or reopen the basket when doing so could duplicate an authorization.

Current Shopper Orders v1 failure request:

```http
POST /checkout/shopper-orders/v1/organizations/{organizationId}/orders/{orderNo}/actions/fail?siteId={siteId}&reopenBasket=true
Authorization: Bearer {shopperToken}
Content-Type: application/json

{
  "reasonCode": "payment_auth_failure"
}
```

Supported payment-oriented reason codes are `payment_auth_failure`, `payment_confirm_failure`, and
`payment_capture_failure`. Confirm the current schema before generating version-specific code.

## Alternative: Complete Checkout in `order.afterPOST`

Choose this option when checkout should create, authorize, and perform the Commerce-side
place-or-fail transition in one server-side phase, or when a processor cannot participate in the
order-PI authorization lifecycle. It reduces storefront orchestration and makes `order.afterPOST`
own the complete `CREATED -> NEW/FAILED` transition. The external gateway operation is not rolled
back with the Commerce transaction.

Important transaction rules:

- `order.afterPOST` runs inside the order-creation transaction. Do not wrap `OrderMgr.placeOrder`,
  `OrderMgr.failOrder`, or PI mutations in another `Transaction.wrap`.
- `Status.ERROR` rolls back the complete order creation; no order record survives.
- Returning success after `OrderMgr.failOrder` commits a queryable failed order but does not produce
  an HTTP error by itself.
- Manually verify every payment instrument and total authorized coverage before placement.

These rollback semantics were empirically verified on sandbox zzpq-019 on 2026-06-24: an
`afterPOST` `Status.ERROR` returned HTTP 400 and left no searchable order.

### Two-Hook Variant

If this flow must both persist a failed order and return an HTTP error, split the behavior:

```javascript
var OrderMgr = require('dw/order/OrderMgr');
var Status = require('dw/system/Status');

exports.afterPOST = function (order) {
    var result = authorizePayment(order);
    if (result.declined) {
        OrderMgr.failOrder(order, false);
        request.custom.paymentDecline = {
            code: result.code,
            message: result.message
        };
        return new Status(Status.OK); // commit the FAILED order
    }

    var placeStatus = OrderMgr.placeOrder(order);
    if (placeStatus.error) {
        return new Status(Status.ERROR, 'PLACE_FAILED');
    }
};

exports.modifyPOSTResponse = function () {
    var decline = request.custom.paymentDecline;
    if (decline) {
        return new Status(Status.ERROR, decline.code, decline.message);
    }
};
```

This remains a valid single-phase checkout option. Prefer the separate order-PI authorization plus
Shopper Orders fail action when durable intermediate state, shorter order creation, payment-extension
alignment, or explicit recovery control matters more than atomic one-request orchestration.

## Cross-References

- [B2C Hooks](../SKILL.md#headless-order-payment-use-the-order-pi-authorization-seam) — primary implementation guidance
- [b2c-ordering](../../b2c-ordering/SKILL.md) — order statuses and Shopper Orders failure handling
- [OCAPI/SCAPI Hooks reference](./OCAPI-SCAPI-HOOKS.md) — hook signature list
