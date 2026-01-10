# System Objects Reference

All extensible system object types in B2C Commerce.

## Product-Related

### Product

Product master, variant, and standard products.

```xml
<type-extension type-id="Product">
    <custom-attribute-definitions>
        <attribute-definition attribute-id="vendorSKU">
            <display-name xml:lang="x-default">Vendor SKU</display-name>
            <type>string</type>
        </attribute-definition>
    </custom-attribute-definitions>
</type-extension>
```

**Common custom attributes:** vendor IDs, compliance flags, external system references

### ProductLineItem

Line items in baskets and orders.

```xml
<type-extension type-id="ProductLineItem">
    <custom-attribute-definitions>
        <attribute-definition attribute-id="giftMessage">
            <display-name xml:lang="x-default">Gift Message</display-name>
            <type>text</type>
        </attribute-definition>
    </custom-attribute-definitions>
</type-extension>
```

### Category

Catalog categories.

```xml
<type-extension type-id="Category">
    <custom-attribute-definitions>
        <attribute-definition attribute-id="bannerImage">
            <display-name xml:lang="x-default">Banner Image</display-name>
            <type>image</type>
        </attribute-definition>
    </custom-attribute-definitions>
</type-extension>
```

## Order-Related

### Order

Placed orders.

```xml
<type-extension type-id="Order">
    <custom-attribute-definitions>
        <attribute-definition attribute-id="externalOrderId">
            <display-name xml:lang="x-default">External Order ID</display-name>
            <type>string</type>
            <externally-managed-flag>true</externally-managed-flag>
        </attribute-definition>
        <attribute-definition attribute-id="exportStatus">
            <display-name xml:lang="x-default">Export Status</display-name>
            <type>enum-of-string</type>
            <value-definitions>
                <value-definition>
                    <value>pending</value>
                    <display xml:lang="x-default">Pending</display>
                </value-definition>
                <value-definition>
                    <value>exported</value>
                    <display xml:lang="x-default">Exported</display>
                </value-definition>
            </value-definitions>
        </attribute-definition>
    </custom-attribute-definitions>
</type-extension>
```

### Basket

Active shopping carts.

```xml
<type-extension type-id="Basket">
    <custom-attribute-definitions>
        <attribute-definition attribute-id="quoteId">
            <display-name xml:lang="x-default">Quote ID</display-name>
            <type>string</type>
        </attribute-definition>
    </custom-attribute-definitions>
</type-extension>
```

### Shipment

Order/basket shipments.

```xml
<type-extension type-id="Shipment">
    <custom-attribute-definitions>
        <attribute-definition attribute-id="deliveryInstructions">
            <display-name xml:lang="x-default">Delivery Instructions</display-name>
            <type>text</type>
        </attribute-definition>
    </custom-attribute-definitions>
</type-extension>
```

## Customer-Related

### Profile

Customer profiles (registered customers).

```xml
<type-extension type-id="Profile">
    <custom-attribute-definitions>
        <attribute-definition attribute-id="loyaltyNumber">
            <display-name xml:lang="x-default">Loyalty Number</display-name>
            <type>string</type>
        </attribute-definition>
        <attribute-definition attribute-id="preferredContactMethod">
            <display-name xml:lang="x-default">Preferred Contact Method</display-name>
            <type>enum-of-string</type>
            <value-definitions>
                <value-definition>
                    <value>email</value>
                    <display xml:lang="x-default">Email</display>
                </value-definition>
                <value-definition>
                    <value>phone</value>
                    <display xml:lang="x-default">Phone</display>
                </value-definition>
                <value-definition>
                    <value>sms</value>
                    <display xml:lang="x-default">SMS</display>
                </value-definition>
            </value-definitions>
        </attribute-definition>
    </custom-attribute-definitions>
</type-extension>
```

### CustomerAddress

Customer address book entries.

```xml
<type-extension type-id="CustomerAddress">
    <custom-attribute-definitions>
        <attribute-definition attribute-id="addressType">
            <display-name xml:lang="x-default">Address Type</display-name>
            <type>enum-of-string</type>
            <value-definitions>
                <value-definition>
                    <value>residential</value>
                    <display xml:lang="x-default">Residential</display>
                </value-definition>
                <value-definition>
                    <value>commercial</value>
                    <display xml:lang="x-default">Commercial</display>
                </value-definition>
            </value-definitions>
        </attribute-definition>
    </custom-attribute-definitions>
</type-extension>
```

