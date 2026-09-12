# Archive Workflows

## Common Workflows

### Adding a Custom Attribute to Products

1. Create the metadata XML file:

**meta/system-objecttype-extensions.xml:**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<metadata xmlns="http://www.demandware.com/xml/impex/metadata/2006-10-31">
    <type-extension type-id="Product">
        <custom-attribute-definitions>
            <attribute-definition attribute-id="vendorSKU">
                <display-name xml:lang="x-default">Vendor SKU</display-name>
                <type>string</type>
                <mandatory-flag>false</mandatory-flag>
                <externally-managed-flag>true</externally-managed-flag>
            </attribute-definition>
        </custom-attribute-definitions>
        <group-definitions>
            <attribute-group group-id="CustomAttributes">
                <display-name xml:lang="x-default">Custom Attributes</display-name>
                <attribute attribute-id="vendorSKU"/>
            </attribute-group>
        </group-definitions>
    </type-extension>
</metadata>
```

2. Create the directory structure:

```
my-import/
└── meta/
    └── system-objecttype-extensions.xml
```

3. Import:

```bash
b2c job import ./my-import
```

### Adding Site Preferences

1. Create metadata for the preference:

**meta/system-objecttype-extensions.xml:**

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
        </custom-attribute-definitions>
    </type-extension>
</metadata>
```

2. Create preference values:

**sites/MySite/preferences.xml:**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<preferences xmlns="http://www.demandware.com/xml/impex/preferences/2007-03-31">
    <custom-preferences>
        <all-instances>
            <preference preference-id="enableFeatureX">true</preference>
        </all-instances>
    </custom-preferences>
</preferences>
```

3. Directory structure:

```
my-import/
├── meta/
│   └── system-objecttype-extensions.xml
└── sites/
    └── MySite/
        └── preferences.xml
```

4. Import:

```bash
b2c job import ./my-import
```

### Creating a Custom Object Type

1. Define the custom object:

**meta/custom-objecttype-definitions.xml:**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<metadata xmlns="http://www.demandware.com/xml/impex/metadata/2006-10-31">
    <custom-type type-id="APIConfiguration">
        <display-name xml:lang="x-default">API Configuration</display-name>
        <staging-mode>source-to-target</staging-mode>
        <storage-scope>site</storage-scope>
        <key-definition attribute-id="configId">
            <display-name xml:lang="x-default">Config ID</display-name>
            <type>string</type>
            <min-length>1</min-length>
        </key-definition>
        <attribute-definitions>
            <attribute-definition attribute-id="endpoint">
                <display-name xml:lang="x-default">API Endpoint</display-name>
                <type>string</type>
            </attribute-definition>
            <attribute-definition attribute-id="apiKey">
                <display-name xml:lang="x-default">API Key</display-name>
                <type>password</type>
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

2. Import:

```bash
b2c job import ./my-import
```

### Importing Custom Object Data

**customobjects/APIConfiguration.xml:**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<custom-objects xmlns="http://www.demandware.com/xml/impex/customobject/2006-10-31">
    <custom-object type-id="APIConfiguration" object-id="payment-gateway">
        <object-attribute attribute-id="endpoint">https://api.payment.com/v2</object-attribute>
        <object-attribute attribute-id="isActive">true</object-attribute>
    </custom-object>
</custom-objects>
```

## Site Archive Structure

```
site-archive/
├── services.xml                           # Service configurations (credentials, profiles, services)
├── meta/
│   ├── system-objecttype-extensions.xml   # Custom attributes on system objects
│   └── custom-objecttype-definitions.xml  # Custom object type definitions
├── sites/
│   └── {SiteID}/
│       ├── preferences.xml                # Site preference values
│       └── library/
│           └── content/
│               └── content.xml            # Content assets
├── catalogs/
│   └── {CatalogID}/
│       └── catalog.xml                    # Products and categories
├── pricebooks/
│   └── {PriceBookID}/
│       └── pricebook.xml                  # Price definitions
├── customobjects/
│   └── {ObjectTypeID}.xml                 # Custom object instances
└── inventory-lists/
    └── {InventoryListID}/
        └── inventory.xml                  # Inventory records
```
