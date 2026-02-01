# Page Designer Attribute Types Reference

All attribute types available for Page Designer components.

## String Types

### string

Single-line text input.

```json
{
    "id": "headline",
    "name": "Headline",
    "type": "string",
    "required": true,
    "default_value": "Enter headline"
}
```

**Returns:** String

### text

Multi-line text area.

```json
{
    "id": "description",
    "name": "Description",
    "type": "text",
    "required": false
}
```

**Returns:** String

### markup

Rich text editor with formatting.

```json
{
    "id": "body",
    "name": "Body Content",
    "type": "markup"
}
```

**Returns:** HTML string (use `encoding="off"` in ISML)

**Template usage:**
```html
<isprint value="${pdict.body}" encoding="off"/>
```

## Numeric Types

### integer

Whole number input.

```json
{
    "id": "columns",
    "name": "Number of Columns",
    "type": "integer",
    "default_value": 3
}
```

**Returns:** Integer

## Boolean Type

### boolean

Checkbox.

```json
{
    "id": "showPrice",
    "name": "Show Price",
    "type": "boolean",
    "default_value": true
}
```

**Returns:** Boolean

## Selection Types

### enum

Single-select dropdown.

```json
{
    "id": "alignment",
    "name": "Text Alignment",
    "type": "enum",
    "values": ["left", "center", "right", "justify"],
    "default_value": "left"
}
```

**Returns:** String (selected value)

### enum with display names

For user-friendly labels, use separate locale resource files.

```json
{
    "id": "size",
    "name": "Size",
    "type": "enum",
    "values": ["sm", "md", "lg", "xl"],
    "default_value": "md"
}
```

## Media Types

### image

Image picker with focal point.

```json
{
    "id": "bannerImage",
    "name": "Banner Image",
    "type": "image",
    "required": true
}
```

**Returns:** `dw.experience.image.Image`

**Script usage:**
```javascript
var image = content.bannerImage;
var url = image.file.absURL;
var focalPoint = image.focalPoint;  // {x, y} if set
```

**Template usage:**
```html
<isif condition="${pdict.bannerImage}">
    <img src="${pdict.bannerImage.file.absURL}"
         alt="${pdict.altText}"/>
</isif>
```

### file

General file picker.

```json
{
    "id": "document",
    "name": "PDF Document",
    "type": "file"
}
```

**Returns:** `dw.content.MediaFile`

**Usage:**
```javascript
var file = content.document;
var url = file.absURL;
```

## URL Type

### url

URL picker (internal or external).

```json
{
    "id": "ctaLink",
    "name": "Button Link",
    "type": "url"
}
```

**Returns:** String (URL)

**Template usage:**
```html
<isif condition="${pdict.ctaLink}">
    <a href="${pdict.ctaLink}" class="btn">Learn More</a>
</isif>
```

## Commerce Types

### product

Product selector.

```json
{
    "id": "featuredProduct",
    "name": "Featured Product",
    "type": "product",
    "required": true
}
```

**Returns:** `dw.catalog.Product`

**Script usage:**
```javascript
var product = content.featuredProduct;
if (product) {
    model.put('productName', product.name);
    model.put('productPrice', product.priceModel.price);
    model.put('productImage', product.getImage('large'));
}
```

### category

Category selector.

```json
{
    "id": "category",
    "name": "Product Category",
    "type": "category"
}
```

**Returns:** `dw.catalog.Category`

**Script usage:**
```javascript
var category = content.category;
if (category) {
    model.put('categoryName', category.displayName);
    model.put('categoryUrl', URLUtils.url('Search-Show', 'cgid', category.ID));
}
```

### page

Page Designer page selector.

```json
{
    "id": "linkedPage",
    "name": "Linked Page",
    "type": "page"
}
```

**Returns:** `dw.experience.Page`

**Script usage:**
```javascript
var page = content.linkedPage;
if (page && page.isVisible()) {
    model.put('pageUrl', URLUtils.url('Page-Show', 'cid', page.ID));
}
```

## CMS Type

### cms_record

CMS content asset selector.

```json
{
    "id": "contentAsset",
    "name": "Content Asset",
    "type": "cms_record"
}
```

**Returns:** Content asset reference

## Custom Type

### custom

JSON object with custom UI or text area.

```json
{
    "id": "customData",
    "name": "Custom Configuration",
    "type": "custom",
    "required": false
}
```

**Returns:** Object (parsed JSON)

**Script usage:**
```javascript
var customData = content.customData;
if (customData) {
    model.put('customValue', customData.someProperty);
}
```

## Complete Component Example

Using multiple attribute types:

```json
{
    "name": "Product Spotlight",
    "group": "products",
    "attribute_definition_groups": [
        {
            "id": "product",
            "name": "Product",
            "attribute_definitions": [
                {
                    "id": "product",
                    "name": "Select Product",
                    "type": "product",
                    "required": true
                }
            ]
        },
        {
            "id": "content",
            "name": "Content",
            "attribute_definitions": [
                {
                    "id": "overrideImage",
                    "name": "Override Image",
                    "description": "Use custom image instead of product image",
                    "type": "image"
                },
                {
                    "id": "headline",
                    "name": "Custom Headline",
                    "description": "Overrides product name",
                    "type": "string"
                },
                {
                    "id": "description",
                    "name": "Custom Description",
                    "type": "markup"
                },
                {
                    "id": "ctaText",
                    "name": "Button Text",
                    "type": "string",
                    "default_value": "Shop Now"
                },
                {
                    "id": "ctaUrl",
                    "name": "Button Link",
                    "description": "Leave empty to link to product page",
                    "type": "url"
                }
            ]
        },
        {
            "id": "display",
            "name": "Display Settings",
            "attribute_definitions": [
                {
                    "id": "showPrice",
                    "name": "Show Price",
                    "type": "boolean",
                    "default_value": true
                },
                {
                    "id": "showRating",
                    "name": "Show Rating",
                    "type": "boolean",
                    "default_value": true
                },
                {
                    "id": "layout",
                    "name": "Layout",
                    "type": "enum",
                    "values": ["horizontal", "vertical", "overlay"],
                    "default_value": "horizontal"
                },
                {
                    "id": "columns",
                    "name": "Grid Columns (for vertical)",
                    "type": "integer",
                    "default_value": 1
                }
            ]
        }
    ]
}
```

**Script:**
```javascript
'use strict';

var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');
var URLUtils = require('dw/web/URLUtils');

module.exports.render = function (context) {
    var model = new HashMap();
    var content = context.content;
    var product = content.product;

    if (!product) {
        return '';
    }

    // Use override or product data
    var image = content.overrideImage || product.getImage('large');
    var headline = content.headline || product.name;
    var ctaUrl = content.ctaUrl || URLUtils.url('Product-Show', 'pid', product.ID);

    model.put('product', product);
    model.put('image', image);
    model.put('headline', headline);
    model.put('description', content.description);
    model.put('ctaText', content.ctaText || 'Shop Now');
    model.put('ctaUrl', ctaUrl);
    model.put('showPrice', content.showPrice !== false);
    model.put('showRating', content.showRating !== false);
    model.put('layout', content.layout || 'horizontal');

    return new Template('experience/components/productspotlight').render(model).text;
};
```
