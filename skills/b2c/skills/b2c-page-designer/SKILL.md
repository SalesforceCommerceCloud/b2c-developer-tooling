---
name: b2c-page-designer
description: Create Page Designer pages and components in B2C Commerce. Use when building visual merchandising tools, content slots, or experience API integrations. Covers page types, component types, regions, attribute definitions, component type ID and subfolders, enum and custom/color attribute pitfalls, and troubleshooting when a component does not appear in the editor.
---

# Page Designer Skill

This skill guides you through creating custom Page Designer page types and component types for Salesforce B2C Commerce.

## Overview

Page Designer allows merchants to create and manage content pages through a visual editor. Developers create:

1. **Page Types** - Define page structures with regions
2. **Component Types** - Reusable content blocks with configurable attributes

## File Structure

Page Designer files are in the cartridge's `experience` directory:

```
/my-cartridge
    /cartridge
        /experience
            /pages
                homepage.json           # Page type meta definition
                homepage.js             # Page type script
            /components
                banner.json             # Component type meta definition
                banner.js               # Component type script
        /templates
            /default
                /experience
                    /pages
                        homepage.isml   # Page template
                    /components
                        banner.isml     # Component template
```

**Naming:** The `.json` and `.js` files must have matching names. Use only **alphanumeric** or **underscore** in file names and in any subdirectory names under `experience/pages` or `experience/components`.

**Component types in subfolders:** You can put component meta and script in a subdirectory (e.g. `experience/components/assets/`). The **component type ID** is then the path with dots: `assets.hero_image_block`. The template path under `templates/default/` must mirror that path (e.g. `templates/default/experience/components/assets/hero_image_block.isml`), and the script must call `Template('experience/components/assets/hero_image_block')` so the path matches. Stored ID is `component.{component_type_id}`; total length must not exceed 256 characters.

## Page Types

### Meta Definition (pages/homepage.json)

```json
{
    "name": "Home Page",
    "description": "Landing page with hero and content regions",
    "region_definitions": [
        {
            "id": "hero",
            "name": "Hero Section",
            "max_components": 1
        },
        {
            "id": "content",
            "name": "Main Content"
        },
        {
            "id": "footer",
            "name": "Footer Section",
            "component_type_exclusions": [
                { "type_id": "video" }
            ]
        }
    ]
}
```

### Page Script (pages/homepage.js)

```javascript
'use strict';

var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');

module.exports.render = function (context) {
    var model = new HashMap();
    var page = context.page;

    model.put('page', page);

    return new Template('experience/pages/homepage').render(model).text;
};
```

### Page Template (templates/experience/pages/homepage.isml)

```html
<isdecorate template="common/layout/page">
    <isscript>
        var PageRenderHelper = require('*/cartridge/experience/utilities/PageRenderHelper');
    </isscript>

    <div class="homepage">
        <div class="hero-region">
            <isprint value="${PageRenderHelper.renderRegion(pdict.page.getRegion('hero'))}" encoding="off"/>
        </div>

        <div class="content-region">
            <isprint value="${PageRenderHelper.renderRegion(pdict.page.getRegion('content'))}" encoding="off"/>
        </div>

        <div class="footer-region">
            <isprint value="${PageRenderHelper.renderRegion(pdict.page.getRegion('footer'))}" encoding="off"/>
        </div>
    </div>
</isdecorate>
```

## Component Types

### Meta Definition (components/banner.json)

