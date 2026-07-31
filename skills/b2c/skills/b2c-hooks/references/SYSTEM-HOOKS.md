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

### SFRA Implementation

SFRA registers all three extension points to
`app_storefront_base/cartridge/scripts/hooks/cart/calculate.js`. Do not call `TaxMgr.applyTax()` from
inside `calculateTax` — `applyTax` belongs in `dw.order.calculate` and dispatches to
`dw.order.calculateTax` itself.

```javascript
// calculate.js
var Status = require('dw/system/Status');
var ShippingMgr = require('dw/order/ShippingMgr');
var TaxMgr = require('dw/order/TaxMgr');
var collections = require('*/cartridge/scripts/util/collections');

exports.calculateShipping = function(basket) {
    ShippingMgr.applyShippingCost(basket);
    return new Status(Status.OK);
};

exports.calculateTax = function(basket) {
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    var taxes = basketCalculationHelpers.calculateTaxes(basket);
    var taxesMap = {};

    taxes.taxes.forEach(function (item) {
        taxesMap[item.uuid] = { value: item.value, amount: item.amount };
    });

    var lineItems = basket.getAllLineItems();

    collections.forEach(lineItems, function (lineItem) {
        var tax = taxesMap[lineItem.UUID];

        if (tax) {
            if (tax.amount) {
                lineItem.updateTaxAmount(tax.value);
            } else {
                lineItem.updateTax(tax.value);
            }
        } else if (lineItem.taxClassID === TaxMgr.customRateTaxClassID) {
            lineItem.updateTax(lineItem.taxRate);
        } else {
            lineItem.updateTax(null);
        }
    });

    // Order-level price adjustments, including order-level shipping price adjustments
    if (!basket.getPriceAdjustments().empty || !basket.getShippingPriceAdjustments().empty) {
        if (collections.first(basket.getPriceAdjustments(), function (priceAdjustment) {
            return taxesMap[priceAdjustment.UUID] === null;
        }) || collections.first(basket.getShippingPriceAdjustments(), function (shippingPriceAdjustment) {
            return taxesMap[shippingPriceAdjustment.UUID] === null;
        })) {
            basket.updateOrderLevelPriceAdjustmentTax();
        }
    }

    if (taxes.custom) {
        Object.keys(taxes.custom).forEach(function (key) {
            basket.custom[key] = taxes.custom[key];
        });
    }

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

| Extension Point                    | Function                                    | Purpose                                |
| ---------------------------------- | ------------------------------------------- | -------------------------------------- |
| `dw.order.populateCustomerDetails` | `populateCustomerDetails(basket, customer)` | Populate customer data onto the basket |

> **Note**: `dw.order.hooks` is the _package_ holding the hook interfaces — it is never part of the
> extension point name. There is no `dw.order.hooks.validateOrder` system hook; order validation for
> OCAPI/SCAPI order requests is `dw.ocapi.shop.order.validateOrder`, documented in
> [OCAPI/SCAPI Hooks](./OCAPI-SCAPI-HOOKS.md).

## Return Hooks

> **Inactive by default.** Return and shipping order hooks are order post-processing APIs and
> **throw an exception if accessed**. Activation requires approval from Product Management.

| Extension Point                      | Function                                                   | Purpose                      |
| ------------------------------------ | ---------------------------------------------------------- | ---------------------------- |
| `dw.order.return.createReturn`       | `createReturn(returnWO: ReturnWO)`                         | Create the return record     |
| `dw.order.return.addReturnItem`      | `addReturnItem(retrn: Return, returnItemWO: ReturnItemWO)` | Add an item to a return      |
| `dw.order.return.changeStatus`       | `changeStatus(retrn: Return, returnWO: ReturnWO)`          | Handle return status changes |
| `dw.order.return.afterStatusChange`  | `afterStatusChange(retrn: Return)`                         | React after a status change  |
| `dw.order.return.notifyStatusChange` | `notifyStatusChange(retrn: Return)`                        | Notify on status change      |

## Shipping Order Hooks

> **Inactive by default.** Same order post-processing restriction as [Return Hooks](#return-hooks).

| Extension Point                                      | Function                                                                       | Purpose                              |
| ---------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------ |
| `dw.order.shippingorder.prepareCreateShippingOrders` | `prepareCreateShippingOrders(order: Order)`                                    | Prepare shipping order creation      |
| `dw.order.shippingorder.createShippingOrders`        | `createShippingOrders(order: Order)`                                           | Create shipping orders for an order  |
| `dw.order.shippingorder.resolveShippingOrder`        | `resolveShippingOrder(shippingOrderWO: ShippingOrderWO)`                       | Resolve the target shipping order    |
| `dw.order.shippingorder.changeStatus`                | `changeStatus(shippingOrder: ShippingOrder, shippingOrderWO: ShippingOrderWO)` | Handle shipping order status changes |
| `dw.order.shippingorder.afterStatusChange`           | `afterStatusChange(shippingOrder: ShippingOrder)`                              | React after a status change          |
| `dw.order.shippingorder.notifyStatusChange`          | `notifyStatusChange(shippingOrder: ShippingOrder)`                             | Notify on status change              |
| `dw.order.shippingorder.updateShippingOrderItem`     | `updateShippingOrderItem(shippingOrder: ShippingOrder, itemWO: ShippingOrderItemWO)` | Update a shipping order item    |
| `dw.order.shippingorder.setShippingOrderShipped`     | `setShippingOrderShipped(shippingOrderWO: ShippingOrderWO)`                    | Mark a shipping order shipped        |
| `dw.order.shippingorder.setShippingOrderCancelled`   | `setShippingOrderCancelled(shippingOrderWO: ShippingOrderWO)`                  | Mark a shipping order cancelled      |
| `dw.order.shippingorder.setShippingOrderWarehouse`   | `setShippingOrderWarehouse(shippingOrderWO: ShippingOrderWO)`                  | Set the warehouse                    |

## Basket Merge Hooks

| Extension Point        | Function                             | Purpose                   |
| ---------------------- | ------------------------------------ | ------------------------- |
| `dw.order.mergeBasket` | `mergeBasket(source, currentBasket)` | Custom basket merge logic |

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
