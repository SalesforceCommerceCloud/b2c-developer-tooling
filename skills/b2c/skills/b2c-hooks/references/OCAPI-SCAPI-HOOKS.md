# OCAPI/SCAPI Hooks Reference

OCAPI and SCAPI share the same hooks. When you register a hook for OCAPI, it also applies to SCAPI endpoints.

## Prerequisites

Enable hooks in Business Manager:
**Administration > Global Preferences > Feature Switches > Enable Salesforce Commerce Cloud API hook execution**

## Hook Naming Convention

```
dw.ocapi.shop.<resource>.<sub-resource>.<hookType><METHOD>
```

Examples:
- `dw.ocapi.shop.basket.afterPOST`
- `dw.ocapi.shop.basket.billing_address.beforePUT`
- `dw.ocapi.shop.product.modifyGETResponse`

## Available Hooks by Resource

### Authentication

| Hook | Method | Description |
|------|--------|-------------|
| `dw.ocapi.shop.auth.beforePOST` | `beforePOST(authHeader, authType)` | Before customer authentication |
| `dw.ocapi.shop.auth.afterPOST` | `afterPOST(customer, authType)` | After customer authenticated |
| `dw.ocapi.shop.auth.modifyPOSTResponse` | `modifyPOSTResponse(customer, response, authType)` | Modify auth response |

### Basket

| Hook | Method | Description |
|------|--------|-------------|
| `dw.ocapi.shop.basket.afterPOST` | `afterPOST(basket)` | After basket created |
| `dw.ocapi.shop.basket.afterPATCH` | `afterPATCH(basket, input)` | After basket updated |
| `dw.ocapi.shop.basket.beforeGET` | `beforeGET(basketId)` | Before basket retrieved |
| `dw.ocapi.shop.basket.beforeDELETE` | `beforeDELETE(basket)` | Before basket deleted |
| `dw.ocapi.shop.basket.afterDELETE` | `afterDELETE(basketId)` | After basket deleted |
| `dw.ocapi.shop.basket.modifyGETResponse` | `modifyGETResponse(basket, response)` | Modify basket response |

### Basket Items

| Hook | Method |
|------|--------|
| `dw.ocapi.shop.basket.items.afterPOST` | `afterPOST(basket, items)` |
| `dw.ocapi.shop.basket.item.afterPATCH` | `afterPATCH(basket, item, input)` |
| `dw.ocapi.shop.basket.item.afterDELETE` | `afterDELETE(basket, itemId)` |

### Basket Addresses

| Hook | Method |
|------|--------|
| `dw.ocapi.shop.basket.billing_address.beforePUT` | `beforePUT(basket, address)` |
| `dw.ocapi.shop.basket.billing_address.afterPUT` | `afterPUT(basket, address)` |
| `dw.ocapi.shop.basket.shipment.shipping_address.beforePUT` | `beforePUT(shipment, address)` |
| `dw.ocapi.shop.basket.shipment.shipping_address.afterPUT` | `afterPUT(shipment, address)` |

### Basket Payment

| Hook | Method |
|------|--------|
| `dw.ocapi.shop.basket.payment_instrument.beforePOST` | `beforePOST(basket, input)` |
| `dw.ocapi.shop.basket.payment_instrument.afterPOST` | `afterPOST(basket, input)` |
| `dw.ocapi.shop.basket.payment_instrument.afterPATCH` | `afterPATCH(basket, instrument, input)` |
| `dw.ocapi.shop.basket.payment_instrument.afterDELETE` | `afterDELETE(basket, instrumentId)` |
| `dw.ocapi.shop.basket.payment_instrument.modifyPOSTResponse` | `modifyPOSTResponse(basket, response, input)` |

### Basket Coupons

| Hook | Method |
|------|--------|
| `dw.ocapi.shop.basket.coupon.afterPOST` | `afterPOST(basket, coupon)` |
| `dw.ocapi.shop.basket.coupon.afterDELETE` | `afterDELETE(basket, couponId)` |

### Basket Shipments

