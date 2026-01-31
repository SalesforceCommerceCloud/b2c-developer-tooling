---
name: b2c-ordering
description: Work with orders using OrderMgr API in B2C Commerce. Use when creating orders, managing order status, handling order failures, or implementing checkout flows. Covers order lifecycle, status transitions, async order processing, and order queries.
---

# B2C Ordering

The OrderMgr API provides order creation, status management, and querying. Understanding the order lifecycle is essential for checkout implementation and order processing.

## Order Lifecycle

Orders progress through these statuses:

```
Basket → CREATED → NEW → (COMPLETED or CANCELLED or FAILED)
```

| Status | Description | Can Transition To |
|--------|-------------|-------------------|
| `CREATED` | Order created, not yet placed | `NEW`, `FAILED` |
| `NEW` | Order placed, awaiting fulfillment | `OPEN`, `COMPLETED`, `CANCELLED`, `FAILED` |
| `OPEN` | Order in processing | `COMPLETED`, `CANCELLED` |
| `COMPLETED` | Order fulfilled | - |
| `CANCELLED` | Order cancelled | `NEW` (via `undoCancel`) |
| `FAILED` | Order failed (payment, validation) | - (cannot be reopened) |

**Important:** Once an order reaches `FAILED` status, it cannot be reopened or cancelled. Use `failOrder(order, true)` to reopen the basket for retry instead.

## Creating Orders

### Standard Flow (Synchronous)

```javascript
var OrderMgr = require('dw/order/OrderMgr');
var Transaction = require('dw/system/Transaction');
var Status = require('dw/system/Status');

function createOrder(basket) {
    var order;

    Transaction.wrap(function() {
        // Create order from basket (status: CREATED)
        order = OrderMgr.createOrder(basket);
    });

    if (!order) {
        return { error: true, message: 'Order creation failed' };
    }

    // Authorize payment
    var paymentResult = authorizePayment(order);

    if (!paymentResult.success) {
        Transaction.wrap(function() {
            OrderMgr.failOrder(order, true); // Reopen basket
        });
        return { error: true, message: 'Payment failed' };
    }

    // Place the order (status: CREATED → NEW)
    var placeResult;
    Transaction.wrap(function() {
        placeResult = OrderMgr.placeOrder(order);
    });

    if (placeResult.error) {
        return { error: true, message: 'Order placement failed' };
    }

    // Set confirmation status
    Transaction.wrap(function() {
        order.setConfirmationStatus(order.CONFIRMATION_STATUS_CONFIRMED);
    });

    return { error: false, order: order };
}
```

### Async Flow (SCAPI Pattern)

For SCAPI/headless, create the order before payment authorization:

```javascript
var OrderMgr = require('dw/order/OrderMgr');
var Transaction = require('dw/system/Transaction');

// Step 1: Create order (before payment)
function createOrderAsync(basket, orderNo) {
    var order;

    Transaction.wrap(function() {
        // Create with specific order number (for idempotency)
        order = OrderMgr.createOrder(basket, orderNo);
    });

    return order;
}

// Step 2: After payment success, place the order
function placeOrderAfterPayment(order) {
    Transaction.wrap(function() {
        OrderMgr.placeOrder(order);
        order.setConfirmationStatus(order.CONFIRMATION_STATUS_CONFIRMED);
        order.setExportStatus(order.EXPORT_STATUS_READY);
    });
}

// Step 2 (alt): Payment failed, fail the order
function failOrderAfterPayment(order) {
    Transaction.wrap(function() {
        OrderMgr.failOrder(order, false); // Don't reopen basket
    });
}
```

## OrderMgr API Reference

### Order Creation

| Method | Description |
|--------|-------------|
| `createOrder(basket)` | Create order with auto-generated number |
| `createOrder(basket, orderNo)` | Create order with specific number |
| `createOrderNo()` | Generate next order number |
| `createOrderSequenceNo()` | Get next sequence number (for custom formatting) |

### Order Status

| Method | Description |
|--------|-------------|
| `placeOrder(order)` | Place order (CREATED → NEW) |
| `failOrder(order, reopenBasket)` | Fail order (set to FAILED status) |
| `cancelOrder(order)` | Cancel order (set to CANCELLED status) |
| `undoCancelOrder(order)` | Revert cancelled order to NEW |

**Note:** There is no `undoFailOrder()` method. Failed orders cannot be reopened. Use `failOrder(order, true)` to reopen the basket for retry.

### Order Queries

| Method | Description |
|--------|-------------|
| `getOrder(orderNo)` | Get order by number |
| `searchOrder(query, ...args)` | Search for single order |
| `searchOrders(query, sortString, ...args)` | Search for multiple orders |
| `queryOrder(query, ...args)` | Query single order |
| `queryOrders(query, sortString, ...args)` | Query multiple orders |

## Querying Orders

### Get Order by Number

```javascript
var OrderMgr = require('dw/order/OrderMgr');

var order = OrderMgr.getOrder('00001234');

if (order) {
    var status = order.status.value;
    var total = order.totalGrossPrice;
}
```

### Search Orders

```javascript
var OrderMgr = require('dw/order/OrderMgr');

// Search by customer email
var orders = OrderMgr.searchOrders(
    'customerEmail = {0} AND status != {1}',
    'creationDate desc',
    'customer@example.com',
    dw.order.Order.ORDER_STATUS_FAILED
);

while (orders.hasNext()) {
    var order = orders.next();
    // Process order
}
orders.close();
```

### Query by Date Range

