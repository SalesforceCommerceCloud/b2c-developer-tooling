# Metadata XML Patterns

Common XML patterns for site archive imports.

## XSD Schema Reference

For authoritative XML schema definitions, use the `b2c` CLI (if installed):

```bash
# View the metadata XSD schema
b2c docs schema metadata

# List all available schemas
b2c docs schema --list
```

## System Object Extensions

### Add String Attribute to Product

```xml
<?xml version="1.0" encoding="UTF-8"?>
<metadata xmlns="http://www.demandware.com/xml/impex/metadata/2006-10-31">
    <type-extension type-id="Product">
        <custom-attribute-definitions>
            <attribute-definition attribute-id="externalId">
                <display-name xml:lang="x-default">External ID</display-name>
                <type>string</type>
                <mandatory-flag>false</mandatory-flag>
                <externally-managed-flag>true</externally-managed-flag>
                <max-length>100</max-length>
            </attribute-definition>
        </custom-attribute-definitions>
        <group-definitions>
            <attribute-group group-id="ExternalData">
                <display-name xml:lang="x-default">External Data</display-name>
                <attribute attribute-id="externalId"/>
            </attribute-group>
        </group-definitions>
    </type-extension>
</metadata>
```

### Add Enum Attribute to Order

```xml
<?xml version="1.0" encoding="UTF-8"?>
<metadata xmlns="http://www.demandware.com/xml/impex/metadata/2006-10-31">
    <type-extension type-id="Order">
        <custom-attribute-definitions>
            <attribute-definition attribute-id="fulfillmentStatus">
                <display-name xml:lang="x-default">Fulfillment Status</display-name>
                <type>enum-of-string</type>
                <mandatory-flag>false</mandatory-flag>
                <value-definitions>
                    <value-definition default="true">
                        <value>pending</value>
                        <display xml:lang="x-default">Pending</display>
                    </value-definition>
                    <value-definition>
                        <value>processing</value>
                        <display xml:lang="x-default">Processing</display>
                    </value-definition>
                    <value-definition>
                        <value>shipped</value>
                        <display xml:lang="x-default">Shipped</display>
                    </value-definition>
                    <value-definition>
                        <value>delivered</value>
                        <display xml:lang="x-default">Delivered</display>
                    </value-definition>
                </value-definitions>
            </attribute-definition>
        </custom-attribute-definitions>
        <group-definitions>
            <attribute-group group-id="FulfillmentInfo">
                <display-name xml:lang="x-default">Fulfillment Info</display-name>
                <attribute attribute-id="fulfillmentStatus"/>
            </attribute-group>
        </group-definitions>
    </type-extension>
</metadata>
```

### Add Boolean Attribute to Customer Profile

```xml
<?xml version="1.0" encoding="UTF-8"?>
<metadata xmlns="http://www.demandware.com/xml/impex/metadata/2006-10-31">
    <type-extension type-id="Profile">
        <custom-attribute-definitions>
            <attribute-definition attribute-id="marketingOptIn">
                <display-name xml:lang="x-default">Marketing Opt-In</display-name>
                <type>boolean</type>
                <mandatory-flag>false</mandatory-flag>
                <default-value>false</default-value>
            </attribute-definition>
            <attribute-definition attribute-id="loyaltyMember">
                <display-name xml:lang="x-default">Loyalty Member</display-name>
                <type>boolean</type>
                <mandatory-flag>false</mandatory-flag>
                <default-value>false</default-value>
            </attribute-definition>
        </custom-attribute-definitions>
    </type-extension>
</metadata>
```

## Site Preferences

### Boolean Preference

```xml
<?xml version="1.0" encoding="UTF-8"?>
<metadata xmlns="http://www.demandware.com/xml/impex/metadata/2006-10-31">
    <type-extension type-id="SitePreferences">
        <custom-attribute-definitions>
            <attribute-definition attribute-id="enableReviews">
                <display-name xml:lang="x-default">Enable Product Reviews</display-name>
                <type>boolean</type>
                <default-value>true</default-value>
            </attribute-definition>
        </custom-attribute-definitions>
    </type-extension>
</metadata>
```

