# Business Manager Extensions XML Reference

Complete reference for bm_extensions.xml schema.

## XSD Schema Reference

For the authoritative XML schema definition, use the `b2c` CLI (if installed):

```bash
# View the BM extensions XSD schema
b2c docs schema bmext
```

## File Location

```
/bm_cartridge_name
    /cartridge
        bm_extensions.xml    <-- Required file
```

## Root Element

```xml
<?xml version="1.0" encoding="UTF-8"?>
<extensions xmlns="http://www.demandware.com/xml/extensibility/2013-04-24">
    <!-- Menu items, menu actions, dialog actions, form extensions -->
</extensions>
```

## Menu Item Element

Creates navigation sections.

```xml
<menuitem id="my-tools"
          name="label.menu.name"
          site="false"
          position="100">
    <description>Optional description resource key</description>
    <short-description>Short description key</short-description>
    <icon path="icons/menu-icon.gif"/>
</menuitem>
```

### Attributes

| Attribute | Required | Default | Description |
|-----------|----------|---------|-------------|
| `id` | Yes | - | Unique identifier |
| `name` | Yes | - | Resource key for menu name |
| `site` | No | `true` | `true` = Site menu, `false` = Admin menu |
| `position` | No | 0 | Sort order (higher = appears higher) |

### Child Elements

| Element | Description |
|---------|-------------|
| `<description>` | Tooltip resource key |
| `<short-description>` | Short description resource key |
| `<icon path="..."/>` | Icon path relative to static folder |

## Menu Action Element

Creates functional pages/links.

```xml
<menuaction id="export-products"
            menupath="my-tools"
            name="label.action.export"
            position="10">
    <description>Export products resource key</description>
    <exec pipeline="ExportController" node="Start"/>
    <sub-pipelines>
        <pipeline name="ExportController"/>
        <pipeline name="ExportHelper"/>
    </sub-pipelines>
    <parameters>
        <parameter name="format" value="csv"/>
    </parameters>
    <icon path="icons/export.gif"/>
</menuaction>
```

### Attributes

| Attribute | Required | Default | Description |
|-----------|----------|---------|-------------|
| `id` | Yes | - | Unique identifier |
| `menupath` | No | - | Parent menu item ID |
| `name` | Yes | - | Resource key for action name |
| `position` | No | 0 | Sort order |

### Child Elements

| Element | Required | Description |
|---------|----------|-------------|
| `<exec>` | Yes | Controller/pipeline reference |
| `<sub-pipelines>` | Yes | All pipelines used by this action |
| `<description>` | No | Description resource key |
| `<parameters>` | No | Static parameters |
| `<icon>` | No | Icon path |

### exec Element

```xml
<!-- For controller -->
<exec pipeline="ControllerName" node="ActionName"/>

<!-- With conditional security -->
<exec pipeline="SecureController" node="Action" https="true"/>
```

| Attribute | Description |
|-----------|-------------|
| `pipeline` | Controller or pipeline name |
| `node` | Action/start node name |
| `https` | Require HTTPS (optional) |

## Dialog Action Element

Adds buttons/actions to existing BM pages.

```xml
<dialogaction id="custom-order-action"
              menuaction-ref="order-details"
              xp-ref="OrderPage-OrderDetails"
              position="10">
    <exec pipeline="OrderCustom" node="CustomAction"/>
    <parameters>
        <parameter name="OrderNo"/>
        <parameter name="OrderUUID"/>
    </parameters>
    <icon path="icons/action.gif"/>
    <extern>false</extern>
</dialogaction>
```

### Attributes

| Attribute | Required | Description |
|-----------|----------|-------------|
| `id` | Yes | Unique identifier |
| `menuaction-ref` | Yes | Parent menu action ID |
| `xp-ref` | Yes | Extension point ID |
| `position` | No | Sort order |

### Child Elements

| Element | Description |
|---------|-------------|
| `<exec>` | Controller/pipeline reference |
| `<parameters>` | Context parameters to pass |
| `<icon>` | Icon path |
| `<extern>` | `true` opens new window |

### Common Extension Points

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

Adds fields to existing BM forms.

```xml
<formextension id="order-search-custom">
    <valueinput type="string" name="customField" defaultvalue="">
        <label xml:lang="x-default">Custom Field</label>
        <label xml:lang="de">Benutzerdefiniertes Feld</label>
        <option>Option 1</option>
        <option>Option 2</option>
        <option>Option 3</option>
    </valueinput>

    <valueinput type="int" name="minQuantity">
        <label xml:lang="x-default">Minimum Quantity</label>
    </valueinput>

    <valueinput type="double" name="minPrice">
        <label xml:lang="x-default">Minimum Price</label>
    </valueinput>
</formextension>
```

### Attributes

| Attribute | Required | Description |
|-----------|----------|-------------|
| `id` | Yes | Unique identifier |

### valueinput Attributes

| Attribute | Description |
|-----------|-------------|
| `type` | `string`, `int`, `double` |
| `name` | Field name |
| `defaultvalue` | Default value |

### Child Elements

| Element | Description |
|---------|-------------|
| `<label xml:lang="...">` | Localized label (required) |
| `<option>` | Dropdown options (optional) |

## Complete Example

