# SFRA Controller Patterns

Detailed patterns for SFRA controllers using the `server` module.

## Basic Route Structure

```javascript
'use strict';

var server = require('server');

server.get('RouteName', function (req, res, next) {
    // Handler logic
    next();
});

module.exports = server.exports();
```

## HTTP Methods

```javascript
server.get('Show', handler);      // GET requests
server.post('Submit', handler);   // POST requests
server.use('Any', handler);       // Any HTTP method
```

## Multiple Middleware

Chain multiple middleware functions:

```javascript
server.get('Show',
    middleware1,
    middleware2,
    function (req, res, next) {
        // Final handler
        next();
    }
);
```

## Request Object Properties

```javascript
server.get('Example', function (req, res, next) {
    // Query parameters (?param=value)
    var param = req.querystring.param;
    var pid = req.querystring.pid;

    // Form data (POST body)
    var email = req.form.email;
    var password = req.form.password;

    // Current customer
    var customer = req.currentCustomer;
    var profile = req.currentCustomer.profile;
    var isAuthenticated = customer.authenticated;

    // Locale and session
    var locale = req.locale;
    var currency = req.session.currency;

    // HTTP details
    var method = req.httpMethod;
    var headers = req.httpHeaders;
    var host = req.httpHost;

    next();
});
```

## Response Methods

```javascript
server.get('Example', function (req, res, next) {
    // Render ISML template
    res.render('path/to/template', {
        key1: 'value1',
        key2: { nested: 'data' }
    });

    // Return JSON (for AJAX)
    res.json({
        success: true,
        data: { id: 123 }
    });

    // Redirect
    res.redirect(URLUtils.url('Home-Show'));

    // Set HTTP status
    res.setStatusCode(404);

    // Set response header
    res.setHttpHeader('X-Custom-Header', 'value');

    next();
});
```

## View Data Pattern

Build view data incrementally across middleware:

```javascript
server.get('Show',
    function (req, res, next) {
        res.setViewData({ step1: 'data' });
        next();
    },
    function (req, res, next) {
        var viewData = res.getViewData();
        viewData.step2 = 'more data';
        res.setViewData(viewData);
        next();
    },
    function (req, res, next) {
        res.render('template', res.getViewData());
        next();
    }
);
```

## Route Events

```javascript
server.post('Submit', function (req, res, next) {
    var form = server.forms.getForm('profile');

    // BeforeComplete: runs after all middleware, before render
    this.on('route:BeforeComplete', function (req, res) {
        var viewData = res.getViewData();
        Transaction.wrap(function () {
            // Database operations
            customer.profile.firstName = viewData.firstName;
        });
    });

    res.setViewData({ firstName: form.firstName.value });
    next();
});
```

## Extending Controllers

### Using module.superModule

```javascript
'use strict';

var server = require('server');
var base = module.superModule;  // Parent controller

server.extend(base);

// Methods available after server.extend():
// - server.append()   Add to end of existing route
// - server.prepend()  Add to beginning of existing route
// - server.replace()  Replace existing route entirely
```

### Append Pattern (Most Common)

```javascript
server.append('Show', function (req, res, next) {
    // Runs AFTER original handler
    var viewData = res.getViewData();
    viewData.customField = 'custom value';
    res.setViewData(viewData);
    next();
});
```

### Prepend Pattern

```javascript
server.prepend('Show', function (req, res, next) {
    // Runs BEFORE original handler
    // Useful for validation, logging, etc.
    if (!someCondition) {
        res.redirect(URLUtils.url('Error-Show'));
        return next();
    }
    next();
});
```

### Replace Pattern

```javascript
server.replace('Show', function (req, res, next) {
    // Completely replaces original handler
    // Original code does NOT run
    res.render('custom/template');
    next();
});
```

## Common Middleware Examples

### Caching Middleware

```javascript
var cache = require('*/cartridge/scripts/middleware/cache');

server.get('Show',
    cache.applyDefaultCache,  // Apply standard caching
    function (req, res, next) {
        res.render('template');
        next();
    }
);

// Custom cache duration
server.get('Data',
    cache.applyShortPromotionSensitiveCache,
    handler
);
```

### Authentication Middleware

```javascript
var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');

server.get('Account',
    userLoggedIn.validateLoggedIn,
    function (req, res, next) {
        // Only runs if user is logged in
        res.render('account/dashboard');
        next();
    }
);
```

### HTTPS Middleware

```javascript
server.post('Checkout',
    server.middleware.https,
    function (req, res, next) {
        // Only runs over HTTPS
        next();
    }
);
```

### CSRF Protection

```javascript
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');

// Generate CSRF token (for form pages)
server.get('ShowForm',
    csrfProtection.generateToken,
    function (req, res, next) {
        res.render('form');  // Template includes CSRF hidden field
        next();
    }
);

// Validate CSRF token (for form submissions)
server.post('Submit',
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        // Only runs if CSRF token is valid
        next();
    }
);
```

## Form Handling

```javascript
server.get('ShowForm', function (req, res, next) {
    var form = server.forms.getForm('profile');
    form.clear();  // Reset form data

    res.render('forms/profile', {
        profileForm: form
    });
    next();
});

server.post('SubmitForm', function (req, res, next) {
    var form = server.forms.getForm('profile');

    if (form.valid) {
        // Process valid form
        var firstName = form.customer.firstname.value;
        var lastName = form.customer.lastname.value;

        this.on('route:BeforeComplete', function () {
            Transaction.wrap(function () {
                // Save to database
            });
        });

        res.json({ success: true });
    } else {
        res.json({
            success: false,
            error: true,
            fieldErrors: formErrors.getFormErrors(form)
        });
    }
    next();
});
```

## AJAX Responses

```javascript
server.get('GetData', function (req, res, next) {
    var result = {
        success: true,
        data: {
            items: [],
            count: 0
        }
    };

    res.json(result);
    next();
});

// With error handling
server.post('Process', function (req, res, next) {
    try {
        // Process request
        res.json({ success: true });
    } catch (e) {
        res.json({
            success: false,
            errorMessage: Resource.msg('error.general', 'error', null)
        });
    }
    next();
});
```

## Complete Controller Example

```javascript
'use strict';

var server = require('server');
var cache = require('*/cartridge/scripts/middleware/cache');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');

var ProductMgr = require('dw/catalog/ProductMgr');
var Transaction = require('dw/system/Transaction');
var URLUtils = require('dw/web/URLUtils');
var Resource = require('dw/web/Resource');

server.get('Show',
    cache.applyDefaultCache,
    function (req, res, next) {
        var pid = req.querystring.pid;
        var product = ProductMgr.getProduct(pid);

        if (!product || !product.online) {
            res.setStatusCode(404);
            res.render('error/notfound');
            return next();
        }

        res.render('product/detail', {
            product: product,
            breadcrumbs: getBreadcrumbs(product)
        });
        next();
    }
);

server.post('AddToWishlist',
    server.middleware.https,
    userLoggedIn.validateLoggedIn,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        var pid = req.form.pid;

        this.on('route:BeforeComplete', function () {
            Transaction.wrap(function () {
                // Add to wishlist
            });
        });

        res.json({
            success: true,
            message: Resource.msg('wishlist.added', 'wishlist', null)
        });
        next();
    }
);

module.exports = server.exports();
```
