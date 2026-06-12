# Business Manager Extensions XML Reference

Complete reference for `bm_extensions.xml`, based on the authoritative `bmext.xsd` schema (`bmmodules/2007-12-11`).

## XSD Schema Reference

The schema is authoritative. View it any time with the `b2c` CLI:

```bash
# Print the BM extensions XSD
b2c docs schema bmext

# Or just its filesystem path
b2c docs schema bmext --path
```

## File Location & Encoding

```
/bm_cartridge_name
    /cartridge
        bm_extensions.xml    <-- Required file
```

Use `ISO-8859-1` encoding to match platform samples.

## Root Element

```xml
<?xml version="1.0" encoding="ISO-8859-1" ?>
<extensions xmlns="http://www.demandware.com/xml/bmmodules/2007-12-11"
            xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
            xsi:schemaLocation="http://www.demandware.com/xml/bmmodules/2007-12-11 bmext.xsd">
    <!-- menuitem | menuaction | dialogaction | formextension (any order, any number) -->
</extensions>
```

> The namespace is `bmmodules/2007-12-11`. The `extensibility/*` namespace is **not** the BM-extension schema — using it will not load.

## Localized text: `LocalizedString`

`name`, `short_description`, `description`, `extended_description`, and `<label>` are **child elements** of type `LocalizedString` — a string with a **required** `xml:lang` attribute. They are not attributes and not resource-bundle keys. Localize by repeating the element:

```xml
<name xml:lang="x-default">Product Export</name>
<name xml:lang="de">Produktexport</name>
<name xml:lang="fr">Exportation de produits</name>
```

Because text is inline, BM extensions do **not** need a `bm_extensions.properties` resource bundle.

## Positioning

`position` is an integer and sorts **ascending — lower numbers appear higher**. Core BM menu items run from `2000` (Products and Catalogs) to `12000` (Site Preferences). Conventions:

- `99999` (large) → sit at the bottom of a menu.
- `-1` → float a "Home" action to the very top of its section.

## Menu Item Element

Creates a navigation container.

```xml
<menuitem id="acme_id01" position="99999" site="false">
    <name xml:lang="x-default">ACME Tools</name>
    <short_description xml:lang="x-default">ACME admin tools</short_description>
    <description xml:lang="x-default">Tools and utilities from the ACME team</description>
    <icon>icons/acme.png</icon>
</menuitem>
```

### Attributes

| Attribute | Required | Default | Description |
|-----------|----------|---------|-------------|
| `id` | Yes | - | Unique identifier |
| `site` | No | `true` | `true` = site menu, `false` = Administration menu |
| `position` | No | - | Sort order (lower = higher) |
| `type` | No | `BM` | `BM` or `CSC` |

### Child Elements (in schema order)

| Element | Required | Description |
|---------|----------|-------------|
| `<name xml:lang="...">` | Yes | Display name (repeat per locale) |
| `<short_description xml:lang="...">` | No | Short description / tooltip |
| `<description xml:lang="...">` | No | Long description |
| `<icon>path</icon>` | No | Icon path (string element, relative to `static/`) |
| `<sldsIconName>` | No | SLDS *utility* icon name; preferred in the modern BM UI |
| `<exec>` | No | Optional direct action |

## Menu Action Element

Creates a functional page/link wired to a controller node.

```xml
<menuaction id="acme-export" menupath="acme_id01" position="20" site="false">
    <name xml:lang="x-default">Product Export</name>
    <short_description xml:lang="x-default">Export products to CSV</short_description>
    <exec pipeline="ACME" node="Export"/>
    <sub-pipelines>
        <pipeline name="ACME-Export"/>
        <pipeline name="ACME-Download"/>
    </sub-pipelines>
    <parameters>
        <parameter name="defaultFormat" value="csv"/>
    </parameters>
    <icon>icons/export.png</icon>
</menuaction>
```

### Attributes

| Attribute | Required | Default | Description |
|-----------|----------|---------|-------------|
| `id` | Yes | - | Unique identifier |
| `menupath` | No | - | Parent menu item id (yours, or a core BM id) |
| `site` | No | `true` | Must match the parent menu item |
| `position` | No | - | Sort order (lower = higher; `-1` floats to top) |
| `extern` | No | `false` | `true` opens in a new window |
| `type` | No | `BM` | `BM` or `CSC` |

