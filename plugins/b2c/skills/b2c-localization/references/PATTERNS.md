# Localization Patterns Reference

Complete patterns for B2C Commerce localization.

## Resource Bundle Organization

### Recommended Structure

```
/templates
    /resources
        # Page-specific bundles
        account.properties
        cart.properties
        checkout.properties
        product.properties
        search.properties

        # Feature bundles
        forms.properties
        error.properties
        email.properties

        # Shared bundles
        common.properties
        navigation.properties

        # Locale overrides
        /fr
            account.properties
            cart.properties
            ...
        /de
            account.properties
            cart.properties
            ...
```

### Bundle Content Patterns

**common.properties:**
```properties
##############################################
# Common UI Elements
##############################################
button.submit=Submit
button.cancel=Cancel
button.save=Save
button.delete=Delete
button.edit=Edit
button.close=Close
button.back=Back
button.continue=Continue
button.addtocart=Add to Cart
button.checkout=Checkout

# Labels
label.required=Required
label.optional=Optional
label.loading=Loading...
label.search=Search
label.filter=Filter
label.sort=Sort by
label.showing=Showing {0} of {1}

# Messages
message.success=Success!
message.error=An error occurred
message.saved=Changes saved successfully
message.deleted=Item deleted
message.confirm=Are you sure?

# Currency
currency.symbol=$
currency.code=USD

# Dates
date.format.short=MM/dd/yyyy
date.format.long=MMMM d, yyyy
```

**error.properties:**
```properties
##############################################
# Error Messages
##############################################
error.general=Something went wrong. Please try again.
error.notfound=Page not found
error.unauthorized=Please sign in to continue
error.forbidden=You don''t have permission to access this page
error.server=Server error. Please try again later.

# Validation errors
error.required={0} is required
error.invalid={0} is invalid
error.email.invalid=Please enter a valid email address
error.password.short=Password must be at least {0} characters
error.password.mismatch=Passwords don''t match

# Cart errors
error.cart.empty=Your cart is empty
error.cart.outofstock={0} is out of stock
error.cart.quantity=Maximum quantity is {0}

# Checkout errors
error.checkout.payment=Payment failed. Please try again.
error.checkout.address=Please enter a valid shipping address
```

## Template Patterns

### Page Layout

```html
<isdecorate template="common/layout/page">
    <isset name="pageTitle" value="${Resource.msg('account.title', 'account', 'My Account')}" scope="pdict"/>

    <div class="page-content">
        <h1>${pdict.pageTitle}</h1>

        <isif condition="${pdict.successMessage}">
            <div class="alert alert-success">
                ${Resource.msg(pdict.successMessage, 'common', pdict.successMessage)}
            </div>
        </isif>

        <isif condition="${pdict.errorMessage}">
            <div class="alert alert-error">
                ${Resource.msg(pdict.errorMessage, 'error', pdict.errorMessage)}
            </div>
        </isif>

        <!-- Page content -->
    </div>
</isdecorate>
```

### Form Labels

```html
<div class="form-group ${pdict.form.email.mandatory ? 'required' : ''}">
    <label for="email">
        ${Resource.msg('form.email.label', 'forms', 'Email')}
        <isif condition="${pdict.form.email.mandatory}">
            <span class="required-indicator">*</span>
        </isif>
    </label>
    <input type="email"
           id="email"
           name="email"
           placeholder="${Resource.msg('form.email.placeholder', 'forms', '')}"
           value="${pdict.form.email.value || ''}"/>
    <isif condition="${pdict.form.email.error}">
        <span class="error-message">${pdict.form.email.error}</span>
    </isif>
</div>
```

### Pluralization

**Property file:**
```properties
cart.item.singular=item
cart.item.plural=items
cart.summary=Your cart contains {0} {1}
```

**Template:**
```html
<isscript>
    var itemWord = itemCount === 1
        ? Resource.msg('cart.item.singular', 'cart', 'item')
        : Resource.msg('cart.item.plural', 'cart', 'items');
</isscript>
<p>${Resource.msgf('cart.summary', 'cart', null, itemCount, itemWord)}</p>
```

### Date Formatting

```html
<isscript>
    var StringUtils = require('dw/util/StringUtils');
    var Calendar = require('dw/util/Calendar');

    var orderDate = new Calendar(pdict.order.creationDate);
    var dateFormat = Resource.msg('date.format.long', 'common', 'MMMM d, yyyy');
    var formattedDate = StringUtils.formatCalendar(orderDate, dateFormat);
</isscript>
<p>${Resource.msgf('order.placed', 'order', null, formattedDate)}</p>
```

### Number Formatting

```html
<isscript>
    var StringUtils = require('dw/util/StringUtils');
    var numberFormat = Resource.msg('number.format', 'common', '#,##0.00');
    var formattedNumber = StringUtils.formatNumber(pdict.quantity, numberFormat);
</isscript>
<span>${formattedNumber}</span>
```