| Hook | Method |
|------|--------|
| `dw.ocapi.shop.basket.shipment.afterPOST` | `afterPOST(basket, shipment)` |
| `dw.ocapi.shop.basket.shipment.afterPATCH` | `afterPATCH(basket, shipment, input)` |
| `dw.ocapi.shop.basket.shipment.afterDELETE` | `afterDELETE(basket, shipmentId)` |
| `dw.ocapi.shop.basket.shipment.shipping_method.afterPUT` | `afterPUT(basket, shipment, methodId)` |

### Basket Actions

| Hook | Method | Description |
|------|--------|-------------|
| `dw.ocapi.baskets.actions.afterMerge` | `afterMerge(basket)` | After guest basket merged |
| `dw.ocapi.baskets.actions.afterTransfer` | `afterTransfer(basket)` | After basket transferred |

### Orders

| Hook | Method |
|------|--------|
| `dw.ocapi.shop.order.beforePOST` | `beforePOST(basket)` |
| `dw.ocapi.shop.order.afterPOST` | `afterPOST(order)` |
| `dw.ocapi.shop.order.beforePUT` | `beforePUT(order, input)` |
| `dw.ocapi.shop.order.afterPUT` | `afterPUT(order, input)` |
| `dw.ocapi.shop.order.modifyGETResponse` | `modifyGETResponse(order, response)` |
| `dw.ocapi.shop.order.modifyPOSTResponse` | `modifyPOSTResponse(order, response)` |

### Products

| Hook | Method |
|------|--------|
| `dw.ocapi.shop.product.beforeGET` | `beforeGET(productId)` |
| `dw.ocapi.shop.product.modifyGETResponse` | `modifyGETResponse(product, response)` |
| `dw.ocapi.shop.products.modifyGETResponse` | `modifyGETResponse(products, response)` |

### Categories

| Hook | Method |
|------|--------|
| `dw.ocapi.shop.category.beforeGET` | `beforeGET(categoryId)` |
| `dw.ocapi.shop.category.modifyGETResponse` | `modifyGETResponse(category, response)` |

### Customers

| Hook | Method |
|------|--------|
| `dw.ocapi.shop.customer.afterPOST` | `afterPOST(customer, input)` |
| `dw.ocapi.shop.customer.afterPATCH` | `afterPATCH(customer, input)` |
| `dw.ocapi.shop.customer.modifyGETResponse` | `modifyGETResponse(customer, response)` |

### Search

| Hook | Method |
|------|--------|
| `dw.ocapi.shop.product_search.beforeGET` | `beforeGET(searchRequest)` |
| `dw.ocapi.shop.product_search.modifyGETResponse` | `modifyGETResponse(searchResult, response)` |

## Custom Properties in Responses

Add custom properties using the `c_` prefix in modifyResponse hooks:

```javascript
exports.modifyGETResponse = function(product, response) {
    // Add custom properties
    response.c_customField = 'value';
    response.c_computedValue = calculateValue(product);

    // Add nested custom data
    response.c_extendedInfo = {
        source: 'external',
        timestamp: new Date().toISOString()
    };
};
```

### Supported Custom Property Types

| Type | Example |
|------|---------|
| Text/String | `c_field = 'value'` |
| Integer | `c_count = 42` |
| Double | `c_price = 19.99` |
| Boolean | `c_active = true` |
| Date | `c_date = '2024-01-15'` |
| Date+Time | `c_timestamp = '2024-01-15T10:30:00Z'` |
| Set of Strings | `c_tags = ['tag1', 'tag2']` |
| Enum | `c_status = 'active'` |

## Custom Query Parameters

Use `c_` prefixed query parameters for conditional behavior:

```javascript
exports.beforeGET = function(productId) {
    var includeExtended = request.httpParameterMap.get('c_includeExtended');
    if (includeExtended.booleanValue) {
        request.custom.includeExtended = true;
    }
};
```

API call: `GET /products/123?c_includeExtended=true`

## Custom Headers

Custom headers (`c_` prefix) for diagnostic/logging purposes only:

