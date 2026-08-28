# Checkout Flow Reference

Complete basket-to-order workflow using Shopper APIs.

## Flow Overview

```
1. Create Basket
2. Add Items
3. Set Customer Info
4. Set Shipping Address
5. Select Shipping Method
6. Add Payment Instrument
7. Submit Order (creates `CREATED` order)
8. Authorize Order Payment Instrument (places when fully covered)
9. On deterministic failure, fail order and optionally reopen basket
```

## Prerequisites

- SLAS access token with `sfcc.shopper-baskets-orders.rw` scope
- `siteId` query parameter on all requests

## Step 1: Create Basket

```javascript
const basket = await fetch(
    `https://${shortCode}.api.commercecloud.salesforce.com/checkout/shopper-baskets/v1/organizations/${orgId}/baskets?siteId=${siteId}`,
    {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
    }
).then(r => r.json());

// Store basketId for subsequent requests
const { basketId } = basket;
```

## Step 2: Add Items

```javascript
await fetch(
    `https://${shortCode}.api.commercecloud.salesforce.com/checkout/shopper-baskets/v1/organizations/${orgId}/baskets/${basketId}/items?siteId=${siteId}`,
    {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify([
            { productId: '25518823M', quantity: 2 },
            { productId: '25519318M', quantity: 1 }
        ])
    }
);
```

### Update Item Quantity

```javascript
await fetch(
    `https://${shortCode}.api.commercecloud.salesforce.com/checkout/shopper-baskets/v1/organizations/${orgId}/baskets/${basketId}/items/${itemId}?siteId=${siteId}`,
    {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ quantity: 3 })
    }
);
```

### Remove Item

```javascript
await fetch(
    `https://${shortCode}.api.commercecloud.salesforce.com/checkout/shopper-baskets/v1/organizations/${orgId}/baskets/${basketId}/items/${itemId}?siteId=${siteId}`,
    { method: 'DELETE', headers: { 'Authorization': `Bearer ${accessToken}` } }
);
```

## Step 3: Set Customer Info

For guest checkout:

```javascript
await fetch(
    `https://${shortCode}.api.commercecloud.salesforce.com/checkout/shopper-baskets/v1/organizations/${orgId}/baskets/${basketId}/customer?siteId=${siteId}`,
    {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            email: 'customer@example.com'
        })
    }
);
```

## Step 4: Set Shipping Address

All baskets have a default shipment with ID `"me"`. Set the shipping address on this shipment:

```javascript
await fetch(
    `https://${shortCode}.api.commercecloud.salesforce.com/checkout/shopper-baskets/v1/organizations/${orgId}/baskets/${basketId}/shipments/me?siteId=${siteId}`,
    {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            shippingAddress: {
                firstName: 'John',
                lastName: 'Doe',
                address1: '123 Main St',
                city: 'San Francisco',
                stateCode: 'CA',
                postalCode: '94105',
                countryCode: 'US',
                phone: '415-555-1234'
            }
        })
    }
);
```

## Step 5: Get and Select Shipping Method

### Get Available Shipping Methods

```javascript
const methods = await fetch(
    `https://${shortCode}.api.commercecloud.salesforce.com/checkout/shopper-baskets/v1/organizations/${orgId}/baskets/${basketId}/shipments/me/shipping-methods?siteId=${siteId}`,
    {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    }
).then(r => r.json());