### Child Elements

| Element | Required | Description |
|---------|----------|-------------|
| `<name>` | Yes | Display name (localized) |
| `<short_description>` / `<description>` / `<extended_description>` | No | Localized descriptions |
| `<exec>` | No | Controller/pipeline entry point |
| `<sub-pipelines>` | No | All nodes used by this action (drives the permission check) |
| `<parameters>` | No | Static parameters passed to the action |
| `<icon>` | No | Icon path (string element) |

> The schema also defines `permissions` (deprecated — use `sub-pipelines`), and `apis`/`scapis`/`required-features`, but those are **not supported for custom menu actions**.

### exec Element

```xml
<exec pipeline="ACME" node="Export"/>
```

| Attribute | Required | Description |
|-----------|----------|-------------|
| `pipeline` | Yes | Controller name (e.g. `ACME` → `controllers/ACME.js`) |
| `node` | Yes | Exported function name (e.g. `Export` → `exports.Export`, `.public = true`) |

There is no `https` attribute.

### sub-pipelines and the permission check

`<sub-pipelines>` lists every `Controller-Node` the action can reach (`<pipeline name="ACME-Export"/>`). BM uses this list for its permission check: a user must have the action's module to invoke any node registered under it.

### The `NoPermissionCheck` idiom

To expose nodes that must work **without** a module permission check (keepalive, service workers, polling/AJAX endpoints triggered by page JS), declare a menu action with the reserved id `NoPermissionCheck` and **no `<exec>`**:

```xml
<menuaction id="NoPermissionCheck" site="false">
    <name xml:lang="x-default">Dummy</name>
    <short_description xml:lang="x-default">Holds pipelines that do not require a permission check</short_description>
    <sub-pipelines>
        <pipeline name="ACME-Keepalive"/>
        <pipeline name="ACME-ServiceWorker"/>
    </sub-pipelines>
</menuaction>
```

Only list nodes that are safe for any authenticated BM user.

## Dialog Action Element

Adds buttons/actions to existing BM pages at a defined extension point.

```xml
<dialogaction id="acme-order-sync" xp_ref="OrderPage-OrderDetails" position="100">
    <name xml:lang="x-default">Sync Order</name>
    <exec pipeline="ACME" node="OrderSync"/>
    <parameters>
        <parameter name="OrderNo"/>
    </parameters>
    <menuactions>
        <menuaction-ref action-id="acme-home"/>
    </menuactions>
</dialogaction>
```

### Attributes

| Attribute | Required | Default | Description |
|-----------|----------|---------|-------------|
| `id` | Yes | - | Unique identifier |
| `xp_ref` | Yes | - | Extension point id (**underscore**, not `xp-ref`) |
| `position` | No | - | Sort order |
| `class` | No | - | Optional CSS class |
| `extern` | No | `false` | `true` opens in a new window |

### Child Elements

| Element | Required | Description |
|---------|----------|-------------|
| `<name>` | No | Button label (localized) |
| `<exec>` | Yes | Controller/pipeline entry point |
| `<parameters>` | No | Context parameters passed from the host page (e.g. `OrderNo`) |
| `<menuactions>` | No | One or more `<menuaction-ref action-id="..."/>` linking to the menu action that owns the permission check |

> There is no `menuaction-ref` attribute and no `icon`/`extern` child element — `extern` is an attribute, and linkage is the `<menuactions>` child.

### Common Extension Points (`xp_ref`)

| Extension Point | Page |
|-----------------|------|
| `OrderPage-OrderDetails` | Order detail page |
| `OrderPage-OrderAttributes` | Order attributes section |
| `ProductPage-General` | Product general section |
| `ProductPage-Images` | Product images section |
| `CustomerPage-Profile` | Customer profile page |
| `CustomerPage-Addresses` | Customer addresses |
| `ContentPage-General` | Content asset page |
| `CatalogPage-CategoryGeneral` | Category general section |

## Form Extension Element

Adds fields to existing BM search forms.