```javascript
var Logger = require('dw/system/Logger');
var response = require('dw/system/Response');

exports.beforeGET = function() {
    // Read custom request header
    var clientVersion = request.httpHeaders.get('c_client_version');
    if (clientVersion) {
        Logger.info('Client: ' + clientVersion);
    }
};

exports.afterGET = function() {
    // Set custom response header
    response.setHttpHeader('c_processed_by', 'hook_v2');
};
```

**Important**: Do not use custom headers to affect response body content (breaks caching).

## Validation Pattern

```javascript
var Status = require('dw/system/Status');

exports.beforePUT = function(basket, addressDoc) {
    // Validate address
    if (!isValidZipCode(addressDoc.postalCode)) {
        var status = new Status(Status.ERROR);
        status.addDetail('field', 'postalCode');
        status.addDetail('message', 'Invalid postal code format');
        return status;
    }

    // Validation passed - continue processing
    return new Status(Status.OK);
};
```

Error response (HTTP 400):

```json
{
  "title": "Hook Status",
  "type": "https://api.commercecloud.salesforce.com/.../hook-status",
  "detail": "Error in ExtensionPoint 'dw.ocapi.shop.basket.billing_address.beforePUT'",
  "statusCode": "ERROR",
  "statusDetails": {
    "field": "postalCode",
    "message": "Invalid postal code format"
  }
}
```

## Payment Integration Pattern

```javascript
var Status = require('dw/system/Status');

// Process payment in transaction
exports.afterPOST = function(basket, paymentInput) {
    var paymentResult = callPaymentProvider(paymentInput);

    if (!paymentResult.success) {
        var status = new Status(Status.ERROR);
        status.addDetail('payment_error', paymentResult.error);
        return status; // Rollback transaction
    }

    // Store result for response modification
    request.custom.paymentIntent = paymentResult.intentId;
    return new Status(Status.OK);
};

// Add payment info to response
exports.modifyPOSTResponse = function(basket, response, paymentInput) {
    var addedInstrument = response.paymentInstruments.toArray().find(function(pi) {
        return pi.paymentMethodId === paymentInput.paymentMethodId;
    });

    if (addedInstrument && request.custom.paymentIntent) {
        addedInstrument.c_paymentIntent = request.custom.paymentIntent;
    }
};
```

## Remote Includes

Include data from other SCAPI endpoints in responses:

```javascript
var RESTResponseMgr = require('dw/system/RESTResponseMgr');
var URLParameter = require('dw/web/URLParameter');

exports.modifyGETResponse = function(product, doc) {
    // Include Custom API response
    var customInclude = RESTResponseMgr.createScapiRemoteInclude(
        'custom',
        'my-api',
        'v1',
        'product-extras'
    );

    // Include system API with parameters
    var promotionsInclude = RESTResponseMgr.createScapiRemoteInclude(
        'pricing',
        'shopper-promotions',
        'v1',
        'promotions',
        new URLParameter('siteId', 'MySite'),
        new URLParameter('ids', 'promo1,promo2')
    );

    doc.c_extras = { value: [customInclude] };
    doc.c_promotions = { value: [promotionsInclude] };
};
```

## Calculate Hook Integration

Many basket hooks implicitly call `dw.order.calculate`. Override carefully:

```javascript
var HookMgr = require('dw/system/HookMgr');
var Status = require('dw/system/Status');

exports.afterPOST = function(basket) {
    // Custom processing...

    // Ensure calculation runs (if not using default implementation)
    var calcStatus = HookMgr.callHook('dw.order.calculate', 'calculate', basket);
    return calcStatus || new Status(Status.OK);
};
```

## Caching Considerations

When SCAPI caching is enabled:
- Hook logic executes on cache miss
- Cached responses bypass hooks
- Don't use custom headers to affect response body
- Consider cache key when using custom query parameters

## Debugging Hooks

Track hook errors in Log Center with LCQL:

```
category: ( com.demandware.wapi.servlet.ShopRestServlet ) AND stackTrace: ( HookInvocationException )
```

Or use the correlation ID from failed requests.