// methods.applicableShippingMethods contains available options
```

### Set Shipping Method

```javascript
await fetch(
    `https://${shortCode}.api.commercecloud.salesforce.com/checkout/shopper-baskets/v1/organizations/${orgId}/baskets/${basketId}/shipments/me?siteId=${siteId}`,
    {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            shippingMethod: { id: 'standard-shipping' }
        })
    }
);
```

## Step 6: Add Payment Instrument

**Important:** Never pass raw credit card data to B2C Commerce. Use tokenized payment data from your payment provider.

```javascript
await fetch(
    `https://${shortCode}.api.commercecloud.salesforce.com/checkout/shopper-baskets/v1/organizations/${orgId}/baskets/${basketId}/payment-instruments?siteId=${siteId}`,
    {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            paymentMethodId: 'CREDIT_CARD',
            paymentCard: {
                // Use tokenized data from payment provider
                cardType: 'Visa',
                maskedNumber: '************1111',
                expirationMonth: 12,
                expirationYear: 2025,
                holder: 'John Doe'
            },
            // Payment provider token reference
            c_paymentToken: 'tok_xyz123'
        })
    }
);
```

### Set Billing Address

If different from shipping:

```javascript
await fetch(
    `https://${shortCode}.api.commercecloud.salesforce.com/checkout/shopper-baskets/v1/organizations/${orgId}/baskets/${basketId}/billing-address?siteId=${siteId}`,
    {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            firstName: 'John',
            lastName: 'Doe',
            address1: '456 Billing St',
            city: 'San Francisco',
            stateCode: 'CA',
            postalCode: '94105',
            countryCode: 'US'
        })
    }
);
```

## Step 7: Submit Order

```javascript
const order = await fetch(
    `https://${shortCode}.api.commercecloud.salesforce.com/checkout/shopper-orders/v1/organizations/${orgId}/orders?siteId=${siteId}`,
    {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            basketId: basketId
        })
    }
).then(r => r.json());

// The order is committed in CREATED status. It is not yet placed.
console.log(`Order created (status CREATED): ${order.orderNo}`);
```

## Step 8: Authorize the Order Payment Instrument

Build the request from the committed order state and provider result, not unchecked browser fields.
The exact provider properties vary; inspect the current Shopper Orders schema and the payment
integration contract.

```javascript
const paymentInstrument = order.paymentInstruments[0];
const authorizationRequest = buildProviderOrderPaymentInstrumentRequest({
    order,
    paymentInstrument
});

const authorizationResponse = await fetch(
    `https://${shortCode}.api.commercecloud.salesforce.com/checkout/shopper-orders/v1/organizations/${orgId}/orders/${order.orderNo}/payment-instruments/${paymentInstrument.paymentInstrumentId}?siteId=${siteId}`,
    {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(authorizationRequest)
    }
);

