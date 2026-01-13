# System Hooks Reference

System hooks provide extension points for core B2C Commerce functionality like order calculation, payment processing, and order management.

## Calculate Hooks

Calculate hooks control basket and order calculation logic.

### Extension Points

| Extension Point | Function | Purpose |
|-----------------|----------|---------|
| `dw.order.calculate` | `calculate(lineItemCtnr)` | Full calculation |
| `dw.order.calculateShipping` | `calculateShipping(lineItemCtnr)` | Shipping only |
| `dw.order.calculateTax` | `calculateTax(lineItemCtnr)` | Tax only |

### Registration

```json
{
  "hooks": [
    {"name": "dw.order.calculate", "script": "./calculate.js"},
    {"name": "dw.order.calculateShipping", "script": "./calculate.js"},
    {"name": "dw.order.calculateTax", "script": "./calculate.js"}
  ]
}
```

### Implementation

```javascript
// calculate.js
var Status = require('dw/system/Status');
var HookMgr = require('dw/system/HookMgr');
var ShippingMgr = require('dw/order/ShippingMgr');
var TaxMgr = require('dw/order/TaxMgr');

exports.calculate = function(lineItemCtnr) {
    // 1. Calculate product prices
    calculateProductPrices(lineItemCtnr);

    // 2. Calculate shipping
    HookMgr.callHook('dw.order.calculateShipping', 'calculateShipping', lineItemCtnr);

    // 3. Calculate promotions
    calculatePromotions(lineItemCtnr);

    // 4. Calculate tax
    HookMgr.callHook('dw.order.calculateTax', 'calculateTax', lineItemCtnr);

    // 5. Calculate totals
    lineItemCtnr.updateTotals();

    return new Status(Status.OK);
};

exports.calculateShipping = function(lineItemCtnr) {
    var shipments = lineItemCtnr.shipments.iterator();
    while (shipments.hasNext()) {
        var shipment = shipments.next();
        var method = shipment.shippingMethod;
        if (method) {
            var cost = ShippingMgr.getShippingCost(method, shipment);
            shipment.setShippingLineItem(method);
            shipment.shippingLineItem.setPriceValue(cost.amount.value);
        }
    }
    return new Status(Status.OK);
};

exports.calculateTax = function(lineItemCtnr) {
    // Use built-in tax calculation or external service
    TaxMgr.applyDefaultTaxes(lineItemCtnr);
    return new Status(Status.OK);
};
```

### SCAPI Consideration

**Important**: Do not use transactions in calculate hooks when supporting SCAPI:

```javascript
exports.calculate = function(lineItemCtnr) {
    // DON'T do this - breaks SCAPI
    // Transaction.wrap(function() { ... });

    // DO this instead - SCAPI manages transactions
    calculatePrices(lineItemCtnr);
    return new Status(Status.OK);
};
```

Check if running under SCAPI:

```javascript
exports.calculate = function(lineItemCtnr) {
    if (request.isSCAPI()) {
        // SCAPI path - no transactions
    } else {
        // Controller path - may use transactions
    }
};
```

## Payment Hooks

Payment hooks handle authorization, capture, and refund operations.

### Extension Points

| Extension Point | Function | When Called |
|-----------------|----------|-------------|
| `dw.order.payment.authorize` | `authorize(order, instrument)` | Initial authorization |
| `dw.order.payment.authorizeCreditCard` | `authorizeCreditCard(order, instrument, cvn)` | Credit card auth |
| `dw.order.payment.validateAuthorization` | `validateAuthorization(order)` | Check auth validity |
| `dw.order.payment.reauthorize` | `reauthorize(order)` | Re-authorize if expired |
| `dw.order.payment.capture` | `capture(invoice)` | Capture payment |
| `dw.order.payment.refund` | `refund(invoice)` | Refund payment |
| `dw.order.payment.releaseAuthorization` | `releaseAuthorization(order)` | Release auth hold |

### Authorization Flow

```javascript
// payment.js
var Status = require('dw/system/Status');
var Transaction = require('dw/system/Transaction');

exports.authorize = function(order, paymentInstrument) {
    var paymentMethod = paymentInstrument.paymentMethod;

    // Call payment processor
    var result = callPaymentProcessor(order, paymentInstrument);

    if (result.success) {
        // Store authorization info
        Transaction.wrap(function() {
            paymentInstrument.paymentTransaction.setTransactionID(result.transactionId);
            paymentInstrument.paymentTransaction.custom.authCode = result.authCode;
            paymentInstrument.paymentTransaction.custom.authTimestamp = new Date();
        });
        return new Status(Status.OK);
    }

    return new Status(Status.ERROR, 'AUTHORIZATION_FAILED', result.errorMessage);
};

exports.validateAuthorization = function(order) {
    var validPayments = 0;
    var instruments = order.paymentInstruments.iterator();

    while (instruments.hasNext()) {
        var pi = instruments.next();
        var authTimestamp = pi.paymentTransaction.custom.authTimestamp;

        // Check if auth is still valid (e.g., within 7 days)
        if (authTimestamp) {
            var authAge = Date.now() - authTimestamp.getTime();
            var sevenDays = 7 * 24 * 60 * 60 * 1000;

            if (authAge < sevenDays) {
                validPayments++;
            }
        }
    }

    return validPayments > 0 ? new Status(Status.OK) : new Status(Status.ERROR);
};

exports.reauthorize = function(order) {
    var instruments = order.paymentInstruments.iterator();

    while (instruments.hasNext()) {
        var pi = instruments.next();
        var result = callPaymentProcessor(order, pi);

        if (!result.success) {
            return new Status(Status.ERROR, 'REAUTH_FAILED');
        }

        Transaction.wrap(function() {
            pi.paymentTransaction.custom.authTimestamp = new Date();
        });
    }

    return new Status(Status.OK);
};
```