```xml
<?xml version="1.0" encoding="UTF-8"?>
<extensions xmlns="http://www.demandware.com/xml/extensibility/2013-04-24">

    <!-- Admin Menu Item -->
    <menuitem id="acme-tools"
              name="label.menu.acmetools"
              site="false"
              position="50">
        <description>label.menu.acmetools.desc</description>
        <icon path="icons/acme-menu.gif"/>
    </menuitem>

    <!-- Site Menu Item -->
    <menuitem id="acme-site-tools"
              name="label.menu.acmesitetools"
              site="true"
              position="50">
        <icon path="icons/acme-site.gif"/>
    </menuitem>

    <!-- Dashboard Action -->
    <menuaction id="acme-dashboard"
                menupath="acme-tools"
                name="label.action.dashboard"
                position="10">
        <exec pipeline="AcmeDashboard" node="Show"/>
        <sub-pipelines>
            <pipeline name="AcmeDashboard"/>
        </sub-pipelines>
        <icon path="icons/dashboard.gif"/>
    </menuaction>

    <!-- Export Action -->
    <menuaction id="acme-export"
                menupath="acme-tools"
                name="label.action.export"
                position="20">
        <description>label.action.export.desc</description>
        <exec pipeline="AcmeExport" node="Start"/>
        <sub-pipelines>
            <pipeline name="AcmeExport"/>
        </sub-pipelines>
        <parameters>
            <parameter name="defaultFormat" value="csv"/>
        </parameters>
    </menuaction>

    <!-- Site-specific Action -->
    <menuaction id="acme-site-report"
                menupath="acme-site-tools"
                name="label.action.sitereport"
                position="10">
        <exec pipeline="AcmeSiteReport" node="Generate"/>
        <sub-pipelines>
            <pipeline name="AcmeSiteReport"/>
        </sub-pipelines>
    </menuaction>

    <!-- Order Page Button -->
    <dialogaction id="acme-order-sync"
                  menuaction-ref="order-details"
                  xp-ref="OrderPage-OrderDetails"
                  position="100">
        <exec pipeline="AcmeOrderSync" node="Sync"/>
        <parameters>
            <parameter name="OrderNo"/>
        </parameters>
        <icon path="icons/sync.gif"/>
    </dialogaction>

    <!-- Product Page Button -->
    <dialogaction id="acme-product-validate"
                  menuaction-ref="product-details"
                  xp-ref="ProductPage-General"
                  position="50">
        <exec pipeline="AcmeProductValidate" node="Validate"/>
        <parameters>
            <parameter name="ProductID"/>
        </parameters>
    </dialogaction>

    <!-- Order Search Form Extension -->
    <formextension id="acme-order-search">
        <valueinput type="string" name="acmeOrderId">
            <label xml:lang="x-default">ACME Order ID</label>
            <label xml:lang="de">ACME Bestellnummer</label>
        </valueinput>
        <valueinput type="string" name="acmeSyncStatus">
            <label xml:lang="x-default">Sync Status</label>
            <option>All</option>
            <option>Synced</option>
            <option>Pending</option>
            <option>Failed</option>
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

var log = Logger.getLogger('bm', 'AcmeDashboard');

/**
 * Show dashboard
 */
exports.Show = function () {
    var stats = calculateStats();

    ISML.renderTemplate('extensions/acme/dashboard', {
        stats: stats,
        breadcrumbs: [
            { name: 'ACME Tools', url: null },
            { name: 'Dashboard', url: null }
        ]
    });
};
exports.Show.public = true;

/**
 * Process action and redirect
 */
exports.Process = function () {
    var params = request.httpParameterMap;
    var action = params.action.stringValue;

    try {
        // Process action
        var result = performAction(action);

        response.redirect(URLUtils.url('AcmeDashboard-Show',
            'success', 'true',
            'message', 'Action completed'
        ));
    } catch (e) {
        log.error('Action failed: ' + e.message);
        response.redirect(URLUtils.url('AcmeDashboard-Show',
            'error', 'true',
            'message', e.message
        ));
    }
};
exports.Process.public = true;
```

## ISML Template

```html
<!DOCTYPE html>
<html>
<head>
    <title>ACME Dashboard</title>
    <style>
        .dashboard { padding: 20px; }
        .stat-card { border: 1px solid #ccc; padding: 15px; margin: 10px; display: inline-block; }
        .stat-value { font-size: 24px; font-weight: bold; }
        .stat-label { color: #666; }
        .success { color: green; }
        .error { color: red; }
    </style>
</head>
<body>
    <div class="dashboard">
        <h1>ACME Dashboard</h1>

        <!-- Messages -->
        <isif condition="${request.httpParameterMap.success.stringValue == 'true'}">
            <div class="success">${request.httpParameterMap.message.stringValue}</div>
        </isif>
        <isif condition="${request.httpParameterMap.error.stringValue == 'true'}">
            <div class="error">${request.httpParameterMap.message.stringValue}</div>
        </isif>

        <!-- Stats -->
        <div class="stats">
            <isloop items="${pdict.stats}" var="stat">
                <div class="stat-card">
                    <div class="stat-value">${stat.value}</div>
                    <div class="stat-label">${stat.label}</div>
                </div>
            </isloop>
        </div>

        <!-- Actions -->
        <div class="actions">
            <a href="${URLUtils.url('AcmeDashboard-Process', 'action', 'refresh')}"
               class="button">Refresh Data</a>
        </div>
    </div>
</body>
</html>
```
