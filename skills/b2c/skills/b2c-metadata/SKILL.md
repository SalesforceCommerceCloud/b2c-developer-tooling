---
name: b2c-metadata
description: Define custom attributes, custom object types, and site preferences for B2C Commerce using metadata XML. Use this skill whenever the user needs to add a field to products, orders, or customers, create a new custom object type, set up site preferences, or extend the B2C data model. Also use when they ask about system-objecttype-extensions.xml, custom-objecttype-definitions.xml, attribute groups in Business Manager, or data model definitions — even if they just say "add a field to products" or "I need a new object type".
persona: developer
category: Platform Configuration & Metadata
tags: [metadata, custom-objects, site-config, business-manager]
---

# Metadata Skill

This skill guides you through working with site metadata XML for Salesforce B2C Commerce, including custom attributes, custom objects, and site preferences.

## Scope & grounding

This skill covers B2C Commerce metadata XML system (metadata.xsd namespace http://www.demandware.com/xml/impex/metadata/2006-10-31), including system-objecttype-extensions.xml, custom-objecttype-definitions.xml, and preferences.xml file structures. The examples show attribute types, enum value patterns, and Script API custom attribute access via dw.system.Site and ExtensibleObject.custom. Before answering questions that name specific B2C versions, XSD schema constraints, or emitting code the user will run, confirm current API shape and schema rules via `b2c docs search` and `b2c docs read` (CLI) or docs_search/docs_read (MCP). The canonical B2C Commerce documentation is the grounding source for metadata schema evolution, Script API signatures, and platform object types.

**Canonical docs:**
- `metadata` - metadata XML schema and structure
- `dw.system.Site` - Script API for site preferences
- `dw.system.SitePreferences` - Script API for site preferences access
- `dw.object.CustomAttributes` - Script API for custom attribute access
- `b2c-commerce/b2c-create-impex-folder-structure-ds` - site archive folder structure
- `b2c-commerce/b2c-exporting-active-data` - export guide
- `b2c-commerce/creatingcustombusinessobjectswithdemandwarebusinessmanager` - custom object creation
- `b2c-commerce/b2c-business-manager-extension-points` - Business Manager extension points

## Overview

Metadata defines the structure of your B2C Commerce data:

| Metadata Type | Purpose |
|---------------|---------|
| **System Object Extensions** | Add custom attributes to Products, Orders, Customers, etc. |
| **Custom Objects** | Define entirely new data types |
| **Site Preferences** | Site-specific configuration values |

## Site Archive Structure

Metadata is organized in site archives:

```
/site-archive
    /meta
        system-objecttype-extensions.xml    # Custom attributes on system objects
        custom-objecttype-definitions.xml   # Custom object definitions
    /sites
        /MySite
            preferences.xml                 # Site preferences
```

## System Object Extensions

Add custom attributes to existing system objects.

### Basic Structure

```xml
<?xml version="1.0" encoding="UTF-8"?>
<metadata xmlns="http://www.demandware.com/xml/impex/metadata/2006-10-31">
    <type-extension type-id="Product">
        <custom-attribute-definitions>
            <attribute-definition attribute-id="myCustomAttribute">
                <display-name xml:lang="x-default">My Custom Attribute</display-name>
                <type>string</type>
                <mandatory-flag>false</mandatory-flag>
                <externally-managed-flag>false</externally-managed-flag>
            </attribute-definition>
        </custom-attribute-definitions>
        <group-definitions>
            <attribute-group group-id="MyCustomGroup">
                <display-name xml:lang="x-default">My Custom Group</display-name>
                <attribute attribute-id="myCustomAttribute"/>
            </attribute-group>
        </group-definitions>
    </type-extension>
</metadata>
```

### Common System Objects

> Illustrative list; confirm current platform object types with `b2c docs read b2c-commerce/creatingcustombusinessobjectswithdemandwarebusinessmanager` and Business Manager object reference.

| Object Type | Use Case |
|-------------|----------|
| `Product` | Product attributes |
| `Order` | Order metadata |
| `Profile` | Customer profile data |
| `Basket` | Cart data |
| `SitePreferences` | Site configuration |
| `Category` | Category attributes |
| `Content` | Content asset attributes |

See [System Objects Reference](references/SYSTEM-OBJECTS.md) for more types. The full set of extensible system objects is defined by the B2C platform — check Business Manager and official docs for version-specific availability.

### Attribute Types

> Per metadata.xsd simpleType.AttributeType — confirm current schema with `b2c docs schema metadata`.

| Type | Description | Example |
|------|-------------|---------|
| `string` | Text (max 4000 chars) | SKU, descriptions |
| `text` | Long text (unlimited) | Rich content |
| `int` | Integer | Quantity, rank |
| `double` | Decimal | Percentage, weight |
| `boolean` | true/false | Flags |
| `date` | Date only | Birth date |
| `datetime` | Date and time | Timestamps |
| `email` | Email address | Contact email |
| `password` | Encrypted | API keys |
| `html` | HTML content | Rich text |
| `enum-of-string` | Single select | Status |
| `enum-of-int` | Numeric enum | Priority level |
| `set-of-string` | Multi-select | Tags |
| `set-of-int` | Numeric multi-select | Categories |
| `image` | Image reference | Thumbnails |

### Enum Value Definitions

> Illustrative of enum structure; confirm current schema ordering constraints with `b2c docs schema metadata`.

Enum types (`enum-of-string`, `enum-of-int`, `set-of-string`, `set-of-int`) require `value-definitions` with **display/value pairs**:

> **Element order matters.** The metadata.xsd schema requires `<display>` before `<value>` in each `<value-definition>` — see `b2c docs schema metadata` for current schema constraints.

```xml
<attribute-definition attribute-id="warrantyType">
    <display-name xml:lang="x-default">Warranty Type</display-name>
    <type>enum-of-string</type>
    <mandatory-flag>false</mandatory-flag>
    <value-definitions>
        <value-definition>
            <display xml:lang="x-default">No Warranty</display>
            <value>none</value>
        </value-definition>
        <value-definition>
            <display xml:lang="x-default">Limited Warranty</display>
            <value>limited</value>
        </value-definition>
        <value-definition>
            <display xml:lang="x-default">Full Warranty</display>
            <value>full</value>
        </value-definition>
    </value-definitions>
</attribute-definition>
```

| Element | Purpose |
|---------|---------|
| `<display>` | Human-readable label shown in Business Manager (must appear first) |
| `<value>` | The stored/API value (use lowercase, no spaces) |

## Product Custom Attribute Example

```xml
<?xml version="1.0" encoding="UTF-8"?>
<metadata xmlns="http://www.demandware.com/xml/impex/metadata/2006-10-31">
    <type-extension type-id="Product">
        <custom-attribute-definitions>
            <!-- Simple string attribute -->
            <attribute-definition attribute-id="vendorSKU">
                <display-name xml:lang="x-default">Vendor SKU</display-name>
                <type>string</type>
                <mandatory-flag>false</mandatory-flag>
                <externally-managed-flag>true</externally-managed-flag>
            </attribute-definition>

            <!-- Enum (dropdown) attribute -->
            <attribute-definition attribute-id="productCondition">
                <display-name xml:lang="x-default">Product Condition</display-name>
                <type>enum-of-string</type>
                <mandatory-flag>false</mandatory-flag>
                <value-definitions>
                    <value-definition>
                        <display xml:lang="x-default">New</display>
                        <value>new</value>
                    </value-definition>
                    <value-definition>
                        <display xml:lang="x-default">Refurbished</display>
                        <value>refurbished</value>
                    </value-definition>
                    <value-definition>
                        <display xml:lang="x-default">Used</display>
                        <value>used</value>
                    </value-definition>
                </value-definitions>
            </attribute-definition>

            <!-- Boolean attribute -->
            <attribute-definition attribute-id="isHazardous">
                <display-name xml:lang="x-default">Hazardous Material</display-name>
                <type>boolean</type>
                <mandatory-flag>false</mandatory-flag>
                <default-value>false</default-value>
            </attribute-definition>

            <!-- Multi-select attribute -->
            <attribute-definition attribute-id="productFeatures">
                <display-name xml:lang="x-default">Product Features</display-name>
                <type>set-of-string</type>
                <mandatory-flag>false</mandatory-flag>
                <value-definitions>
                    <value-definition>
                        <display xml:lang="x-default">Waterproof</display>
                        <value>waterproof</value>
                    </value-definition>
                    <value-definition>
                        <display xml:lang="x-default">Recyclable</display>
                        <value>recyclable</value>
                    </value-definition>
                </value-definitions>
            </attribute-definition>
        </custom-attribute-definitions>

        <group-definitions>
            <attribute-group group-id="CustomProductInfo">
                <display-name xml:lang="x-default">Custom Product Information</display-name>
                <attribute attribute-id="vendorSKU"/>
                <attribute attribute-id="productCondition"/>
                <attribute attribute-id="isHazardous"/>
                <attribute attribute-id="productFeatures"/>
            </attribute-group>
        </group-definitions>
    </type-extension>
</metadata>
```

## Custom Object Definitions

Create entirely new data types.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<metadata xmlns="http://www.demandware.com/xml/impex/metadata/2006-10-31">
    <custom-type type-id="StoreLocations">
        <display-name xml:lang="x-default">Store Locations</display-name>
        <description xml:lang="x-default">Physical store information</description>
        <staging-mode>source-to-target</staging-mode>
        <storage-scope>site</storage-scope>
        <key-definition attribute-id="storeId">
            <display-name xml:lang="x-default">Store ID</display-name>
            <type>string</type>
            <min-length>1</min-length>
        </key-definition>
        <attribute-definitions>
            <attribute-definition attribute-id="storeName">
                <display-name xml:lang="x-default">Store Name</display-name>
                <type>string</type>
                <mandatory-flag>true</mandatory-flag>
            </attribute-definition>
            <attribute-definition attribute-id="latitude">
                <display-name xml:lang="x-default">Latitude</display-name>
                <type>double</type>
            </attribute-definition>
            <attribute-definition attribute-id="longitude">
                <display-name xml:lang="x-default">Longitude</display-name>
                <type>double</type>
            </attribute-definition>
            <attribute-definition attribute-id="phone">
                <display-name xml:lang="x-default">Phone</display-name>
                <type>string</type>
            </attribute-definition>
            <attribute-definition attribute-id="isActive">
                <display-name xml:lang="x-default">Active</display-name>
                <type>boolean</type>
                <default-value>true</default-value>
            </attribute-definition>
        </attribute-definitions>
        <group-definitions>
            <attribute-group group-id="StoreInfo">
                <display-name xml:lang="x-default">Store Information</display-name>
                <attribute attribute-id="storeId" system="true"/>
                <attribute attribute-id="storeName"/>
                <attribute attribute-id="latitude"/>
                <attribute attribute-id="longitude"/>
                <attribute attribute-id="phone"/>
                <attribute attribute-id="isActive"/>
            </attribute-group>
        </group-definitions>
    </custom-type>
</metadata>
```

## Site Preferences

Site-specific configuration via custom attributes on SitePreferences.

### Metadata (system-objecttype-extensions.xml)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<metadata xmlns="http://www.demandware.com/xml/impex/metadata/2006-10-31">
    <type-extension type-id="SitePreferences">
        <custom-attribute-definitions>
            <attribute-definition attribute-id="enableFeatureX">
                <display-name xml:lang="x-default">Enable Feature X</display-name>
                <type>boolean</type>
                <default-value>false</default-value>
            </attribute-definition>
            <attribute-definition attribute-id="apiEndpoint">
                <display-name xml:lang="x-default">API Endpoint</display-name>
                <type>string</type>
            </attribute-definition>
            <attribute-definition attribute-id="maxItemsPerPage">
                <display-name xml:lang="x-default">Max Items Per Page</display-name>
                <type>int</type>
                <default-value>20</default-value>
            </attribute-definition>
        </custom-attribute-definitions>
        <group-definitions>
            <attribute-group group-id="CustomSettings">
                <display-name xml:lang="x-default">Custom Settings</display-name>
                <attribute attribute-id="enableFeatureX"/>
                <attribute attribute-id="apiEndpoint"/>
                <attribute attribute-id="maxItemsPerPage"/>
            </attribute-group>
        </group-definitions>
    </type-extension>
</metadata>
```

### Values (sites/MySite/preferences.xml)

Preferences can be set per instance type (development, staging, production) or for all instances:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<preferences xmlns="http://www.demandware.com/xml/impex/preferences/2007-03-31">
    <custom-preferences>
        <all-instances>
            <!-- Values that apply to all instance types -->
            <preference preference-id="maxItemsPerPage">25</preference>
        </all-instances>
        <development>
            <!-- Development-specific values -->
            <preference preference-id="enableFeatureX">true</preference>
            <preference preference-id="apiEndpoint">https://dev-api.example.com/v1</preference>
        </development>
        <staging>
            <preference preference-id="enableFeatureX">true</preference>
            <preference preference-id="apiEndpoint">https://staging-api.example.com/v1</preference>
        </staging>
        <production>
            <preference preference-id="enableFeatureX">false</preference>
            <preference preference-id="apiEndpoint">https://api.example.com/v1</preference>
        </production>
    </custom-preferences>
</preferences>
```

### Access in Code

> Illustrative code; confirm current API signatures and return types with `b2c docs read dw.system.Site`.

```javascript
// See dw.system.Site Script API docs for full method signatures and return types
var Site = require('dw/system/Site');

var enableFeatureX = Site.current.getCustomPreferenceValue('enableFeatureX');
var apiEndpoint = Site.current.getCustomPreferenceValue('apiEndpoint');
var maxItems = Site.current.getCustomPreferenceValue('maxItemsPerPage');
```

## Attribute Definition Options

> Illustrative of available flags; confirm current schema elements and deprecation status with `b2c docs schema metadata`.

```xml
<attribute-definition attribute-id="myAttribute">
    <display-name xml:lang="x-default">Display Name</display-name>
    <description xml:lang="x-default">Description for BM tooltip</description>
    <type>string</type>
    <localizable-flag>false</localizable-flag>
    <mandatory-flag>false</mandatory-flag>
    <externally-managed-flag>false</externally-managed-flag>
    <visible-flag>true</visible-flag>
    <site-specific-flag>false</site-specific-flag>
    <order-required-flag>false</order-required-flag>
    <searchable-flag>false</searchable-flag>
    <min-length>0</min-length>
    <max-length>256</max-length>
    <default-value>default</default-value>
    <select-mode>none</select-mode>
    <unit>kg</unit>
</attribute-definition>
```

| Flag | Purpose |
|------|---------|
| `localizable-flag` | Can have different values per locale |
| `mandatory-flag` | Required in BM |
| `externally-managed-flag` | Read-only in BM |
| `visible-flag` | Shown in BM |
| `site-specific-flag` | Different value per site |
| `order-required-flag` | Required for order export |
| `searchable-flag` | Indexed for search (deprecated per metadata.xsd — use search2.xsd SearchableAttributes instead) |

## Best Practices

1. **Use attribute groups** to organize in Business Manager
2. **Prefix custom attributes** with organization name (e.g., `acme_myAttribute`)
3. **Set externally-managed** for data imported from external systems
4. **Use enums over strings** for controlled vocabularies
5. **Document with descriptions** - they appear as tooltips

## Quick Reference

For canonical documentation, see the Scope & Grounding section above. The files below are derived quick-reference summaries.

- [System Objects Reference](references/SYSTEM-OBJECTS.md) - All system object types
- [XML Examples](references/XML-EXAMPLES.md) - Complete import/export examples
