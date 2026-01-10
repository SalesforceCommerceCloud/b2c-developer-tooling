<!-- prettier-ignore-start -->
# Class PersistentObject

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.object.PersistentObject](dw.object.PersistentObject.md)

Common base class for all objects in Commerce Cloud Digital that have an
identity and can be stored and retrieved.  Each entity is identified by
a unique universal identifier (a UUID).



## All Known Subclasses
[ABTest](dw.campaign.ABTest.md), [ABTestSegment](dw.campaign.ABTestSegment.md), [ActiveData](dw.object.ActiveData.md), [Basket](dw.order.Basket.md), [BonusDiscountLineItem](dw.order.BonusDiscountLineItem.md), [Campaign](dw.campaign.Campaign.md), [Catalog](dw.catalog.Catalog.md), [Category](dw.catalog.Category.md), [CategoryAssignment](dw.catalog.CategoryAssignment.md), [Content](dw.content.Content.md), [ContentSearchRefinementDefinition](dw.content.ContentSearchRefinementDefinition.md), [Coupon](dw.campaign.Coupon.md), [CouponLineItem](dw.order.CouponLineItem.md), [CustomObject](dw.object.CustomObject.md), [CustomerActiveData](dw.customer.CustomerActiveData.md), [CustomerAddress](dw.customer.CustomerAddress.md), [CustomerGroup](dw.customer.CustomerGroup.md), [CustomerPaymentInstrument](dw.customer.CustomerPaymentInstrument.md), [EncryptedObject](dw.customer.EncryptedObject.md), [ExtensibleObject](dw.object.ExtensibleObject.md), [Folder](dw.content.Folder.md), [GiftCertificate](dw.order.GiftCertificate.md), [GiftCertificateLineItem](dw.order.GiftCertificateLineItem.md), [Library](dw.content.Library.md), [LineItem](dw.order.LineItem.md), [LineItemCtnr](dw.order.LineItemCtnr.md), [Order](dw.order.Order.md), [OrderAddress](dw.order.OrderAddress.md), [OrderPaymentInstrument](dw.order.OrderPaymentInstrument.md), [OrganizationPreferences](dw.system.OrganizationPreferences.md), [PaymentCard](dw.order.PaymentCard.md), [PaymentInstrument](dw.order.PaymentInstrument.md), [PaymentMethod](dw.order.PaymentMethod.md), [PaymentProcessor](dw.order.PaymentProcessor.md), [PaymentTransaction](dw.order.PaymentTransaction.md), [PriceAdjustment](dw.order.PriceAdjustment.md), [PriceBook](dw.catalog.PriceBook.md), [Product](dw.catalog.Product.md), [ProductActiveData](dw.catalog.ProductActiveData.md), [ProductInventoryList](dw.catalog.ProductInventoryList.md), [ProductInventoryRecord](dw.catalog.ProductInventoryRecord.md), [ProductLineItem](dw.order.ProductLineItem.md), [ProductList](dw.customer.ProductList.md), [ProductListItem](dw.customer.ProductListItem.md), [ProductListItemPurchase](dw.customer.ProductListItemPurchase.md), [ProductListRegistrant](dw.customer.ProductListRegistrant.md), [ProductOption](dw.catalog.ProductOption.md), [ProductOptionValue](dw.catalog.ProductOptionValue.md), [ProductSearchRefinementDefinition](dw.catalog.ProductSearchRefinementDefinition.md), [ProductShippingLineItem](dw.order.ProductShippingLineItem.md), [Profile](dw.customer.Profile.md), [Promotion](dw.campaign.Promotion.md), [Recommendation](dw.catalog.Recommendation.md), [SearchRefinementDefinition](dw.catalog.SearchRefinementDefinition.md), [ServiceConfig](dw.svc.ServiceConfig.md), [ServiceCredential](dw.svc.ServiceCredential.md), [ServiceProfile](dw.svc.ServiceProfile.md), [Shipment](dw.order.Shipment.md), [ShippingLineItem](dw.order.ShippingLineItem.md), [ShippingMethod](dw.order.ShippingMethod.md), [SitePreferences](dw.system.SitePreferences.md), [SortingOption](dw.catalog.SortingOption.md), [SortingRule](dw.catalog.SortingRule.md), [SourceCodeGroup](dw.campaign.SourceCodeGroup.md), [Store](dw.catalog.Store.md), [StoreGroup](dw.catalog.StoreGroup.md), [Variant](dw.catalog.Variant.md), [VariationGroup](dw.catalog.VariationGroup.md)
## Property Summary

| Property | Description |
| --- | --- |
| [UUID](#uuid): [String](TopLevel.String.md) `(read-only)` | Returns the unique universal identifier for this object. |
| [creationDate](#creationdate): [Date](TopLevel.Date.md) `(read-only)` | Returns the date that this object was created. |
| [lastModified](#lastmodified): [Date](TopLevel.Date.md) `(read-only)` | Returns the date that this object was last modified. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getCreationDate](dw.object.PersistentObject.md#getcreationdate)() | Returns the date that this object was created. |
| [getLastModified](dw.object.PersistentObject.md#getlastmodified)() | Returns the date that this object was last modified. |
| [getUUID](dw.object.PersistentObject.md#getuuid)() | Returns the unique universal identifier for this object. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### UUID
- UUID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the unique universal identifier for this object.


---

### creationDate
- creationDate: [Date](TopLevel.Date.md) `(read-only)`
  - : Returns the date that this object was created.


---

### lastModified
- lastModified: [Date](TopLevel.Date.md) `(read-only)`
  - : Returns the date that this object was last modified.


---

## Method Details

### getCreationDate()
- getCreationDate(): [Date](TopLevel.Date.md)
  - : Returns the date that this object was created.

    **Returns:**
    - the date that this object was created.


---

### getLastModified()
- getLastModified(): [Date](TopLevel.Date.md)
  - : Returns the date that this object was last modified.

    **Returns:**
    - the date that this object was last modified.


---

### getUUID()
- getUUID(): [String](TopLevel.String.md)
  - : Returns the unique universal identifier for this object.

    **Returns:**
    - the unique universal identifier for this object.


---

<!-- prettier-ignore-end -->
