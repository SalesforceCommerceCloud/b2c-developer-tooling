# ISML Tags Reference

Comprehensive reference for ISML tags.

## Control Flow Tags

### isif / iselseif / iselse

Conditional rendering:

```html
<isif condition="${customer.authenticated}">
    Welcome back, ${customer.profile.firstName}!
<iselseif condition="${session.custom.guestName}">
    Welcome, ${session.custom.guestName}!
<iselse>
    Welcome, Guest!
</isif>
```

### isloop

Iterate over collections:

```html
<isloop items="${productList}" var="product" status="loopstatus" begin="0" end="9" step="1">
    <div class="item-${loopstatus.count}">
        ${product.name}
    </div>
</isloop>
```

**Attributes:**
- `items` - Collection to iterate (required)
- `var` - Variable name for current item (required)
- `status` - Loop status object name (optional)
- `begin` - Start index (optional, default 0)
- `end` - End index (optional)
- `step` - Increment (optional, default 1)

**Status properties:**
- `count` - 1-based iteration count
- `index` - 0-based index
- `first` - true on first iteration
- `last` - true on last iteration
- `odd` - true on odd iterations (1, 3, 5...)
- `even` - true on even iterations (2, 4, 6...)

### isbreak / iscontinue / isnext

Loop control:

```html
<isloop items="${products}" var="product">
    <isif condition="${product.ID == 'STOP'}">
        <isbreak/>  <!-- Exit loop -->
    </isif>
    <isif condition="${!product.online}">
        <iscontinue/>  <!-- Skip to next iteration -->
    </isif>
    ${product.name}
</isloop>
```

## Variable Tags

### isset

Set a variable (allowed anywhere in template):

```html
<isset name="total" value="${price * quantity}" scope="page"/>
<isset name="cartId" value="${basket.UUID}" scope="session"/>
<isset name="viewMode" value="grid" scope="request"/>
<isset name="title" value="My Page" scope="pdict"/>
```

**Attributes (all required):**
- `name` - Variable name
- `value` - Value to assign
- `scope` - Variable scope (required)

**Scopes:**
- `page` - Current template only
- `request` - Current request (across includes)
- `session` - User session (persistent)
- `pdict` - Pipeline dictionary (for decorator pattern)

### isremove

Remove a variable:

```html
<isremove name="tempData" scope="page"/>
```

## Output Tags

### isprint

Output values with encoding and formatting.

**Allowed location:** `<body>` only.

```html
<!-- Basic (HTML encoded) -->
<isprint value="${product.name}"/>

<!-- No encoding (dangerous - only for trusted HTML) -->
<isprint value="${richTextContent}" encoding="off"/>

<!-- Number formatting -->
<isprint value="${price}" style="CURRENCY"/>
<isprint value="${quantity}" style="INTEGER"/>
<isprint value="${rate}" style="DECIMAL"/>

<!-- Date formatting -->
<isprint value="${order.creationDate}" style="DATE_SHORT"/>
<isprint value="${order.creationDate}" style="DATE_LONG"/>
<isprint value="${order.creationDate}" style="DATE_TIME"/>

<!-- Custom formatter -->
<isprint value="${date}" formatter="yyyy-MM-dd"/>

<!-- Padding -->
<isprint value="${orderNumber}" padding="10"/>
```

**Encoding options:** `on` (default), `off`, `htmlcontent`, `htmlsinglequote`, `htmldoublequote`, `xml`, `jshtml`, `jsattribute`, `jsblock`, `uricomponent`, `uristrict`

## Template Composition

### isinclude

Include another template:

```html
<!-- Local include (from cartridge) -->
<isinclude template="components/header"/>

<!-- URL include (controller output) -->
<isinclude url="${URLUtils.url('Header-Include')}"/>

<!-- Include with specific file -->
<isinclude sf-toolkit="off" template="checkout/billing"/>
```

**Max include depth:** 20 for local, 10 for URL includes.

### isdecorate / isreplace

Decorator pattern for layouts:

**Decorator template (common/layout/page.isml):**
```html
<!DOCTYPE html>
<html>
<head><title>${pdict.title}</title></head>
<body>
    <isinclude template="components/header"/>
    <main>
        <isreplace/>
    </main>
    <isinclude template="components/footer"/>
</body>
</html>
```

**Page template:**
```html
<isdecorate template="common/layout/page">
    <isset name="title" value="My Page" scope="pdict"/>
    <h1>Page Content</h1>
</isdecorate>
```

### ismodule

Define custom tags:

```html
<!-- In util/modules.isml -->
<ismodule template="components/badge"
          name="badge"
          attribute="text"
          attribute="type"/>

<!-- Component template (components/badge.isml) -->
<span class="badge badge-${pdict.type}">${pdict.text}</span>

<!-- Usage -->
<isinclude template="util/modules"/>
<isbadge text="Sale" type="danger"/>
```

## Content Tags

