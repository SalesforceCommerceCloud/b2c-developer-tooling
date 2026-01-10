# Classic Controller Patterns

Patterns for non-SFRA controllers using direct exports with `.public = true`.

## When to Use Classic Controllers

- Non-SFRA (pipelines-based) storefronts
- Simple REST-like endpoints
- Quick prototypes
- Legacy integrations

## Basic Structure

```javascript
'use strict';

var ISML = require('dw/template/ISML');

exports.Show = function () {
    ISML.renderTemplate('home/homepage', {
        pageTitle: 'Welcome'
    });
};
exports.Show.public = true;  // Required for URL access
```

**Key:** Every exported function must have `.public = true` to be accessible via URL.

## Request Handling

```javascript
exports.GetProduct = function () {
    // Query parameters
    var params = request.httpParameterMap;
    var productId = params.pid.stringValue;
    var quantity = params.qty.intValue || 1;

    // Check if parameter exists
    if (params.isParameterSubmitted('pid')) {
        // Parameter was provided
    }

    // Form data (POST)
    var email = params.email.stringValue;

    // HTTP method
    var method = request.httpMethod;  // 'GET', 'POST', etc.

    // Headers
    var contentType = request.httpHeaders.get('content-type');

    ISML.renderTemplate('product/detail', {
        productId: productId,
        quantity: quantity
    });
};
exports.GetProduct.public = true;
```

## Response Types

### HTML Response (ISML)

```javascript
var ISML = require('dw/template/ISML');

exports.ShowPage = function () {
    ISML.renderTemplate('path/to/template', {
        data: 'value'
    });
};
exports.ShowPage.public = true;
```

### JSON Response

```javascript
exports.GetData = function () {
    var result = {
        success: true,
        items: [],
        count: 0
    };

    response.setContentType('application/json');
    response.writer.print(JSON.stringify(result));
};
exports.GetData.public = true;
```

### XML Response

```javascript
exports.GetXML = function () {
    var xml = '<?xml version="1.0"?><data><item>value</item></data>';

    response.setContentType('application/xml');
    response.writer.print(xml);
};
exports.GetXML.public = true;
```

### Redirect

```javascript
var URLUtils = require('dw/web/URLUtils');

exports.Redirect = function () {
    response.redirect(URLUtils.url('Home-Show'));
};
exports.Redirect.public = true;
```

### Status Codes

```javascript
exports.NotFound = function () {
    response.setStatus(404);
    ISML.renderTemplate('error/notfound');
};
exports.NotFound.public = true;
```

## Error Handling

```javascript
var Logger = require('dw/system/Logger');

exports.ProcessOrder = function () {
    try {
        var params = request.httpParameterMap;
        var orderId = params.orderID.stringValue;

        if (!orderId) {
            response.setStatus(400);
            response.setContentType('application/json');
            response.writer.print(JSON.stringify({
                error: true,
                message: 'Order ID required'
            }));
            return;
        }

        // Process order...

        response.setContentType('application/json');
        response.writer.print(JSON.stringify({ success: true }));

    } catch (e) {
        Logger.error('Order processing error: ' + e.message);
        response.setStatus(500);
        response.setContentType('application/json');
        response.writer.print(JSON.stringify({
            error: true,
            message: 'Internal error'
        }));
    }
};
exports.ProcessOrder.public = true;
```

## Database Operations

```javascript
var Transaction = require('dw/system/Transaction');
var ProductMgr = require('dw/catalog/ProductMgr');

exports.UpdateProduct = function () {
    var params = request.httpParameterMap;
    var pid = params.pid.stringValue;
    var product = ProductMgr.getProduct(pid);

    if (!product) {
        response.setStatus(404);
        return;
    }

    Transaction.wrap(function () {
        product.custom.lastViewed = new Date();
    });

    response.setContentType('application/json');
    response.writer.print(JSON.stringify({ updated: true }));
};
exports.UpdateProduct.public = true;
```

