# Metadata XML Examples

Complete examples for common metadata import/export scenarios.

## Site Archive Structure

```
/site-archive/
    /meta/
        system-objecttype-extensions.xml
        custom-objecttype-definitions.xml
    /sites/
        /RefArch/
            preferences.xml
    /catalogs/
        /storefront-catalog/
            catalog.xml
    /libraries/
        /RefArchSharedLibrary/
            library.xml
```

## Adding Custom Attributes to Products

### Metadata (meta/system-objecttype-extensions.xml)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<metadata xmlns="http://www.demandware.com/xml/impex/metadata/2006-10-31">
    <type-extension type-id="Product">
        <custom-attribute-definitions>
            <!-- String attribute -->
            <attribute-definition attribute-id="manufacturerPartNumber">
                <display-name xml:lang="x-default">Manufacturer Part Number</display-name>
                <description xml:lang="x-default">MPN from manufacturer</description>
                <type>string</type>
                <mandatory-flag>false</mandatory-flag>
                <externally-managed-flag>true</externally-managed-flag>
                <min-length>0</min-length>
                <max-length>50</max-length>
            </attribute-definition>

            <!-- Enum attribute -->
            <attribute-definition attribute-id="warrantyType">
                <display-name xml:lang="x-default">Warranty Type</display-name>
                <type>enum-of-string</type>
                <mandatory-flag>false</mandatory-flag>
                <value-definitions>
                    <value-definition>
                        <value>none</value>
                        <display xml:lang="x-default">No Warranty</display>
                    </value-definition>
                    <value-definition default="true">
                        <value>standard</value>
                        <display xml:lang="x-default">Standard Warranty</display>
                    </value-definition>
                    <value-definition>
                        <value>extended</value>
                        <display xml:lang="x-default">Extended Warranty</display>
                    </value-definition>
                </value-definitions>
            </attribute-definition>

            <!-- Boolean attribute -->
            <attribute-definition attribute-id="requiresAssembly">
                <display-name xml:lang="x-default">Requires Assembly</display-name>
                <type>boolean</type>
                <mandatory-flag>false</mandatory-flag>
                <default-value>false</default-value>
            </attribute-definition>

            <!-- Double attribute -->
            <attribute-definition attribute-id="weight">
                <display-name xml:lang="x-default">Product Weight</display-name>
                <type>double</type>
                <mandatory-flag>false</mandatory-flag>
                <unit>kg</unit>
            </attribute-definition>

            <!-- Multi-select attribute -->
            <attribute-definition attribute-id="certifications">
                <display-name xml:lang="x-default">Certifications</display-name>
                <type>set-of-string</type>
                <mandatory-flag>false</mandatory-flag>
                <value-definitions>
                    <value-definition>
                        <value>energy-star</value>
                        <display xml:lang="x-default">Energy Star</display>
                    </value-definition>
                    <value-definition>
                        <value>ul-listed</value>
                        <display xml:lang="x-default">UL Listed</display>
                    </value-definition>
                    <value-definition>
                        <value>fda-approved</value>
                        <display xml:lang="x-default">FDA Approved</display>
                    </value-definition>
                </value-definitions>
            </attribute-definition>

            <!-- Localizable attribute -->
            <attribute-definition attribute-id="localDescription">
                <display-name xml:lang="x-default">Localized Description</display-name>
                <type>text</type>
                <localizable-flag>true</localizable-flag>
                <mandatory-flag>false</mandatory-flag>
            </attribute-definition>
        </custom-attribute-definitions>

        <group-definitions>
            <attribute-group group-id="ProductExtras">
                <display-name xml:lang="x-default">Product Extras</display-name>
                <attribute attribute-id="manufacturerPartNumber"/>
                <attribute attribute-id="warrantyType"/>
                <attribute attribute-id="requiresAssembly"/>
                <attribute attribute-id="weight"/>
                <attribute attribute-id="certifications"/>
                <attribute attribute-id="localDescription"/>
            </attribute-group>
        </group-definitions>
    </type-extension>