if (authorizationResponse.ok) {
    const authorizedOrder = await authorizationResponse.json();
    if (authorizedOrder.status === 'new') {
        console.log(`Order placed: ${authorizedOrder.orderNo}`);
    } else {
        // CREATED can be expected until every PI is authorized in a multi-PI flow.
        console.log(`Order not yet placed: ${authorizedOrder.orderNo}`);
    }
}
```

The endpoint calls `dw.order.payment.authorizeCreditCard` when the request contains payment-card
data or the PI has a credit-card type; otherwise it calls `dw.order.payment.authorize`. Its
`afterPATCH` hook receives `successfullyAuthorized`. Return no value after successful custom
validation so the platform's default implementation can place the order when authorized payment
coverage equals or exceeds the order total. For a saved payment method, use the documented customer
payment-instrument reference so Commerce copies the owned customer PI for authorization. Request
amount and card security code are still propagated when using that reference.

## Step 9: Fail a Deterministically Declined Order

When authorization definitely failed and retry is safe, use the Shopper Orders fail action instead
of failing the order inside the order-creation hook:

```javascript
await fetch(
    `https://${shortCode}.api.commercecloud.salesforce.com/checkout/shopper-orders/v1/organizations/${orgId}/orders/${order.orderNo}/actions/fail?siteId=${siteId}&reopenBasket=true`,
    {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reasonCode: 'payment_auth_failure' })
    }
);
```

Do not automatically fail/reopen after a timeout or indeterminate gateway response. Preserve the
`CREATED` order for reconciliation so a retry cannot create a duplicate authorization.

## Single-Request Basket Creation

For simpler flows, create a fully populated basket in one request:

```javascript
const basket = await fetch(
    `https://${shortCode}.api.commercecloud.salesforce.com/checkout/shopper-baskets/v1/organizations/${orgId}/baskets?siteId=${siteId}`,
    {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            customerInfo: {
                email: 'customer@example.com'
            },
            productItems: [
                { productId: '25518823M', quantity: 1 }
            ],
            shipments: [{
                id: 'me',
                shippingAddress: {
                    firstName: 'John',
                    lastName: 'Doe',
                    address1: '123 Main St',
                    city: 'San Francisco',
                    stateCode: 'CA',
                    postalCode: '94105',
                    countryCode: 'US'
                },
                shippingMethod: { id: 'standard-shipping' }
            }],
            billingAddress: {
                firstName: 'John',
                lastName: 'Doe',
                address1: '123 Main St',
                city: 'San Francisco',
                stateCode: 'CA',
                postalCode: '94105',
                countryCode: 'US'
            }
        })
    }
).then(r => r.json());
```

## Multiple Shipments

For orders shipping to multiple addresses, create additional shipments:

```javascript
// Create new shipment
await fetch(
    `https://${shortCode}.api.commercecloud.salesforce.com/checkout/shopper-baskets/v1/organizations/${orgId}/baskets/${basketId}/shipments?siteId=${siteId}`,
    {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            id: 'shipment-2',
            shippingAddress: {
                firstName: 'Jane',
                lastName: 'Doe',
                address1: '789 Gift St',
                city: 'Los Angeles',
                stateCode: 'CA',
                postalCode: '90001',
                countryCode: 'US'
            }
        })
    }
);

// Add item to specific shipment
await fetch(
    `https://${shortCode}.api.commercecloud.salesforce.com/checkout/shopper-baskets/v1/organizations/${orgId}/baskets/${basketId}/items?siteId=${siteId}`,
    {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify([{
            productId: '25519318M',
            quantity: 1,
            shipmentId: 'shipment-2'
        }])
    }
);
```

## Applying Promotions

### Apply Coupon Code

```javascript
await fetch(
    `https://${shortCode}.api.commercecloud.salesforce.com/checkout/shopper-baskets/v1/organizations/${orgId}/baskets/${basketId}/coupons?siteId=${siteId}`,
    {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            code: 'SUMMER20'
        })
    }
);
```

### Remove Coupon

```javascript
await fetch(
    `https://${shortCode}.api.commercecloud.salesforce.com/checkout/shopper-baskets/v1/organizations/${orgId}/baskets/${basketId}/coupons/${couponItemId}?siteId=${siteId}`,
    { method: 'DELETE', headers: { 'Authorization': `Bearer ${accessToken}` } }
);
```

## Error Handling

### Common Basket Errors

| Error | Cause | Solution |
|-------|-------|----------|
| 400 `InvalidBasketId` | Basket expired or doesn't exist | Create new basket |
| 400 `ProductNotAvailable` | Product out of stock | Check availability before adding |
| 400 `InvalidShippingMethod` | Method not applicable | Get fresh shipping methods |
| 400 `InvalidPaymentMethod` | Payment method not supported | Check site payment config |

### Basket Validation

Before submitting order, check basket for issues:

```javascript
const basket = await fetch(
    `https://${shortCode}.api.commercecloud.salesforce.com/checkout/shopper-baskets/v1/organizations/${orgId}/baskets/${basketId}?siteId=${siteId}`,
    { headers: { 'Authorization': `Bearer ${accessToken}` } }
).then(r => r.json());

// Check for issues
if (basket.flash && basket.flash.length > 0) {
    console.error('Basket has issues:', basket.flash);
}

// Verify orderability
const orderableItems = basket.productItems.filter(item => item.orderable);
if (orderableItems.length !== basket.productItems.length) {
    console.error('Some items are not orderable');
}
```