```xml
<formextension id="order-search">
    <valueinput type="string" name="invoiceNumber">
        <label xml:lang="x-default">Invoice Number</label>
        <label xml:lang="de">Rechnungsnummer</label>
    </valueinput>
    <valueinput type="string" name="syncStatus" defaultvalue="">
        <label xml:lang="x-default">Sync Status</label>
        <option>All</option>
        <option>Synced</option>
        <option>Pending</option>
        <option>Failed</option>
    </valueinput>
    <valueinput type="int" name="minQuantity">
        <label xml:lang="x-default">Minimum Quantity</label>
    </valueinput>
</formextension>
```

### formextension attributes

| Attribute | Required | Description |
|-----------|----------|-------------|
| `id` | Yes | Target form id (e.g. `order-search`, `customer-search`) |

### valueinput attributes

| Attribute | Required | Description |
|-----------|----------|-------------|
| `type` | Yes | `string`, `int`, or `double` |
| `name` | Yes | Field name |
| `defaultvalue` | No | Default value |

### valueinput child elements

| Element | Description |
|---------|-------------|
| `<label xml:lang="...">` | Localized label (repeatable) |
| `<option>` | Dropdown option (repeatable, optional) |

## Complete Example

```xml
<?xml version="1.0" encoding="ISO-8859-1" ?>
<extensions xmlns="http://www.demandware.com/xml/bmmodules/2007-12-11"
            xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
            xsi:schemaLocation="http://www.demandware.com/xml/bmmodules/2007-12-11 bmext.xsd">

    <!-- Administration menu container -->
    <menuitem id="acme_id01" position="99999" site="false">
        <name xml:lang="x-default">ACME Tools</name>
        <short_description xml:lang="x-default">ACME admin tools</short_description>
        <icon>icons/acme.png</icon>
    </menuitem>

    <!-- Home page (floats to top of the section) -->
    <menuaction id="acme-home" menupath="acme_id01" position="-1" site="false">
        <name xml:lang="x-default">Home</name>
        <exec pipeline="ACME" node="Start"/>
        <sub-pipelines>
            <pipeline name="ACME-Start"/>
        </sub-pipelines>
        <icon>icons/acme.png</icon>
    </menuaction>

    <!-- Export action -->
    <menuaction id="acme-export" menupath="acme_id01" position="20" site="false">
        <name xml:lang="x-default">Product Export</name>
        <exec pipeline="ACME" node="Export"/>
        <sub-pipelines>
            <pipeline name="ACME-Export"/>
        </sub-pipelines>
        <parameters>
            <parameter name="defaultFormat" value="csv"/>
        </parameters>
    </menuaction>

    <!-- Action attached to an existing core menu (Site Preferences) -->
    <menuaction id="acme-pref" menupath="site-prefs" position="2000" site="true">
        <name xml:lang="x-default">ACME Preferences</name>
        <exec pipeline="ACME" node="Preferences"/>
        <sub-pipelines>
            <pipeline name="ACME-Preferences"/>
        </sub-pipelines>
    </menuaction>

    <!-- Permission-free endpoints (page JS, keepalive) -->
    <menuaction id="NoPermissionCheck" site="false">
        <name xml:lang="x-default">Dummy</name>
        <short_description xml:lang="x-default">Pipelines that do not require a permission check</short_description>
        <sub-pipelines>
            <pipeline name="ACME-Keepalive"/>
            <pipeline name="ACME-ServiceWorker"/>
        </sub-pipelines>
    </menuaction>

    <!-- Button on the order detail page -->
    <dialogaction id="acme-order-sync" xp_ref="OrderPage-OrderDetails" position="100">
        <name xml:lang="x-default">Sync Order</name>
        <exec pipeline="ACME" node="OrderSync"/>
        <parameters>
            <parameter name="OrderNo"/>
        </parameters>
        <menuactions>
            <menuaction-ref action-id="acme-home"/>
        </menuactions>
    </dialogaction>

    <!-- Order search form field -->
    <formextension id="order-search">
        <valueinput type="string" name="acmeOrderId">
            <label xml:lang="x-default">ACME Order ID</label>
        </valueinput>
    </formextension>

</extensions>
```

## Controller Template