```json
{
    "name": "Banner",
    "description": "Promotional banner with image and CTA",
    "group": "content",
    "region_definitions": [],
    "attribute_definition_groups": [
        {
            "id": "image",
            "name": "Image Settings",
            "attribute_definitions": [
                {
                    "id": "image",
                    "name": "Banner Image",
                    "type": "image",
                    "required": true
                },
                {
                    "id": "alt",
                    "name": "Alt Text",
                    "type": "string",
                    "required": true
                }
            ]
        },
        {
            "id": "content",
            "name": "Content",
            "attribute_definitions": [
                {
                    "id": "headline",
                    "name": "Headline",
                    "type": "string",
                    "required": true
                },
                {
                    "id": "body",
                    "name": "Body Text",
                    "type": "markup"
                },
                {
                    "id": "ctaUrl",
                    "name": "CTA Link",
                    "type": "url"
                },
                {
                    "id": "ctaText",
                    "name": "CTA Button Text",
                    "type": "string"
                }
            ]
        },
        {
            "id": "layout",
            "name": "Layout Options",
            "attribute_definitions": [
                {
                    "id": "alignment",
                    "name": "Text Alignment",
                    "type": "enum",
                    "values": ["left", "center", "right"],
                    "default_value": "center"
                },
                {
                    "id": "fullWidth",
                    "name": "Full Width",
                    "type": "boolean",
                    "default_value": false
                }
            ]
        }
    ]
}
```

**Component meta:** Always include `region_definitions`. Use `[]` when the component has no nested regions (no slots for other components).

### Component Script (components/banner.js)

```javascript
'use strict';

var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');
var URLUtils = require('dw/web/URLUtils');

module.exports.render = function (context) {
    var model = new HashMap();
    var content = context.content;

    // Access merchant-configured attributes
    model.put('image', content.image);        // Image object
    model.put('alt', content.alt);            // String
    model.put('headline', content.headline);  // String
    model.put('body', content.body);          // Markup string
    model.put('ctaUrl', content.ctaUrl);      // URL object
    model.put('ctaText', content.ctaText);    // String
    model.put('alignment', content.alignment || 'center');
    model.put('fullWidth', content.fullWidth);

    return new Template('experience/components/banner').render(model).text;
};
```

**Template path:** The path passed to `Template(...)` must match the template path under `templates/default/`. If the component lives in a subfolder (e.g. `experience/components/assets/hero_image_block`), use `Template('experience/components/assets/hero_image_block')` and place the ISML at `templates/default/experience/components/assets/hero_image_block.isml`.

**Handling colors (string or color picker object):** If an attribute can be a hex string or a color picker object `{ color: "#hex" }`, use a small helper so the script works with both:

```javascript
function getColor(colorAttr) {
    if (!colorAttr) return '';
    if (typeof colorAttr === 'string' && colorAttr.trim()) return colorAttr.trim();
    if (colorAttr.color) return colorAttr.color;
    return '';
}
```

### Component Template (templates/experience/components/banner.isml)

```html
<div class="banner ${pdict.fullWidth ? 'banner--full-width' : ''}"
     style="text-align: ${pdict.alignment}">
    <isif condition="${pdict.image}">
        <img src="${pdict.image.file.absURL}"
             alt="${pdict.alt}"
             class="banner__image"/>
    </isif>

    <div class="banner__content">
        <h2 class="banner__headline">${pdict.headline}</h2>

        <isif condition="${pdict.body}">
            <div class="banner__body">
                <isprint value="${pdict.body}" encoding="off"/>
            </div>
        </isif>

        <isif condition="${pdict.ctaUrl && pdict.ctaText}">
            <a href="${pdict.ctaUrl}" class="banner__cta btn btn-primary">
                ${pdict.ctaText}
            </a>
        </isif>
    </div>
</div>
```

## Attribute Types

| Type | Description | Returns |
|------|-------------|---------|
| `string` | Text input | String |
| `text` | Multi-line text | String |
| `markup` | Rich text editor | Markup string (use `encoding="off"`) |
| `boolean` | Checkbox | Boolean |
| `integer` | Number input | Integer |
| `enum` | Single select dropdown | String |
| `image` | Image picker | Image object with `file.absURL` |
| `file` | File picker | File object |
| `url` | URL picker | URL string |
| `category` | Category selector | Category object |
| `product` | Product selector | Product object |
| `page` | Page selector | Page object |
| `custom` | JSON object or custom editor | Object (or editor-specific) |

