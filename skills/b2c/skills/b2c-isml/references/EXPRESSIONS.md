# ISML Expressions Reference

Expression syntax and built-in functions available in ISML templates.

## Expression Syntax

Expressions use `${...}` syntax:

```html
${expression}
```

## Property Access

```html
<!-- Simple property -->
${product.name}

<!-- Nested property -->
${product.price.sales.value}

<!-- Method call -->
${product.getName()}

<!-- Chained access -->
${customer.profile.addressBook.preferredAddress.city}
```

## Built-in Objects

### pdict

Data passed from controller:

```html
<!-- Controller: res.render('template', { myVar: 'value' }) -->
${pdict.myVar}
```

### session

Session data:

```html
${session.sessionID}
${session.customer}
${session.customer.authenticated}
${session.customer.profile.firstName}
${session.currency.currencyCode}
${session.custom.myCustomAttribute}
```

### request

HTTP request:

```html
${request.httpMethod}
${request.httpHost}
${request.httpPath}
${request.httpHeaders}
${request.httpParameterMap.paramName.stringValue}
${request.locale}
${request.isHttpSecure()}
```

### response

HTTP response (limited in templates):

```html
${response.writer}
```

### customer

Current customer:

```html
${customer.authenticated}
${customer.registered}
${customer.ID}
${customer.profile.firstName}
${customer.profile.email}
```

## Operators

### Arithmetic

```html
${price * quantity}
${total + tax}
${price - discount}
${total / count}
${value % 2}  <!-- Modulo -->
```

### Comparison

```html
${price > 100}
${quantity >= 1}
${price < maxPrice}
${stock <= threshold}
${product.ID == 'ABC123'}
${status != 'CANCELLED'}
```

### Logical

```html
${inStock && available}
${isNew || onSale}
${!outOfStock}
```

### Ternary

```html
${inStock ? 'Available' : 'Out of Stock'}
${customer.authenticated ? customer.profile.firstName : 'Guest'}
```

### String Concatenation

```html
${firstName + ' ' + lastName}
${'Product: ' + product.name}
```

### Null Check

```html
${product != null ? product.name : 'Unknown'}
${empty(products) ? 'No products' : products.length + ' products'}
```

## Built-in Functions

### empty()

Check if null, empty string, or empty collection:

```html
<isif condition="${empty(products)}">
    No products found
</isif>

<isif condition="${!empty(customer.profile)}">
    Welcome, ${customer.profile.firstName}
</isif>
```

## Utility Classes

### URLUtils

Generate URLs:

```html
<!-- Controller URL -->
${URLUtils.url('Controller-Action')}
${URLUtils.url('Product-Show', 'pid', product.ID)}
${URLUtils.url('Search-Show', 'q', searchTerm, 'page', pageNum)}

<!-- HTTPS URL -->
${URLUtils.https('Account-Show')}
${URLUtils.https('Checkout-Start')}

<!-- HTTP URL -->
${URLUtils.http('Home-Show')}

<!-- Absolute URL -->
${URLUtils.abs('Home-Show')}
${URLUtils.absStatic('/images/logo.png')}

<!-- Static resource -->
${URLUtils.staticURL('/css/style.css')}
${URLUtils.staticURL(URLUtils.CONTEXT_CATALOG, '', '/images/product.jpg')}

<!-- Web root -->
${URLUtils.webRoot()}
${URLUtils.httpWebRoot()}
${URLUtils.httpsWebRoot()}

<!-- Home URL -->
${URLUtils.home()}
${URLUtils.httpHome()}
${URLUtils.httpsHome()}

<!-- Continue URL (current page) -->
${URLUtils.continueURL()}
```

### Resource

Localized strings:

```html
<!-- Simple message -->
${Resource.msg('key.name', 'bundlename', null)}

<!-- With fallback -->
${Resource.msg('key.name', 'bundlename', 'Default Value')}

<!-- With parameters -->
${Resource.msgf('cart.itemcount', 'cart', null, itemCount)}
${Resource.msgf('greeting', 'common', null, firstName, lastName)}
```

### StringUtils

String manipulation:

```html
<!-- Truncate -->
${StringUtils.truncate(description, 100, '...')}

<!-- Pad -->
${StringUtils.pad(orderNumber, 10)}

<!-- Trim -->
${StringUtils.trim(input)}

<!-- Format -->
${StringUtils.formatNumber(quantity, '###,###')}
${StringUtils.formatInteger(count)}
${StringUtils.formatMoney(price)}

<!-- Encoding -->
${StringUtils.stringToHtml(text)}
${StringUtils.encodeString(text, 'UTF-8')}
```

### dw.util.Locale

Locale information:

```html
${new dw.util.Locale(request.locale).displayCountry}
${new dw.util.Locale(request.locale).displayLanguage}
```

## Date/Time

### Formatting Dates

```html
<!-- Using isprint -->
<isprint value="${order.creationDate}" style="DATE_SHORT"/>
<isprint value="${order.creationDate}" formatter="yyyy-MM-dd HH:mm:ss"/>

<!-- Using StringUtils -->
${StringUtils.formatCalendar(new dw.util.Calendar(), 'yyyy-MM-dd')}
```

### Current Date

```html
<isscript>
    var now = new Date();
    var calendar = new dw.util.Calendar();
</isscript>
${now}
${calendar.time}
```

## Collection Operations

### Iteration

```html
<isloop items="${products}" var="product" status="st">
    ${st.count}: ${product.name}
</isloop>
```

### Size/Length

```html
${products.length}
${products.size()}
${basket.productLineItems.length}
```

### Check Contents

```html
<isif condition="${products.length > 0}">
    Found ${products.length} products
</isif>

<isif condition="${empty(cart.items)}">
    Cart is empty
</isif>
```

## Common Patterns

### Null-safe Access

```html
<!-- Check before access -->
<isif condition="${product && product.brand}">
    ${product.brand.displayValue}
</isif>

<!-- Ternary fallback -->
${product.brand ? product.brand.displayValue : 'Unknown Brand'}
```

### Default Values

```html
${quantity || 1}
${customer.profile.firstName || 'Guest'}
```

### Conditional Classes

```html
<div class="product ${product.available ? 'in-stock' : 'out-of-stock'}">
<li class="${loopstatus.first ? 'first' : ''} ${loopstatus.last ? 'last' : ''}">
```

### Price Formatting

```html
<!-- Formatted price -->
${product.priceModel.price.toFormattedString()}

<!-- Raw value -->
${product.priceModel.price.value}

<!-- Currency code -->
${product.priceModel.price.currencyCode}
```

### Product Images

```html
<!-- Primary image -->
${product.getImage('large').URL}
${product.getImage('large').absURL}
${product.getImage('large').alt}

<!-- Image with fallback -->
<isif condition="${product.getImage('large')}">
    <img src="${product.getImage('large').URL}" alt="${product.name}"/>
<iselse>
    <img src="${URLUtils.staticURL('/images/no-image.png')}" alt="No image"/>
</isif>
```

### Localized Attributes

```html
<!-- Display value for localized attribute -->
${product.custom.myAttribute}
${product.brand.displayValue}

<!-- Enum value -->
${product.custom.productType.value}
${product.custom.productType.displayValue}
```