## HTTPS Enforcement

```javascript
exports.SecurePage = function () {
    if (!request.isHttpSecure()) {
        var URLUtils = require('dw/web/URLUtils');
        response.redirect(URLUtils.https('Controller-SecurePage'));
        return;
    }

    ISML.renderTemplate('secure/page');
};
exports.SecurePage.public = true;
```

## Authentication Check

```javascript
var CustomerMgr = require('dw/customer/CustomerMgr');

exports.AccountPage = function () {
    var customer = session.customer;

    if (!customer.authenticated) {
        var URLUtils = require('dw/web/URLUtils');
        response.redirect(URLUtils.url('Login-Show'));
        return;
    }

    ISML.renderTemplate('account/dashboard', {
        customer: customer
    });
};
exports.AccountPage.public = true;
```

## Complete Example

```javascript
'use strict';

var ISML = require('dw/template/ISML');
var Transaction = require('dw/system/Transaction');
var ProductMgr = require('dw/catalog/ProductMgr');
var BasketMgr = require('dw/order/BasketMgr');
var URLUtils = require('dw/web/URLUtils');
var Logger = require('dw/system/Logger');

/**
 * Display product detail page
 */
exports.Show = function () {
    var params = request.httpParameterMap;
    var pid = params.pid.stringValue;

    var product = ProductMgr.getProduct(pid);

    if (!product || !product.online) {
        response.setStatus(404);
        ISML.renderTemplate('error/notfound');
        return;
    }

    ISML.renderTemplate('product/detail', {
        product: product,
        quantity: params.qty.intValue || 1
    });
};
exports.Show.public = true;

/**
 * Add product to cart (AJAX)
 */
exports.AddToCart = function () {
    var params = request.httpParameterMap;
    var pid = params.pid.stringValue;
    var qty = params.qty.intValue || 1;

    try {
        var product = ProductMgr.getProduct(pid);
        if (!product) {
            sendJSON({ success: false, error: 'Product not found' }, 404);
            return;
        }

        var basket = BasketMgr.getCurrentOrNewBasket();

        Transaction.wrap(function () {
            var pli = basket.createProductLineItem(pid, basket.defaultShipment);
            pli.setQuantityValue(qty);
        });

        sendJSON({
            success: true,
            cartCount: basket.productQuantityTotal
        });

    } catch (e) {
        Logger.error('Add to cart error: ' + e.message);
        sendJSON({ success: false, error: 'Unable to add to cart' }, 500);
    }
};
exports.AddToCart.public = true;

/**
 * Get product availability (AJAX)
 */
exports.GetAvailability = function () {
    var params = request.httpParameterMap;
    var pid = params.pid.stringValue;

    var product = ProductMgr.getProduct(pid);
    if (!product) {
        sendJSON({ available: false }, 404);
        return;
    }

    var availability = product.availabilityModel;
    sendJSON({
        available: availability.inStock,
        quantity: availability.inventoryRecord ? availability.inventoryRecord.ATS.value : 0
    });
};
exports.GetAvailability.public = true;

/**
 * Helper: Send JSON response
 */
function sendJSON(data, status) {
    if (status) {
        response.setStatus(status);
    }
    response.setContentType('application/json');
    response.writer.print(JSON.stringify(data));
}
```

## Comparison: Classic vs SFRA

| Aspect | Classic | SFRA |
|--------|---------|------|
| Public access | `exports.fn.public = true` | Automatic via `server` |
| Request data | `request.httpParameterMap` | `req.querystring`, `req.form` |
| Render HTML | `ISML.renderTemplate()` | `res.render()` |
| Return JSON | `response.writer.print()` | `res.json()` |
| Middleware | Manual checks | Built-in middleware chain |
| Controller extension | Not supported | `module.superModule` |
| Route events | Not available | `this.on('route:BeforeComplete')` |