**Enum — critical for component visibility:** Use a **string array** for `values`: `"values": ["left", "center", "right"]`. Do **not** use objects like `{ "value": "x", "display_value": "X" }`; that format can cause the component type to be rejected and **not appear** in the Page Designer component list.

**Custom and colors:** `type: "custom"` with e.g. `editor_definition.type: "styling.colorPicker"` requires a cartridge that provides that editor on the **Business Manager** site cartridge path. If the component does not show up in the editor, use `type: "string"` for color attributes (merchant types a hex). In the script, support both: accept a string or an object like `{ color: "#hex" }` (e.g. a small `getColor(attr)` helper that returns the string).

**default_value:** Used for storefront rendering only; it is **not** shown as preselected in the Page Designer visual editor.

## Region Definitions

```json
{
    "region_definitions": [
        {
            "id": "main",
            "name": "Main Content",
            "max_components": 10,
            "component_type_exclusions": [
                { "type_id": "heavy-component" }
            ],
            "component_type_inclusions": [
                { "type_id": "text-block" },
                { "type_id": "image-block" }
            ]
        }
    ]
}
```

| Property | Description |
|----------|-------------|
| `id` | Unique region identifier |
| `name` | Display name in editor |
| `max_components` | Max number of components (optional) |
| `component_type_exclusions` | Components NOT allowed |
| `component_type_inclusions` | Only these components allowed |

## Rendering Pages

### In Controllers

```javascript
var PageMgr = require('dw/experience/PageMgr');

server.get('Show', function (req, res, next) {
    var page = PageMgr.getPage(req.querystring.cid);

    if (page && page.isVisible()) {
        res.page(page.ID);
    } else {
        res.setStatusCode(404);
        res.render('error/notfound');
    }
    next();
});
```

### In ISML

```html
<isscript>
    var PageMgr = require('dw/experience/PageMgr');
    var page = PageMgr.getPage('homepage-id');
</isscript>

<isif condition="${page && page.isVisible()}">
    <isprint value="${PageMgr.renderPage(page.ID)}" encoding="off"/>
</isif>
```

## Component Groups

Organize components in the editor sidebar:

```json
{
    "name": "Product Card",
    "group": "products"
}
```

Common groups: `content`, `products`, `navigation`, `layout`, `media`

## If the component does not appear in Page Designer

1. **Enums:** Ensure all `enum` attributes use `"values": ["a", "b"]` (string array), not objects with `value`/`display_value`.
2. **Custom editors:** Replace `type: "custom"` (e.g. color picker) with `type: "string"` for the problematic attributes and redeploy; if the component then appears, the issue is likely the custom editor or BM cartridge path.
3. **Naming:** File and subdirectory names only alphanumeric or underscore.
4. **region_definitions:** Component meta must include `region_definitions` (use `[]` if no nested regions).
5. **Template path:** Script `Template('...')` path must match the template path under `templates/default/` (including subfolders like `experience/components/assets/...`).
6. **Logs:** In Business Manager, **Administration > Site Development > Development Setup**, check error logs when opening Page Designer for script or meta errors related to your component type ID.
7. **Code version:** Deploy the cartridge to the correct code version; in non-production, meta can be cached for a few seconds—try a code version switch or short wait.

## Best Practices

1. **Use `dw.util.Template`** for rendering (NOT `dw.template.ISML`)
2. **Keep components self-contained** - avoid cross-component dependencies
3. **Provide default values** for optional attributes (they apply to rendering; not shown as preselected in the editor)
4. **Group related attributes** in `attribute_definition_groups`
5. **Use meaningful IDs** - they're used programmatically
6. **Don't change type IDs or attribute types** after merchants create content (creates inconsistency with stored data); add a new component type and deprecate the old one if needed
7. **Prefer string arrays for enums** and **string for colors** unless you control the BM cartridge path and custom editors

## Detailed Reference

For comprehensive attribute documentation:
- [Meta Definitions Reference](references/META-DEFINITIONS.md) - Full JSON schema
- [Attribute Types Reference](references/ATTRIBUTE-TYPES.md) - All attribute types with examples