</metadata>
```

## Adding Custom Attributes to Orders

```xml
<?xml version="1.0" encoding="UTF-8"?>
<metadata xmlns="http://www.demandware.com/xml/impex/metadata/2006-10-31">
    <type-extension type-id="Order">
        <custom-attribute-definitions>
            <attribute-definition attribute-id="erpOrderId">
                <display-name xml:lang="x-default">ERP Order ID</display-name>
                <type>string</type>
                <externally-managed-flag>true</externally-managed-flag>
            </attribute-definition>
            <attribute-definition attribute-id="syncStatus">
                <display-name xml:lang="x-default">Sync Status</display-name>
                <type>enum-of-string</type>
                <value-definitions>
                    <value-definition default="true">
                        <value>pending</value>
                        <display xml:lang="x-default">Pending</display>
                    </value-definition>
                    <value-definition>
                        <value>synced</value>
                        <display xml:lang="x-default">Synced</display>
                    </value-definition>
                    <value-definition>
                        <value>failed</value>
                        <display xml:lang="x-default">Failed</display>
                    </value-definition>
                </value-definitions>
            </attribute-definition>
            <attribute-definition attribute-id="syncDate">
                <display-name xml:lang="x-default">Last Sync Date</display-name>
                <type>datetime</type>
                <externally-managed-flag>true</externally-managed-flag>
            </attribute-definition>
        </custom-attribute-definitions>

        <group-definitions>
            <attribute-group group-id="ERPIntegration">
                <display-name xml:lang="x-default">ERP Integration</display-name>
                <attribute attribute-id="erpOrderId"/>
                <attribute attribute-id="syncStatus"/>
                <attribute attribute-id="syncDate"/>
            </attribute-group>
        </group-definitions>
    </type-extension>
</metadata>
```

## Custom Object Definition

```xml
<?xml version="1.0" encoding="UTF-8"?>
<metadata xmlns="http://www.demandware.com/xml/impex/metadata/2006-10-31">
    <custom-type type-id="NewsletterSubscription">
        <display-name xml:lang="x-default">Newsletter Subscription</display-name>
        <description xml:lang="x-default">Email newsletter subscriptions</description>
        <staging-mode>source-to-target</staging-mode>
        <storage-scope>site</storage-scope>

        <key-definition attribute-id="email">
            <display-name xml:lang="x-default">Email Address</display-name>
            <type>string</type>
            <min-length>5</min-length>
            <max-length>256</max-length>
        </key-definition>

        <attribute-definitions>
            <attribute-definition attribute-id="firstName">
                <display-name xml:lang="x-default">First Name</display-name>
                <type>string</type>
                <mandatory-flag>false</mandatory-flag>
            </attribute-definition>
            <attribute-definition attribute-id="lastName">
                <display-name xml:lang="x-default">Last Name</display-name>
                <type>string</type>
                <mandatory-flag>false</mandatory-flag>
            </attribute-definition>
            <attribute-definition attribute-id="subscriptionDate">
                <display-name xml:lang="x-default">Subscription Date</display-name>
                <type>datetime</type>
                <mandatory-flag>true</mandatory-flag>
            </attribute-definition>
            <attribute-definition attribute-id="isActive">
                <display-name xml:lang="x-default">Active</display-name>
                <type>boolean</type>
                <default-value>true</default-value>
            </attribute-definition>
            <attribute-definition attribute-id="topics">
                <display-name xml:lang="x-default">Subscribed Topics</display-name>
                <type>set-of-string</type>
                <value-definitions>
                    <value-definition>
                        <value>promotions</value>
                        <display xml:lang="x-default">Promotions</display>
                    </value-definition>
                    <value-definition>
                        <value>new-arrivals</value>
                        <display xml:lang="x-default">New Arrivals</display>
                    </value-definition>
                    <value-definition>
                        <value>tips</value>
                        <display xml:lang="x-default">Tips & Tricks</display>
                    </value-definition>
                </value-definitions>
            </attribute-definition>
        </attribute-definitions>

        <group-definitions>
            <attribute-group group-id="SubscriptionInfo">
                <display-name xml:lang="x-default">Subscription Information</display-name>
                <attribute attribute-id="email" system="true"/>
                <attribute attribute-id="firstName"/>
                <attribute attribute-id="lastName"/>
                <attribute attribute-id="subscriptionDate"/>
                <attribute attribute-id="isActive"/>
                <attribute attribute-id="topics"/>
            </attribute-group>
        </group-definitions>
    </custom-type>