### iscontent

Set response content type.

**Allowed location:** Must be before DOCTYPE declaration (first in template).

```html
<!-- HTML (default) -->
<iscontent type="text/html" charset="UTF-8"/>

<!-- JSON -->
<iscontent type="application/json" charset="UTF-8"/>

<!-- XML -->
<iscontent type="application/xml" charset="UTF-8"/>

<!-- Plain text -->
<iscontent type="text/plain" charset="UTF-8"/>

<!-- Compact mode (strips whitespace) -->
<iscontent type="text/html" charset="UTF-8" compact="true"/>
```

**Must be first in template.**

### iscache

Page caching:

```html
<!-- Relative cache (from request time) -->
<iscache type="relative" hour="24"/>
<iscache type="relative" minute="30"/>

<!-- Daily cache (at specific time) -->
<iscache type="daily" hour="0" minute="0"/>

<!-- Vary by factors -->
<iscache type="relative" hour="1" varyby="price_promotion"/>
```

**varyby options:** `price_promotion`, `request_path`, custom

### iscomment

Template comments (not in output):

```html
<iscomment>
    This will not appear in rendered HTML.
    Use for developer documentation.
</iscomment>
```

### iscomponent

Include pipeline/controller output:

```html
<iscomponent pipeline="Product-Price" pid="${product.ID}"/>
```

## Navigation Tags

### isredirect

Redirect to URL.

**Allowed location:** Must be before DOCTYPE declaration.

```html
<!-- Temporary redirect (302) -->
<isredirect location="${URLUtils.url('Home-Show')}"/>

<!-- Permanent redirect (301) -->
<isredirect location="${URLUtils.url('NewPage-Show')}" permanent="true"/>
```

**Must be before any HTML output.**

### isstatus

Set HTTP status code:

```html
<isstatus value="404"/>
<isstatus value="500"/>
```

## Form Tags

### isselect

Enhanced HTML select element (allowed anywhere in template):

```html
<isselect
    name="country"
    iterator="${countries}"
    description="Select Country"
    value="${countryCode}"
    condition="${true}"
    encoding="on"/>
```

**Attributes:**
- `name` - Name attribute for form submission (required)
- `iterator` - Collection to iterate for options (required)
- `description` - Display text for default/empty option (required)
- `value` - Property to use as option value (required)
- `condition` - Expression to mark option as selected (optional)
- `encoding` - HTML encoding on/off (optional, default: on)

## Script Tag

### isscript

Embed server-side JavaScript:

```html
<isscript>
    var ProductMgr = require('dw/catalog/ProductMgr');
    var product = ProductMgr.getProduct('ABC123');
    var available = product.availabilityModel.inStock;
</isscript>

<isif condition="${available}">
    In Stock
</isif>
```

**Best Practice:** Minimize inline scripts. Use controllers for complex logic.

## Slot Tag

### isslot

Content slot:

```html
<!-- Global slot -->
<isslot id="header-banner" context="global" description="Header Banner"/>

<!-- Category slot -->
<isslot id="category-banner" context="category" context-object="${category}"/>

<!-- Folder slot -->
<isslot id="folder-promo" context="folder" context-object="${folder}"/>
```

## Cookie Tag

### iscookie

Set HTTP cookie:

```html
<iscookie
    name="preference"
    value="dark-mode"
    path="/"
    domain=".example.com"
    maxAge="31536000"
    secure="true"/>
```

## Active Data Tags

### isobject

Track page impressions/views. Must pass an object of type ProductHit.

```html
<isobject object="${productHit}" view="detail">
    <!-- Product content -->
</isobject>

<isobject object="${productHit}" view="searchhit">
    <!-- Search result item -->
</isobject>
```

**Attributes:**
- `object` - ProductHit object (required)
- `view` - View type (required): `none`, `searchhit`, `recommendation`, `setproduct`, `detail`

### isactivedatahead

**Allowed location:** `<head>` only.

```html
<isactivedatahead/>
```

Enables active data collection for pages with a `<head>` tag.

### isactivedatacontext

**Allowed locations:** `<head>`, `<body>`, anywhere script tags are valid.

```html
<isactivedatacontext category="${category}"/>
```

Collects category context from a page. Should only be in one template used to render a page.

### isanalyticsoff

Disable analytics for single pages.

**Allowed locations:** `<head>`, `<body>`, anywhere script tags are valid.

```html
<isanalyticsoff/>
```

## Special Tags

### isprint with style options

| Style | Description | Example Output |
|-------|-------------|----------------|
| `CURRENCY` | Currency format | $1,234.56 |
| `INTEGER` | Integer only | 1,235 |
| `DECIMAL` | Decimal format | 1,234.56 |
| `DATE_SHORT` | Short date | 1/15/24 |
| `DATE_LONG` | Long date | January 15, 2024 |
| `DATE_TIME` | Date and time | 1/15/24 3:30 PM |