## Content-Related

### Content

Content assets.

```xml
<type-extension type-id="Content">
    <custom-attribute-definitions>
        <attribute-definition attribute-id="author">
            <display-name xml:lang="x-default">Author</display-name>
            <type>string</type>
        </attribute-definition>
        <attribute-definition attribute-id="publishDate">
            <display-name xml:lang="x-default">Publish Date</display-name>
            <type>datetime</type>
        </attribute-definition>
    </custom-attribute-definitions>
</type-extension>
```

### Folder

Content folders.

```xml
<type-extension type-id="Folder">
    <custom-attribute-definitions>
        <attribute-definition attribute-id="folderIcon">
            <display-name xml:lang="x-default">Folder Icon</display-name>
            <type>image</type>
        </attribute-definition>
    </custom-attribute-definitions>
</type-extension>
```

## Site Configuration

### SitePreferences

Site-level configuration.

```xml
<type-extension type-id="SitePreferences">
    <custom-attribute-definitions>
        <attribute-definition attribute-id="enableFeature">
            <display-name xml:lang="x-default">Enable Feature</display-name>
            <type>boolean</type>
            <default-value>false</default-value>
        </attribute-definition>
        <attribute-definition attribute-id="apiKey">
            <display-name xml:lang="x-default">API Key</display-name>
            <type>password</type>
        </attribute-definition>
    </custom-attribute-definitions>
</type-extension>
```

### OrganizationPreferences

Organization-wide configuration.

```xml
<type-extension type-id="OrganizationPreferences">
    <custom-attribute-definitions>
        <attribute-definition attribute-id="orgWideApiKey">
            <display-name xml:lang="x-default">Organization API Key</display-name>
            <type>password</type>
        </attribute-definition>
    </custom-attribute-definitions>
</type-extension>
```

## Other Objects

### Store

Physical store information.

```xml
<type-extension type-id="Store">
    <custom-attribute-definitions>
        <attribute-definition attribute-id="googlePlaceId">
            <display-name xml:lang="x-default">Google Place ID</display-name>
            <type>string</type>
        </attribute-definition>
    </custom-attribute-definitions>
</type-extension>
```

### GiftCertificate

Gift certificates.

```xml
<type-extension type-id="GiftCertificate">
    <custom-attribute-definitions>
        <attribute-definition attribute-id="purchasedBy">
            <display-name xml:lang="x-default">Purchased By</display-name>
            <type>string</type>
        </attribute-definition>
    </custom-attribute-definitions>
</type-extension>
```

### SourceCodeGroup

Source code groups for campaigns.

```xml
<type-extension type-id="SourceCodeGroup">
    <custom-attribute-definitions>
        <attribute-definition attribute-id="campaignType">
            <display-name xml:lang="x-default">Campaign Type</display-name>
            <type>string</type>
        </attribute-definition>
    </custom-attribute-definitions>
</type-extension>
```

## Complete List of System Objects

| Object Type | Description |
|-------------|-------------|
| `Basket` | Shopping cart |
| `Category` | Catalog category |
| `Content` | Content asset |
| `Coupon` | Coupon codes |
| `CustomerAddress` | Address book entry |
| `CustomerGroup` | Customer segments |
| `Folder` | Content folder |
| `GiftCertificate` | Gift certificate |
| `Order` | Placed order |
| `OrderAddress` | Order shipping/billing address |
| `OrganizationPreferences` | Org-level config |
| `PaymentInstrument` | Payment method |
| `PaymentTransaction` | Payment transaction |
| `Product` | Catalog product |
| `ProductLineItem` | Cart/order line item |
| `Profile` | Customer profile |
| `Shipment` | Order shipment |
| `ShippingLineItem` | Shipping charge |
| `SitePreferences` | Site-level config |
| `SourceCodeGroup` | Campaign source code |
| `Store` | Physical store |
