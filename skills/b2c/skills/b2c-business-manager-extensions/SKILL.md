---
name: b2c-business-manager-extensions
description: Build Business Manager extension cartridges with custom admin tools, menu items, and dialog actions. Use this skill whenever the user needs to create bm_* cartridges, add menu actions or dialog buttons in BM, configure bm_extensions.xml, or extend admin pages with form overlays. Also use when customizing the BM interface for back-office workflows -- even if they just say 'add a button to BM' or 'custom admin page'.
persona: developer
category: Backend & Cartridge Development
tags: [business-manager, controllers, isml, forms, metadata]
---

# Business Manager Extensions Skill

This skill guides you through creating Business Manager (BM) extension cartridges to customize the admin interface.

## Overview

BM extensions add custom functionality to Business Manager through a single `bm_extensions.xml` descriptor plus a controller that renders ISML pages:

| Extension Type | Purpose |
|----------------|---------|
| **Menu Items** | Add a navigation section (a container in the Admin or a site's menu) |
| **Menu Actions** | Add a functional link/page under a menu item — wired to a controller node |
| **Dialog Actions** | Add buttons to existing BM pages at defined extension points |
| **Form Extensions** | Add fields to existing BM search forms (order/customer search) |

## ⚠️ Schema essentials (read first)

These are the most common mistakes. The descriptor uses the **`bmmodules/2007-12-11`** schema (`bmext.xsd`), not the `extensibility/*` namespace.

- **Namespace** is `http://www.demandware.com/xml/bmmodules/2007-12-11`.
- `name`, `short_description`, and `description` are **child elements** with a required `xml:lang` attribute — NOT attributes and NOT resource keys. Localize by repeating the element per language. There is no `name="..."` attribute.
- `<icon>` is a plain string **element** holding a path (`<icon>icons/q.png</icon>`), NOT `<icon path="..."/>`.
- `position` is ascending: **lower numbers appear higher** in the menu. Core BM items run 2000–12000, so custom items typically use a large number (e.g. `99999`) to sit at the bottom, or `-1` to float a "Home" action to the top.
- The dialog-action extension-point attribute is **`xp_ref`** (underscore), and dialog actions link to a menu action via a child `<menuactions><menuaction-ref action-id="..."/></menuactions>` element — there is no `menuaction-ref` attribute.
- Use the file encoding `ISO-8859-1` to match platform samples.

To confirm any detail against the authoritative schema:

```bash
b2c docs schema bmext
```

## File Structure

```
/bm_my_extension
    /cartridge
        bm_extensions.xml              # Extension definitions (required)
        bm_my_extension.properties     # Cartridge properties (required)
        /controllers
            MyExtension.js             # Controller for menu actions
        /templates
            /default
                /extensions
                    mypage.isml        # Custom BM pages
        /static
            /default
                /icons
                    my-icon.png        # Menu icons
```

`bm_my_extension.properties` is a standard cartridge marker file:

```properties
## cartridge.properties for cartridge bm_my_extension
demandware.cartridges.bm_my_extension.multipleLanguageStorefront=true
demandware.cartridges.bm_my_extension.id=bm_my_extension
```

## Basic bm_extensions.xml

```xml
<?xml version="1.0" encoding="ISO-8859-1" ?>
<extensions xmlns="http://www.demandware.com/xml/bmmodules/2007-12-11"
            xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
            xsi:schemaLocation="http://www.demandware.com/xml/bmmodules/2007-12-11 bmext.xsd">

    <!-- Menu Item: a container in the Administration menu (site="false") -->
    <menuitem id="acme_id01" position="99999" site="false">
        <name xml:lang="x-default">ACME Tools</name>
        <short_description xml:lang="x-default">ACME admin tools</short_description>
        <description xml:lang="x-default">Tools and utilities from the ACME team</description>
        <icon>icons/acme.png</icon>
    </menuitem>

    <!-- Menu Action: a page under the menu item, wired to a controller node.
         position="-1" floats it to the top of the section. -->
    <menuaction id="acme-home" menupath="acme_id01" position="-1" site="false">
        <name xml:lang="x-default">Home</name>
        <short_description xml:lang="x-default">ACME Home</short_description>
        <exec pipeline="ACME" node="Start"/>
        <sub-pipelines>
            <pipeline name="ACME-Start"/>
        </sub-pipelines>
        <icon>icons/acme.png</icon>
    </menuaction>
</extensions>
```

`pipeline="ACME"` resolves to the controller `ACME.js`; `node="Start"` resolves to its exported `Start` function (which must be marked `Start.public = true`).

## Menu Items

Top-level navigation containers. `site="false"` places the item in the **Administration** menu; `site="true"` (the default) places it in a **site** menu.

```xml
<menuitem id="acme_id01" position="99999" site="false">
    <name xml:lang="x-default">ACME Tools</name>
    <name xml:lang="de">ACME Werkzeuge</name>
    <short_description xml:lang="x-default">ACME admin tools</short_description>
    <icon>icons/acme.png</icon>
</menuitem>
```

| Attribute | Required | Default | Description |
|-----------|----------|---------|-------------|
| `id` | Yes | - | Unique identifier. Prefix to avoid collisions with core BM IDs. |
| `site` | No | `true` | `true` = site menu, `false` = Administration menu |
| `position` | No | - | Sort order — **lower = higher**. Use a large value to sit at the bottom. |
| `type` | No | `BM` | `BM` or `CSC` (Customer Service Center) |

Child elements: `name` (required, localized), `short_description`, `description` (localized), `icon` (string path), `sldsIconName` (an SLDS utility icon name, preferred in the modern BM UI), `exec`.

## Menu Actions

Functional pages under a menu item. Wire each to a controller node via `<exec>` and register every controller node it uses in `<sub-pipelines>`.

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

| Attribute | Required | Default | Description |
|-----------|----------|---------|-------------|
| `id` | Yes | - | Unique identifier |
| `menupath` | No | - | Parent menu item `id` (or a core BM menu/item `id` to attach to it) |
| `site` | No | `true` | Must match the parent menu item |
| `position` | No | - | Sort order (lower = higher; `-1` floats to top) |
| `extern` | No | `false` | `true` opens the action in a new window |

Key child elements: `name` (required), `short_description`, `description`, `extended_description`, `exec`, `sub-pipelines`, `parameters`, `icon`.

> **Note:** `<exec>` takes only `pipeline` and `node` (both required) — there is no `https` attribute. The `apis`, `scapis`, and `required-features` elements in the schema are **not supported for custom menu actions**.

### The `NoPermissionCheck` idiom

BM checks that the logged-in user has permission for the menu action whose `sub-pipelines` register the requested controller node. For endpoints that must work **without** a module permission check — keepalive pings, service workers, polling/AJAX endpoints called by your page's JavaScript — register their nodes under a dedicated action with the reserved id `NoPermissionCheck` and **no `<exec>`**:

```xml
<menuaction id="NoPermissionCheck" site="false">
    <name xml:lang="x-default">Dummy</name>
    <short_description xml:lang="x-default">Holds pipelines that do not require a permission check</short_description>
    <sub-pipelines>
        <pipeline name="ACME-Keepalive"/>
        <pipeline name="ACME-ServiceWorker"/>
        <pipeline name="ACME-Poll"/>
    </sub-pipelines>
</menuaction>
```

Without this, those nodes 403 for users who haven't been granted the module. Only register nodes here that are genuinely safe to expose to any authenticated BM user.

## Dialog Actions

Add buttons to existing BM pages at a named extension point (`xp_ref`).

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

| Attribute | Required | Default | Description |
|-----------|----------|---------|-------------|
| `id` | Yes | - | Unique identifier |
| `xp_ref` | Yes | - | Extension point ID (note the underscore) |
| `position` | No | - | Sort order |
| `class` | No | - | Optional CSS class |
| `extern` | No | `false` | `true` opens in a new window |

Child elements: `name` (optional, localized), `exec` (**required**), `parameters`, `menuactions` (one or more `<menuaction-ref action-id="..."/>` linking to the menu action that owns the permission check). Dialog actions do **not** take an `icon` child.

Common extension points: `OrderPage-OrderDetails`, `ProductPage-General`, `ProductPage-Images`, `CustomerPage-Profile`, `ContentPage-General`, `CatalogPage-CategoryGeneral`.

## Form Extensions

Add fields to existing BM search forms (e.g. order or customer search).

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

`id` matches the target form (e.g. `order-search`, `customer-search`). `valueinput` requires `type` (`string`, `int`, or `double`) and `name`; `defaultvalue` is optional. Each `valueinput` has localized `<label>` children and optional `<option>` children for dropdowns.

## Controller Example

Controllers live in `controllers/` and export functions marked `.public = true`. Use `*/cartridge/...` requires so logic can be shared, and gate page nodes on the BM session.

```javascript
'use strict';

var ISML = require('dw/template/ISML');
var URLUtils = require('dw/web/URLUtils');
var Logger = require('dw/system/Logger');

var log = Logger.getLogger('bm', 'ACME');

/**
 * Render the dashboard. Wired to <exec pipeline="ACME" node="Start"/>.
 */
function Start() {
    // BM nodes should only be reachable in an authenticated BM session
    if (!session.userAuthenticated) {
        response.setStatus(403);
        return;
    }

    ISML.renderTemplate('extensions/acme/dashboard', {
        stats: getStats()
    });
}
Start.public = true;
module.exports.Start = Start;

/**
 * Process an action, then redirect back to the dashboard.
 */
function Process() {
    var action = request.httpParameterMap.action.stringValue;
    try {
        performAction(action);
        response.redirect(URLUtils.url('ACME-Start', 'message', 'Done'));
    } catch (e) {
        log.error('Action failed: {0}', e.message);
        response.redirect(URLUtils.url('ACME-Start', 'error', e.message));
    }
}
Process.public = true;
module.exports.Process = Process;

/**
 * Lightweight endpoint called by page JS — registered under NoPermissionCheck.
 */
function Keepalive() {
    response.setContentType('application/json');
    response.writer.print('{"ok":true}');
}
Keepalive.public = true;
module.exports.Keepalive = Keepalive;
```

Every node referenced by `<exec>` or `<sub-pipelines>` must be exported and `.public = true`, or BM returns 403.

## Template Example

BM templates render under `templates/default/extensions/`. Reference the `node` via `URLUtils.url('Controller-Node', ...)`.

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

        <a href="${URLUtils.url('ACME-Process', 'action', 'refresh')}" class="button">
            Refresh
        </a>
    </div>
</isdecorate>
```

Decorating with `application/MenuFrame` (and including `inc/Modules`) gives the page the standard BM chrome. A plain HTML document also works if you want a fully custom page (the modern qlabs-style approach mounts a single-page app into a container template).

## Attaching to Existing BM Menus

Instead of a new menu item, point a menu action's `menupath` at a core BM menu id. The full list of core ids is in the reference; the most useful:

| Menu | `id` | `site` |
|------|------|--------|
| Site Preferences | `site-prefs` | `true` |
| Merchant Tools › Products and Catalogs | `prod-cat` | `true` |
| Merchant Tools › Ordering | `orders` | `true` |
| Administration › Operations | `operations` | `false` |
| Administration › Site Development | `studio` | `false` |
| Administration › Global Preferences | `global-prefs` | `false` |

```xml
<menuaction id="acme-pref" menupath="site-prefs" position="2000" site="true">
    <name xml:lang="x-default">ACME Preferences</name>
    <exec pipeline="ACME" node="Preferences"/>
    <sub-pipelines>
        <pipeline name="ACME-Preferences"/>
    </sub-pipelines>
</menuaction>
```

> Reusing a **core BM `id`** for your own `menuitem`/`menuaction` hides your extension. Always use unique, prefixed ids and only reference core ids via `menupath`.

## Enabling the Extension

1. Add the cartridge to the **Business Manager site's** cartridge path:
   - Administration › Sites › Manage Sites › Business Manager › Settings
   - Add the cartridge id (e.g. `bm_my_extension`) to the cartridge path.
2. Grant the module to roles:
   - Administration › Organization › Roles › *(role)* › Business Manager Modules
   - Enable the custom module (it appears once the extension is on the path).
   - Nodes registered under `NoPermissionCheck` are reachable without this grant.

## Best Practices

1. **Validate against the XSD** with `b2c docs schema bmext` whenever unsure.
2. **Prefix all ids** to avoid colliding with (and accidentally hiding behind) core BM ids.
3. **Register every node** a page uses in `sub-pipelines`, or it 403s.
4. **Use `NoPermissionCheck`** only for endpoints that are safe for any authenticated BM user (keepalive, service workers, polling).
5. **Keep BM cartridges separate** from storefront cartridges.
6. **Gate page nodes** on `session.userAuthenticated`.
7. **Test with a non-admin role** to confirm your permission boundaries.

## Detailed Reference

- [Extensions XML Reference](references/EXTENSIONS-XML.md) — complete schema, every element/attribute, the `NoPermissionCheck` pattern, and the full core BM menu-id table.
