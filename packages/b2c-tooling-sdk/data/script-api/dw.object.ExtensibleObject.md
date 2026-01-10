<!-- prettier-ignore-start -->
# Class ExtensibleObject

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.object.PersistentObject](dw.object.PersistentObject.md)
    - [dw.object.ExtensibleObject](dw.object.ExtensibleObject.md)

Base class for all persistent business objects in Commerce Cloud Digital that
are customizable through the metadata system. All objects in Digital
that have custom attributes derive from ExtensibleObject including
both system-defined and custom objects. The describe() method provides access
to the related object-type metadata. The method getCustom() is the central
point to retrieve and store the objects attribute values themselves.



## All Known Subclasses
[ActiveData](dw.object.ActiveData.md), [Basket](dw.order.Basket.md), [BonusDiscountLineItem](dw.order.BonusDiscountLineItem.md), [Campaign](dw.campaign.Campaign.md), [Catalog](dw.catalog.Catalog.md), [Category](dw.catalog.Category.md), [CategoryAssignment](dw.catalog.CategoryAssignment.md), [Content](dw.content.Content.md), [ContentSearchRefinementDefinition](dw.content.ContentSearchRefinementDefinition.md), [CouponLineItem](dw.order.CouponLineItem.md), [CustomObject](dw.object.CustomObject.md), [CustomerActiveData](dw.customer.CustomerActiveData.md), [CustomerAddress](dw.customer.CustomerAddress.md), [CustomerGroup](dw.customer.CustomerGroup.md), [CustomerPaymentInstrument](dw.customer.CustomerPaymentInstrument.md), [EncryptedObject](dw.customer.EncryptedObject.md), [Folder](dw.content.Folder.md), [GiftCertificate](dw.order.GiftCertificate.md), [GiftCertificateLineItem](dw.order.GiftCertificateLineItem.md), [Library](dw.content.Library.md), [LineItem](dw.order.LineItem.md), [LineItemCtnr](dw.order.LineItemCtnr.md), [Order](dw.order.Order.md), [OrderAddress](dw.order.OrderAddress.md), [OrderPaymentInstrument](dw.order.OrderPaymentInstrument.md), [OrganizationPreferences](dw.system.OrganizationPreferences.md), [PaymentCard](dw.order.PaymentCard.md), [PaymentInstrument](dw.order.PaymentInstrument.md), [PaymentMethod](dw.order.PaymentMethod.md), [PaymentProcessor](dw.order.PaymentProcessor.md), [PaymentTransaction](dw.order.PaymentTransaction.md), [PriceAdjustment](dw.order.PriceAdjustment.md), [PriceBook](dw.catalog.PriceBook.md), [Product](dw.catalog.Product.md), [ProductActiveData](dw.catalog.ProductActiveData.md), [ProductInventoryList](dw.catalog.ProductInventoryList.md), [ProductInventoryRecord](dw.catalog.ProductInventoryRecord.md), [ProductLineItem](dw.order.ProductLineItem.md), [ProductList](dw.customer.ProductList.md), [ProductListItem](dw.customer.ProductListItem.md), [ProductListItemPurchase](dw.customer.ProductListItemPurchase.md), [ProductListRegistrant](dw.customer.ProductListRegistrant.md), [ProductOption](dw.catalog.ProductOption.md), [ProductOptionValue](dw.catalog.ProductOptionValue.md), [ProductSearchRefinementDefinition](dw.catalog.ProductSearchRefinementDefinition.md), [ProductShippingLineItem](dw.order.ProductShippingLineItem.md), [Profile](dw.customer.Profile.md), [Promotion](dw.campaign.Promotion.md), [Recommendation](dw.catalog.Recommendation.md), [SearchRefinementDefinition](dw.catalog.SearchRefinementDefinition.md), [ServiceConfig](dw.svc.ServiceConfig.md), [ServiceCredential](dw.svc.ServiceCredential.md), [ServiceProfile](dw.svc.ServiceProfile.md), [Shipment](dw.order.Shipment.md), [ShippingLineItem](dw.order.ShippingLineItem.md), [ShippingMethod](dw.order.ShippingMethod.md), [SitePreferences](dw.system.SitePreferences.md), [SourceCodeGroup](dw.campaign.SourceCodeGroup.md), [Store](dw.catalog.Store.md), [StoreGroup](dw.catalog.StoreGroup.md), [Variant](dw.catalog.Variant.md), [VariationGroup](dw.catalog.VariationGroup.md)
## Property Summary

| Property | Description |
| --- | --- |
| [custom](#custom): [CustomAttributes](dw.object.CustomAttributes.md) `(read-only)` | Returns the custom attributes for this object. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [describe](dw.object.ExtensibleObject.md#describe)() | Returns the meta data of this object. |
| [getCustom](dw.object.ExtensibleObject.md#getcustom)() | Returns the custom attributes for this object. |

### Methods inherited from class PersistentObject

[getCreationDate](dw.object.PersistentObject.md#getcreationdate), [getLastModified](dw.object.PersistentObject.md#getlastmodified), [getUUID](dw.object.PersistentObject.md#getuuid)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### custom
- custom: [CustomAttributes](dw.object.CustomAttributes.md) `(read-only)`
  - : Returns the custom attributes for this object. The returned object is
      used for retrieving and storing attribute values. See
      [CustomAttributes](dw.object.CustomAttributes.md) for a detailed example of the syntax for
      working with custom attributes.



---

## Method Details

### describe()
- describe(): [ObjectTypeDefinition](dw.object.ObjectTypeDefinition.md)
  - : Returns the meta data of this object. If no meta data is available the
      method returns null. The returned ObjectTypeDefinition can be used to
      retrieve the metadata for any of the custom attributes.


    **Returns:**
    - the meta data of this object. If no meta data is available the
              method returns null.



---

### getCustom()
- getCustom(): [CustomAttributes](dw.object.CustomAttributes.md)
  - : Returns the custom attributes for this object. The returned object is
      used for retrieving and storing attribute values. See
      [CustomAttributes](dw.object.CustomAttributes.md) for a detailed example of the syntax for
      working with custom attributes.


    **Returns:**
    - the custom attributes for this object.


---

<!-- prettier-ignore-end -->
