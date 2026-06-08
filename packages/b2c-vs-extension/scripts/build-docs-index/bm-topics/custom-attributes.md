---
id: custom-attributes
title: Custom Attributes
category: data-model
tags: [custom, attribute, system-object, data-model, schema]
---

Every system object (Product, Customer, Order, Site, …) supports developer-
defined custom attributes. They are the safe extension point for storing
business-specific data.

## Where to manage

`Administration > Site Development > System Object Types > <ObjectType> >
Attribute Definitions`

## Defining via metadata import

Production-grade workflow uses XML metadata files imported via Site Import:

```xml
<type-extension type-id="Product">
  <custom-attribute-definitions>
    <attribute-definition attribute-id="bundleHandling">
      <display-name xml:lang="x-default">Bundle Handling</display-name>
      <type>enum-of-string</type>
      <localizable-flag>false</localizable-flag>
      <mandatory-flag>false</mandatory-flag>
      <visible-flag>true</visible-flag>
      <field-length>0</field-length>
      <value-definitions>
        <value-definition>
          <display><value>Ship Together</value></display>
          <value>together</value>
        </value-definition>
        <value-definition>
          <display><value>Ship Separately</value></display>
          <value>separate</value>
        </value-definition>
      </value-definitions>
    </attribute-definition>
  </custom-attribute-definitions>
</type-extension>
```

## Reading and writing from script

```javascript
var product = ProductMgr.getProduct('SKU-123');
var handling = product.custom.bundleHandling;

require('dw/system/Transaction').wrap(function () {
  product.custom.bundleHandling = 'separate';
});
```

Writes must occur inside a `Transaction`.

## Tips

- Prefer **enum-of-string** with explicit values over free-text — limits churn
  and supports localization.
- Check **searchable** and **system** flags carefully — they affect index
  behavior and BM visibility.
- Custom attributes deploy via **site import**, the same as preferences and
  other metadata.