## Controller Patterns

### Locale-Aware Controller

```javascript
'use strict';

var server = require('server');
var Resource = require('dw/web/Resource');
var Locale = require('dw/util/Locale');

server.get('Show', function (req, res, next) {
    var currentLocale = Locale.getLocale(req.locale.id);
    var isUSLocale = currentLocale.country === 'US';

    // Get locale-specific content
    var contentAssetId = 'terms-' + req.locale.id.toLowerCase().replace('_', '-');

    // Locale-specific business logic
    var phoneFormat = isUSLocale ? '(XXX) XXX-XXXX' : '+XX XXX XXX XXXX';

    res.render('page', {
        locale: req.locale.id,
        language: currentLocale.displayLanguage,
        phoneFormat: phoneFormat,
        contentAssetId: contentAssetId
    });
    next();
});

// Error messages in controllers
server.post('Submit', function (req, res, next) {
    var form = server.forms.getForm('profile');

    if (!form.valid) {
        res.json({
            success: false,
            message: Resource.msg('error.form.invalid', 'error', 'Please correct the errors')
        });
        return next();
    }

    try {
        // Process form
        res.json({
            success: true,
            message: Resource.msg('message.saved', 'common', 'Saved successfully')
        });
    } catch (e) {
        res.json({
            success: false,
            message: Resource.msg('error.general', 'error', 'An error occurred')
        });
    }
    next();
});
```

### Multi-Locale Email

```javascript
var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');
var Mail = require('dw/net/Mail');
var Resource = require('dw/web/Resource');

function sendWelcomeEmail(customer, locale) {
    var model = new HashMap();
    model.put('customer', customer);
    model.put('storeName', Resource.msg('store.name', 'common', 'Our Store'));

    // Render template with specific locale
    var template = new Template('mail/welcome', locale);
    var htmlContent = template.render(model).text;

    // Get localized subject
    // Note: Resource.msg uses current request locale, not the parameter
    var subject = getLocalizedString('email.welcome.subject', 'email', locale);

    var mail = new Mail();
    mail.addTo(customer.profile.email);
    mail.setFrom('welcome@example.com');
    mail.setSubject(subject);
    mail.setContent(htmlContent, 'text/html', 'UTF-8');
    mail.send();
}

// Helper for getting strings in specific locale
function getLocalizedString(key, bundle, locale) {
    // This requires reading property files directly for non-current locale
    // Or storing translations in a custom object
    var ResourceBundle = require('dw/web/ResourceBundle');
    var rb = ResourceBundle.getBundle(bundle, locale);
    return rb.getString(key);
}
```

## JavaScript Client-Side

### Passing Messages to JS

```html
<script>
window.resources = {
    cart: {
        addSuccess: '${Resource.msg('cart.add.success', 'cart', 'Added to cart')}',
        addError: '${Resource.msg('cart.add.error', 'cart', 'Error adding to cart')}',
        removeConfirm: '${Resource.msg('cart.remove.confirm', 'cart', 'Remove this item?')}'
    },
    common: {
        loading: '${Resource.msg('label.loading', 'common', 'Loading...')}',
        error: '${Resource.msg('error.general', 'error', 'An error occurred')}'
    }
};
</script>
```

### Using in JS

```javascript
function addToCart(productId) {
    showLoading(window.resources.common.loading);

    $.ajax({
        url: '/Cart-AddProduct',
        data: { pid: productId },
        success: function(response) {
            if (response.success) {
                showMessage(window.resources.cart.addSuccess, 'success');
            } else {
                showMessage(response.message || window.resources.cart.addError, 'error');
            }
        },
        error: function() {
            showMessage(window.resources.common.error, 'error');
        }
    });
}
```

## Special Characters

### Escaping in Properties

```properties
# Apostrophe - use two single quotes
message.welcome=It''s a great day!
error.cant=You can''t do that

# Newlines
message.multiline=Line one\nLine two\nLine three

# Unicode
store.name=Café du Nord
currency.symbol.euro=€
```

### UTF-8 Encoding

Always save property files as UTF-8 for proper character support:

```properties
# German
button.close=Schließen
greeting=Grüß Gott!

# French
account.title=Mon Compte
message.success=Réussi!

# Japanese
store.name=店舗名
```

## Testing Localization

### Pseudo-Localization

Add a test locale with wrapped strings to find hardcoded text:

```properties
# pseudo.properties
button.submit=[Submit]
button.cancel=[Cancel]
account.title=[My Account]
```

### Checklist

1. All visible text comes from resource bundles
2. Date/time formats use locale settings
3. Currency displays correctly
4. Number formatting (decimal separators)
5. Images with text have locale versions
6. Email templates render in correct language
7. Error messages are localized
8. JavaScript strings are localized
