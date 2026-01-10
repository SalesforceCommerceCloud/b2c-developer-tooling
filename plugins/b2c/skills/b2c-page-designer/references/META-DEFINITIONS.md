# Page Designer Meta Definitions Reference

Complete JSON schema for page types and component types.

## Page Type Schema

```json
{
    "name": "Page Type Name",
    "description": "Description shown in editor",
    "region_definitions": [
        {
            "id": "regionId",
            "name": "Region Name",
            "max_components": 5,
            "component_type_exclusions": [],
            "component_type_inclusions": []
        }
    ]
}
```

### Page Type Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | string | Yes | Display name in editor |
| `description` | string | No | Description shown when selecting page type |
| `region_definitions` | array | Yes | List of content regions |

### Region Definition Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | string | Yes | Unique identifier (alphanumeric, underscore) |
| `name` | string | Yes | Display name in editor |
| `max_components` | integer | No | Maximum components allowed |
| `component_type_exclusions` | array | No | Components NOT allowed in region |
| `component_type_inclusions` | array | No | ONLY these components allowed |

## Component Type Schema

```json
{
    "name": "Component Name",
    "description": "Component description",
    "group": "content",
    "attribute_definition_groups": [
        {
            "id": "groupId",
            "name": "Group Name",
            "description": "Group description",
            "attribute_definitions": [
                {
                    "id": "attributeId",
                    "name": "Attribute Name",
                    "description": "Help text",
                    "type": "string",
                    "required": false,
                    "default_value": "default"
                }
            ]
        }
    ],
    "region_definitions": []
}
```

### Component Type Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | string | Yes | Display name |
| `description` | string | No | Description in editor |
| `group` | string | No | Sidebar group (content, products, etc.) |
| `attribute_definition_groups` | array | Yes | Grouped attribute definitions |
| `region_definitions` | array | No | Nested regions (for container components) |

### Attribute Definition Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | string | Yes | Attribute identifier |
| `name` | string | Yes | Display name |
| `description` | string | No | Help text |
| `type` | string | Yes | Attribute type |
| `required` | boolean | No | Whether required (default false) |
| `default_value` | varies | No | Default value |
| `values` | array | No | Options for enum type |

## Complete Page Type Example

```json
{
    "name": "Product Landing Page",
    "description": "Landing page for product campaigns with hero, features, and product grid",
    "region_definitions": [
        {
            "id": "hero",
            "name": "Hero Section",
            "max_components": 1,
            "component_type_inclusions": [
                { "type_id": "hero-banner" },
                { "type_id": "video-hero" }
            ]
        },
        {
            "id": "features",
            "name": "Features Section",
            "max_components": 4,
            "component_type_inclusions": [
                { "type_id": "feature-card" },
                { "type_id": "icon-block" }
            ]
        },
        {
            "id": "products",
            "name": "Product Grid",
            "max_components": 1,
            "component_type_inclusions": [
                { "type_id": "product-grid" },
                { "type_id": "product-carousel" }
            ]
        },
        {
            "id": "content",
            "name": "Additional Content",
            "component_type_exclusions": [
                { "type_id": "hero-banner" },
                { "type_id": "video-hero" }
            ]
        },
        {
            "id": "cta",
            "name": "Call to Action",
            "max_components": 1
        }
    ]
}
```

## Complete Component Type Example

```json
{
    "name": "Product Card",
    "description": "Display a single product with image, name, price, and add to cart",
    "group": "products",
    "attribute_definition_groups": [
        {
            "id": "product",
            "name": "Product Selection",
            "attribute_definitions": [
                {
                    "id": "product",
                    "name": "Product",
                    "description": "Select the product to display",
                    "type": "product",
                    "required": true
                }
            ]
        },
        {
            "id": "display",
            "name": "Display Options",
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
                    "id": "showAddToCart",
                    "name": "Show Add to Cart Button",
                    "type": "boolean",
                    "default_value": true
                },
                {
                    "id": "imageSize",
                    "name": "Image Size",
                    "type": "enum",
                    "values": ["small", "medium", "large"],
                    "default_value": "medium"
                }
            ]
        },
        {
            "id": "style",
            "name": "Styling",
            "attribute_definitions": [
                {
                    "id": "cardStyle",
                    "name": "Card Style",
                    "type": "enum",
                    "values": ["default", "bordered", "shadow", "minimal"],
                    "default_value": "default"
                },
                {
                    "id": "backgroundColor",
                    "name": "Background Color",
                    "description": "CSS color value (e.g., #ffffff or white)",
                    "type": "string"
                }
            ]
        }
    ]
}
```

## Container Component Example

Component with nested regions:

```json
{
    "name": "Two Column Layout",
    "description": "Container with two side-by-side columns",
    "group": "layout",
    "attribute_definition_groups": [
        {
            "id": "layout",
            "name": "Layout Options",
            "attribute_definitions": [
                {
                    "id": "leftWidth",
                    "name": "Left Column Width",
                    "type": "enum",
                    "values": ["25%", "33%", "50%", "66%", "75%"],
                    "default_value": "50%"
                },
                {
                    "id": "gap",
                    "name": "Column Gap",
                    "type": "enum",
                    "values": ["none", "small", "medium", "large"],
                    "default_value": "medium"
                }
            ]
        }
    ],
    "region_definitions": [
        {
            "id": "left",
            "name": "Left Column"
        },
        {
            "id": "right",
            "name": "Right Column"
        }
    ]
}
```

**Script for container:**
```javascript
'use strict';

var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');
var PageRenderHelper = require('*/cartridge/experience/utilities/PageRenderHelper');

module.exports.render = function (context) {
    var model = new HashMap();
    var component = context.component;

    model.put('leftWidth', context.content.leftWidth || '50%');
    model.put('gap', context.content.gap || 'medium');

    // Render nested regions
    model.put('leftRegion', PageRenderHelper.renderRegion(component.getRegion('left')));
    model.put('rightRegion', PageRenderHelper.renderRegion(component.getRegion('right')));

    return new Template('experience/components/twocolumn').render(model).text;
};
```

## Page Script Context

Properties available in `context` parameter:

```javascript
module.exports.render = function (context) {
    var page = context.page;                    // dw.experience.Page
    var renderParameters = context.renderParameters;  // HashMap from PageMgr.renderPage()

    // Page methods
    var pageId = page.ID;
    var pageName = page.name;
    var isVisible = page.isVisible();
    var region = page.getRegion('regionId');    // dw.experience.Region
};
```

## Component Script Context

Properties available in `context` parameter:

```javascript
module.exports.render = function (context) {
    var component = context.component;          // dw.experience.Component
    var content = context.content;              // HashMap of attribute values
    var componentRenderSettings = context.componentRenderSettings;

    // Access attributes
    var image = content.image;                  // dw.experience.image.Image
    var product = content.product;              // dw.catalog.Product
    var category = content.category;            // dw.catalog.Category
    var text = content.headline;                // String
    var enabled = content.showPrice;            // Boolean
    var url = content.ctaUrl;                   // String (URL)

    // For container components
    var region = component.getRegion('regionId');
};
```