```javascript
'use strict';

var ISML = require('dw/template/ISML');
var URLUtils = require('dw/web/URLUtils');
var Logger = require('dw/system/Logger');

var log = Logger.getLogger('bm', 'ACME');

/**
 * Dashboard — <exec pipeline="ACME" node="Start"/>
 */
function Start() {
    if (!session.userAuthenticated) {
        response.setStatus(403);
        return;
    }
    ISML.renderTemplate('extensions/acme/dashboard', {
        stats: calculateStats()
    });
}
Start.public = true;
module.exports.Start = Start;

/**
 * Process and redirect.
 */
function Process() {
    var action = request.httpParameterMap.action.stringValue;
    try {
        performAction(action);
        response.redirect(URLUtils.url('ACME-Start', 'message', 'Action completed'));
    } catch (e) {
        log.error('Action failed: {0}', e.message);
        response.redirect(URLUtils.url('ACME-Start', 'error', e.message));
    }
}
Process.public = true;
module.exports.Process = Process;

/**
 * Permission-free endpoint — registered under NoPermissionCheck.
 */
function Keepalive() {
    response.setContentType('application/json');
    response.writer.print('{"ok":true}');
}
Keepalive.public = true;
module.exports.Keepalive = Keepalive;
```

Every node referenced by `<exec>` or `<sub-pipelines>` must be exported and `.public = true`.

## ISML Template

Decorate with `application/MenuFrame` for standard BM chrome:

```html
<isdecorate template="application/MenuFrame">
    <isinclude template="inc/Modules"/>
    <div class="acme-dashboard">
        <h1>ACME Dashboard</h1>

        <isif condition="${request.httpParameterMap.message.submitted}">
            <div class="success">${request.httpParameterMap.message.stringValue}</div>
        </isif>

        <table class="data">
            <thead><tr><th>Metric</th><th>Value</th></tr></thead>
            <tbody>
                <isloop items="${pdict.stats}" var="stat">
                    <tr><td>${stat.label}</td><td>${stat.value}</td></tr>
                </isloop>
            </tbody>
        </table>

        <a href="${URLUtils.url('ACME-Process', 'action', 'refresh')}" class="button">Refresh</a>
    </div>
</isdecorate>
```

For a single-page-app style page, render one container template and mount your JS bundle into it instead of using `MenuFrame`.

## Core Business Manager Menu IDs

Reference these ids in `menupath` to attach a menu action to an existing BM menu. **Do not reuse them for your own `id`** — that hides your extension. (Source: platform `bm_extensions.xml` sample; subset of the most useful.)

### Site Menu (`site="true"`)

| Menu Item | `id` | Notable child actions (`id`) |
|-----------|------|------------------------------|
| Products and Catalogs | `prod-cat` | `prod-cat_products`, `prod-cat_catalogs`, `prod-cat_inventory`, `prod-cat_impex` |
| Content | `content` | `library_content_libraries`, `library_content`, `content_impex` |
| Search | `search` | `search_indexes`, `search_preferences`, `search_impex` |
| Online Marketing | `marketing` | `marketing_campaigns`, `marketing_promotions`, `marketing_slot`, `marketing_coupons` |
| Customers | `customers` | `customers_manage`, `customers_groups`, `customers_impex` |
| Custom Objects | `site-obj` | `site-obj_editor`, `site-obj_impex` |
| Ordering | `orders` | `orders_manage`, `orders_paymethods`, `orders_shipmethods`, `orders_export` |
| Analytics | `analytics` | `analytics_conversion`, `analytics_technical` |
| SEO | `seo` | `seo_aliases`, `seo_url-rules`, `seo_sitemaps` |
| Site Preferences | `site-prefs` | `site-prefs_custom_prefs`, `site-prefs_sitelocales`, `site-prefs_currencies` |

### Administration Menu (`site="false"`)

| Menu Item | `id` | Notable child actions (`id`) |
|-----------|------|------------------------------|
| Replication | `global-replication` | `global-data-rep-processes`, `global-code-rep-processes` |
| Organization | `organization` | `organization_users`, `organization_roles`, `webdavclient_permissions` |
| Sites | `sites` | `sites_manage`, `cdnManager` |
| Site Development | `studio` | `studio_code_deployment`, `studio_system_obj`, `studio_custom_obj`, `wapi_settings` |
| Global Preferences | `global-prefs` | `feature_switch_manager`, `global-prefs_locales`, `global-prefs_custom_prefs` |
| Operations | `operations` | `jobschedules`, `operations_services`, `operations_customlogging`, `operations_certificates` |

To list the rest, see the platform sample or inspect a live instance's menu structure.