```javascript
var OrderMgr = require('dw/order/OrderMgr');
var Calendar = require('dw/util/Calendar');

var startDate = new Calendar();
startDate.add(Calendar.DAY_OF_YEAR, -7);

var orders = OrderMgr.searchOrders(
    'creationDate >= {0} AND status = {1}',
    'creationDate desc',
    startDate.time,
    dw.order.Order.ORDER_STATUS_NEW
);

while (orders.hasNext()) {
    var order = orders.next();
    // Process order
}
orders.close();
```

## Order Status Management

### Cancel Order

```javascript
var OrderMgr = require('dw/order/OrderMgr');
var Transaction = require('dw/system/Transaction');
var Order = require('dw/order/Order');

function cancelOrder(orderNo) {
    var order = OrderMgr.getOrder(orderNo);

    if (!order) {
        return { error: true, message: 'Order not found' };
    }

    // Can only cancel NEW or OPEN orders
    if (order.status.value !== Order.ORDER_STATUS_NEW &&
        order.status.value !== Order.ORDER_STATUS_OPEN) {
        return { error: true, message: 'Order cannot be cancelled' };
    }

    Transaction.wrap(function() {
        OrderMgr.cancelOrder(order);
    });

    return { error: false };
}
```

### Fail Order

```javascript
var OrderMgr = require('dw/order/OrderMgr');
var Transaction = require('dw/system/Transaction');

function failOrder(order, reopenBasket) {
    // reopenBasket: true = customer can retry checkout
    //               false = basket is lost

    Transaction.wrap(function() {
        OrderMgr.failOrder(order, reopenBasket);
    });
}
```

### Handling Failed Orders

**Failed orders cannot be reopened.** Instead, use `failOrder(order, true)` to reopen the basket:

```javascript
var OrderMgr = require('dw/order/OrderMgr');
var Transaction = require('dw/system/Transaction');

// When payment fails, fail the order and reopen basket
function handlePaymentFailure(order) {
    Transaction.wrap(function() {
        // reopenBasket=true allows customer to retry checkout
        OrderMgr.failOrder(order, true);
    });

    // Basket is now available again for the customer
    return { error: true, message: 'Payment failed. Please try again.' };
}
```

### SCAPI: Fail with Reopen (B2C 24.3+)

For SCAPI integrations, use the `failed_with_reopen` status to fail an order while reopening the basket:

```http
PATCH /checkout/orders/v1/organizations/{orgId}/orders/{orderNo}?siteId={siteId}
Authorization: Bearer {token}
Content-Type: application/json

{
    "status": "failed_with_reopen"
}
```

This is equivalent to `OrderMgr.failOrder(order, true)` in Script API.

### Undo Cancelled Order

Cancelled orders can be reopened using `undoCancelOrder()`:

```javascript
var OrderMgr = require('dw/order/OrderMgr');
var Transaction = require('dw/system/Transaction');
var Order = require('dw/order/Order');

function reopenCancelledOrder(orderNo) {
    var order = OrderMgr.getOrder(orderNo);

    if (order.status.value !== Order.ORDER_STATUS_CANCELLED) {
        return { error: true, message: 'Order is not cancelled' };
    }

    Transaction.wrap(function() {
        // Revert to NEW status
        OrderMgr.undoCancelOrder(order);
    });

    return { error: false, order: order };
}
```

## Order Properties

| Property | Description |
|----------|-------------|
| `orderNo` | Order number |
| `status` | Current order status |
| `confirmationStatus` | Confirmation status |
| `exportStatus` | Export status for OMS |
| `paymentStatus` | Payment status |
| `shippingStatus` | Shipping status |
| `customerEmail` | Customer email |
| `customerName` | Customer name |
| `totalGrossPrice` | Order total (with tax) |
| `totalNetPrice` | Order total (without tax) |
| `totalTax` | Total tax amount |
| `creationDate` | Order creation date |
| `productLineItems` | Line items in order |
| `shipments` | Order shipments |
| `paymentInstruments` | Payment instruments |

## Custom Order Numbers

Use the `dw.order.createOrderNo` hook for custom order number generation:

```javascript
// hooks.json
{
    "hooks": [
        {
            "name": "dw.order.createOrderNo",
            "script": "./hooks/orderNo.js"
        }
    ]
}
```

```javascript
// hooks/orderNo.js
var OrderMgr = require('dw/order/OrderMgr');
var Site = require('dw/system/Site');

exports.createOrderNo = function() {
    var seqNo = OrderMgr.createOrderSequenceNo();
    var prefix = Site.current.ID.toUpperCase();
    var year = new Date().getFullYear();

    return prefix + '-' + year + '-' + seqNo;
};
```

## Best Practices

### Do

- Always wrap order operations in transactions
- Check order status before transitions
- Close order iterators when done
- Use `failOrder(order, true)` to let customers retry
- Implement idempotent order creation (use specific order numbers)
- Set appropriate export/confirmation status

### Don't

- Place orders before successful payment authorization
- Cancel orders without refund processing
- Leave orders in CREATED status indefinitely
- Forget to handle concurrent order modifications
- Skip status validation before transitions

## Error Handling

| Scenario | Solution |
|----------|----------|
| Basket is empty | Validate basket before `createOrder()` |
| Invalid basket | Check for missing shipping/billing addresses |
| Payment failed | Use `failOrder(order, true)` to reopen basket |
| Order number exists | Use auto-generated numbers or validate uniqueness |
| Status transition invalid | Check current status before calling status methods |

## Related Skills

- [b2c-hooks](../b2c-hooks/SKILL.md) - Order hooks (calculate, payment, createOrderNo)