### String Preference (API Key)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<metadata xmlns="http://www.demandware.com/xml/impex/metadata/2006-10-31">
    <type-extension type-id="SitePreferences">
        <custom-attribute-definitions>
            <attribute-definition attribute-id="analyticsApiKey">
                <display-name xml:lang="x-default">Analytics API Key</display-name>
                <type>password</type>
            </attribute-definition>
            <attribute-definition attribute-id="analyticsEndpoint">
                <display-name xml:lang="x-default">Analytics Endpoint</display-name>
                <type>string</type>
            </attribute-definition>
        </custom-attribute-definitions>
        <group-definitions>
            <attribute-group group-id="AnalyticsSettings">
                <display-name xml:lang="x-default">Analytics Settings</display-name>
                <attribute attribute-id="analyticsApiKey"/>
                <attribute attribute-id="analyticsEndpoint"/>
            </attribute-group>
        </group-definitions>
    </type-extension>
</metadata>
```

### Preference Values

**sites/RefArch/preferences.xml:**

Preferences can be set per instance type:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<preferences xmlns="http://www.demandware.com/xml/impex/preferences/2007-03-31">
    <custom-preferences>
        <all-instances>
            <preference preference-id="enableReviews">true</preference>
        </all-instances>
        <development>
            <preference preference-id="analyticsEndpoint">https://dev-analytics.example.com/api</preference>
        </development>
        <production>
            <preference preference-id="analyticsEndpoint">https://analytics.example.com/api</preference>
        </production>
    </custom-preferences>
</preferences>
```

## Custom Object Types

### Simple Custom Object

```xml
<?xml version="1.0" encoding="UTF-8"?>
<metadata xmlns="http://www.demandware.com/xml/impex/metadata/2006-10-31">
    <custom-type type-id="Banner">
        <display-name xml:lang="x-default">Banner</display-name>
        <staging-mode>source-to-target</staging-mode>
        <storage-scope>site</storage-scope>
        <key-definition attribute-id="bannerId">
            <display-name xml:lang="x-default">Banner ID</display-name>
            <type>string</type>
            <min-length>1</min-length>
        </key-definition>
        <attribute-definitions>
            <attribute-definition attribute-id="title">
                <display-name xml:lang="x-default">Title</display-name>
                <type>string</type>
            </attribute-definition>
            <attribute-definition attribute-id="imageUrl">
                <display-name xml:lang="x-default">Image URL</display-name>
                <type>string</type>
            </attribute-definition>
            <attribute-definition attribute-id="linkUrl">
                <display-name xml:lang="x-default">Link URL</display-name>
                <type>string</type>
            </attribute-definition>
            <attribute-definition attribute-id="startDate">
                <display-name xml:lang="x-default">Start Date</display-name>
                <type>datetime</type>
            </attribute-definition>
            <attribute-definition attribute-id="endDate">
                <display-name xml:lang="x-default">End Date</display-name>
                <type>datetime</type>
            </attribute-definition>
            <attribute-definition attribute-id="isActive">
                <display-name xml:lang="x-default">Active</display-name>
                <type>boolean</type>
                <default-value>true</default-value>
            </attribute-definition>
        </attribute-definitions>
    </custom-type>
</metadata>
```

### Custom Object Data

**customobjects/Banner.xml:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<custom-objects xmlns="http://www.demandware.com/xml/impex/customobject/2006-10-31">
    <custom-object type-id="Banner" object-id="homepage-hero">
        <object-attribute attribute-id="title">Summer Sale</object-attribute>
        <object-attribute attribute-id="imageUrl">/images/banners/summer-sale.jpg</object-attribute>
        <object-attribute attribute-id="linkUrl">/sale</object-attribute>
        <object-attribute attribute-id="startDate">2024-06-01T00:00:00.000Z</object-attribute>
        <object-attribute attribute-id="endDate">2024-08-31T23:59:59.000Z</object-attribute>
        <object-attribute attribute-id="isActive">true</object-attribute>
    </custom-object>
    <custom-object type-id="Banner" object-id="promo-banner">
        <object-attribute attribute-id="title">Free Shipping</object-attribute>
        <object-attribute attribute-id="imageUrl">/images/banners/free-shipping.jpg</object-attribute>
        <object-attribute attribute-id="linkUrl">/shipping-info</object-attribute>
        <object-attribute attribute-id="isActive">true</object-attribute>
    </custom-object>