### Capture Flow

```javascript
exports.capture = function(invoice) {
    var order = invoice.order;
    var amount = invoice.grandTotal.grossPrice;

    // Find payment instrument for this invoice
    var paymentInstrument = findPaymentInstrument(order, invoice);
    if (!paymentInstrument) {
        return new Status(Status.ERROR, 'NO_PAYMENT_INSTRUMENT');
    }

    // Call payment processor to capture
    var result = capturePayment(paymentInstrument, amount);

    if (result.success) {
        Transaction.wrap(function() {
            invoice.addCaptureTransaction(paymentInstrument, amount);
        });
        return new Status(Status.OK);
    }

    return new Status(Status.ERROR, 'CAPTURE_FAILED', result.errorMessage);
};
```

### Refund Flow

```javascript
exports.refund = function(invoice) {
    var order = invoice.order;
    var amount = invoice.grandTotal.grossPrice;

    var paymentInstrument = findPaymentInstrument(order, invoice);
    if (!paymentInstrument) {
        return new Status(Status.ERROR, 'NO_PAYMENT_INSTRUMENT');
    }

    var result = refundPayment(paymentInstrument, amount);

    if (result.success) {
        Transaction.wrap(function() {
            invoice.addRefundTransaction(paymentInstrument, amount);
        });
        return new Status(Status.OK);
    }

    return new Status(Status.ERROR, 'REFUND_FAILED', result.errorMessage);
};
```

## Order Hooks

### Order Number Generation

```javascript
// orders.js
var OrderMgr = require('dw/order/OrderMgr');
var Site = require('dw/system/Site');

exports.createOrderNo = function() {
    // Get sequential number
    var seqNo = OrderMgr.createOrderSequenceNo();

    // Add site prefix
    var siteId = Site.current.ID;

    // Format: SITE-YYYYMMDD-00001
    var date = new Date();
    var dateStr = date.getFullYear().toString() +
        ('0' + (date.getMonth() + 1)).slice(-2) +
        ('0' + date.getDate()).slice(-2);

    return siteId + '-' + dateStr + '-' + seqNo;
};
```

Registration:

```json
{
  "hooks": [
    {"name": "dw.order.createOrderNo", "script": "./orders.js"}
  ]
}
```

**Note**: Maximum order number length is 50 characters.

## Checkout Hooks

| Extension Point | Function | Purpose |
|-----------------|----------|---------|
| `dw.order.hooks.validateOrder` | `validateOrder(basket)` | Validate before order creation |

## Return Hooks

| Extension Point | Function | Purpose |
|-----------------|----------|---------|
| `dw.order.hooks.returnChangeStatus` | `changeStatus(return, returnWO)` | Handle return status changes |

## Shipping Order Hooks

| Extension Point | Function | Purpose |
|-----------------|----------|---------|
| `dw.order.hooks.shippingOrderChangeStatus` | `changeStatus(shippingOrder, shippingOrderWO)` | Handle shipping order status |

## Basket Merge Hooks

| Extension Point | Function | Purpose |
|-----------------|----------|---------|
| `dw.order.hooks.basketMerge` | `merge(sourceBasket, targetBasket)` | Custom basket merge logic |

## Request Hooks

| Extension Point | Function | Purpose |
|-----------------|----------|---------|
| `dw.system.request.onRequest` | `onRequest()` | Called at request start |
| `dw.system.request.onSession` | `onSession()` | Called when session starts |

## Custom Extension Points

Create your own extension points for application-specific logic:

```javascript
// In your controller/script
var HookMgr = require('dw/system/HookMgr');

function processLoyalty(customer, order) {
    if (HookMgr.hasHook('app.loyalty.processOrder')) {
        return HookMgr.callHook('app.loyalty.processOrder', 'processOrder', customer, order);
    }
    return null;
}
```

Register implementation:

```json
{
  "hooks": [
    {"name": "app.loyalty.processOrder", "script": "./loyalty.js"}
  ]
}
```

```javascript
// loyalty.js
var Status = require('dw/system/Status');

exports.processOrder = function(customer, order) {
    var points = calculateLoyaltyPoints(order);
    awardPoints(customer, points);
    return new Status(Status.OK);
};
```

Custom hooks execute all registered implementations regardless of return values.

## Hook Execution Order

When multiple cartridges register the same hook:
1. Hooks execute in cartridge path order
2. First hook to return a value stops execution (for system hooks)
3. Custom hooks execute all implementations

## Best Practices

### Calculate Hooks

- Keep calculations fast - runs frequently
- Avoid external service calls during calculation
- Use caching for expensive lookups
- Don't use transactions under SCAPI

### Payment Hooks

- Always handle partial failures
- Log transaction IDs for debugging
- Implement idempotency where possible
- Store auth timestamps for validation

### General

- Return appropriate Status objects
- Handle exceptions gracefully
- Use Transaction.wrap() for data changes (except SCAPI calculate)
- Log errors with context for debugging