</metadata>
```

## Site Preferences

### Metadata

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
            <attribute-definition attribute-id="reviewServiceUrl">
                <display-name xml:lang="x-default">Review Service URL</display-name>
                <type>string</type>
            </attribute-definition>
            <attribute-definition attribute-id="reviewServiceApiKey">
                <display-name xml:lang="x-default">Review Service API Key</display-name>
                <type>password</type>
            </attribute-definition>
            <attribute-definition attribute-id="maxReviewsPerProduct">
                <display-name xml:lang="x-default">Max Reviews Per Product</display-name>
                <type>int</type>
                <default-value>10</default-value>
            </attribute-definition>
        </custom-attribute-definitions>
        <group-definitions>
            <attribute-group group-id="ReviewSettings">
                <display-name xml:lang="x-default">Review Settings</display-name>
                <attribute attribute-id="enableReviews"/>
                <attribute attribute-id="reviewServiceUrl"/>
                <attribute attribute-id="reviewServiceApiKey"/>
                <attribute attribute-id="maxReviewsPerProduct"/>
            </attribute-group>
        </group-definitions>
    </type-extension>
</metadata>
```

### Preference Values (sites/RefArch/preferences.xml)

Preferences can be set per instance type or for all instances:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<preferences xmlns="http://www.demandware.com/xml/impex/preferences/2007-03-31">
    <custom-preferences>
        <all-instances>
            <preference preference-id="maxReviewsPerProduct">20</preference>
        </all-instances>
        <development>
            <preference preference-id="enableReviews">true</preference>
            <preference preference-id="reviewServiceUrl">https://dev-reviews.example.com/api</preference>
        </development>
        <production>
            <preference preference-id="enableReviews">true</preference>
            <preference preference-id="reviewServiceUrl">https://reviews.example.com/api</preference>
        </production>
    </custom-preferences>
</preferences>
```

## Product Data with Custom Attributes

```xml
<?xml version="1.0" encoding="UTF-8"?>
<catalog xmlns="http://www.demandware.com/xml/impex/catalog/2006-10-31" catalog-id="storefront-catalog">
    <product product-id="SKU123">
        <display-name xml:lang="x-default">Example Product</display-name>
        <short-description xml:lang="x-default">Short description</short-description>
        <online-flag>true</online-flag>
        <custom-attributes>
            <custom-attribute attribute-id="manufacturerPartNumber">MPN-12345</custom-attribute>
            <custom-attribute attribute-id="warrantyType">extended</custom-attribute>
            <custom-attribute attribute-id="requiresAssembly">true</custom-attribute>
            <custom-attribute attribute-id="weight">2.5</custom-attribute>
            <custom-attribute attribute-id="certifications">energy-star</custom-attribute>
            <custom-attribute attribute-id="certifications">ul-listed</custom-attribute>
            <custom-attribute attribute-id="localDescription" xml:lang="en_US">US Description</custom-attribute>
            <custom-attribute attribute-id="localDescription" xml:lang="fr_FR">Description en Français</custom-attribute>
        </custom-attributes>
    </product>
</catalog>
```

## Custom Object Data

```xml
<?xml version="1.0" encoding="UTF-8"?>
<custom-objects xmlns="http://www.demandware.com/xml/impex/customobject/2006-10-31">
    <custom-object type-id="NewsletterSubscription" object-id="user@example.com">
        <object-attribute attribute-id="firstName">John</object-attribute>
        <object-attribute attribute-id="lastName">Doe</object-attribute>
        <object-attribute attribute-id="subscriptionDate">2024-01-15T10:30:00.000Z</object-attribute>
        <object-attribute attribute-id="isActive">true</object-attribute>
        <object-attribute attribute-id="topics">
            <value>promotions</value>
            <value>new-arrivals</value>
        </object-attribute>
    </custom-object>
</custom-objects>
```