</custom-objects>
```

## Content Assets

**sites/RefArch/library/content/content.xml:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<library xmlns="http://www.demandware.com/xml/impex/library/2006-10-31">
    <content content-id="terms-conditions">
        <display-name xml:lang="x-default">Terms and Conditions</display-name>
        <online-flag>true</online-flag>
        <searchable-flag>false</searchable-flag>
        <custom-attributes>
            <custom-attribute attribute-id="body" xml:lang="x-default">
                <![CDATA[<h1>Terms and Conditions</h1><p>Content here...</p>]]>
            </custom-attribute>
        </custom-attributes>
    </content>
</library>
```

## Attribute Types Reference

| Type | XML Value | Example |
|------|-----------|---------|
| `string` | `<type>string</type>` | Text up to 4000 chars |
| `text` | `<type>text</type>` | Unlimited text |
| `int` | `<type>int</type>` | Whole numbers |
| `double` | `<type>double</type>` | Decimal numbers |
| `boolean` | `<type>boolean</type>` | true/false |
| `date` | `<type>date</type>` | Date only |
| `datetime` | `<type>datetime</type>` | Date and time |
| `email` | `<type>email</type>` | Email format |
| `password` | `<type>password</type>` | Encrypted |
| `html` | `<type>html</type>` | HTML content |
| `image` | `<type>image</type>` | Image reference |
| `enum-of-string` | `<type>enum-of-string</type>` | Single select |
| `set-of-string` | `<type>set-of-string</type>` | Multi-select |

## Complete Import Example

Directory structure for adding a custom integration:

```
integration-import/
├── meta/
│   ├── system-objecttype-extensions.xml
│   └── custom-objecttype-definitions.xml
├── sites/
│   └── RefArch/
│       └── preferences.xml
└── customobjects/
    └── IntegrationConfig.xml
```

**meta/system-objecttype-extensions.xml:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<metadata xmlns="http://www.demandware.com/xml/impex/metadata/2006-10-31">
    <type-extension type-id="SitePreferences">
        <custom-attribute-definitions>
            <attribute-definition attribute-id="integrationEnabled">
                <display-name xml:lang="x-default">Enable Integration</display-name>
                <type>boolean</type>
                <default-value>false</default-value>
            </attribute-definition>
        </custom-attribute-definitions>
    </type-extension>
    <type-extension type-id="Order">
        <custom-attribute-definitions>
            <attribute-definition attribute-id="integrationId">
                <display-name xml:lang="x-default">Integration ID</display-name>
                <type>string</type>
                <externally-managed-flag>true</externally-managed-flag>
            </attribute-definition>
        </custom-attribute-definitions>
    </type-extension>
</metadata>
```

**meta/custom-objecttype-definitions.xml:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<metadata xmlns="http://www.demandware.com/xml/impex/metadata/2006-10-31">
    <custom-type type-id="IntegrationConfig">
        <display-name xml:lang="x-default">Integration Configuration</display-name>
        <staging-mode>source-to-target</staging-mode>
        <storage-scope>organization</storage-scope>
        <key-definition attribute-id="configKey">
            <display-name xml:lang="x-default">Config Key</display-name>
            <type>string</type>
        </key-definition>
        <attribute-definitions>
            <attribute-definition attribute-id="endpoint">
                <display-name xml:lang="x-default">Endpoint</display-name>
                <type>string</type>
            </attribute-definition>
            <attribute-definition attribute-id="apiKey">
                <display-name xml:lang="x-default">API Key</display-name>
                <type>password</type>
            </attribute-definition>
        </attribute-definitions>
    </custom-type>
</metadata>
```

**sites/RefArch/preferences.xml:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<preferences xmlns="http://www.demandware.com/xml/impex/preferences/2007-03-31">
    <custom-preferences>
        <all-instances>
            <preference preference-id="integrationEnabled">true</preference>
        </all-instances>
    </custom-preferences>
</preferences>
```

**customobjects/IntegrationConfig.xml:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<custom-objects xmlns="http://www.demandware.com/xml/impex/customobject/2006-10-31">
    <custom-object type-id="IntegrationConfig" object-id="production">
        <object-attribute attribute-id="endpoint">https://api.integration.com/v1</object-attribute>
    </custom-object>
</custom-objects>
```

Import command:
```bash
b2c job import ./integration-import --wait --show-log
```
