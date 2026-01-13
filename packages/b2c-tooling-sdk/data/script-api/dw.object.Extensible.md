<!-- prettier-ignore-start -->
# Class Extensible

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.object.Extensible](dw.object.Extensible.md)

Base class alternative to ExtensibleObject for objects customizable through the metadata system.
Similar to ExtensibleObject: the [describe()](dw.object.Extensible.md#describe) method provides access to the related object-type metadata.
The [getCustom()](dw.object.Extensible.md#getcustom) method is the central point to retrieve and store the objects attribute
values themselves.



## All Known Subclasses
[AbstractItem](dw.order.AbstractItem.md), [AbstractItemCtnr](dw.order.AbstractItemCtnr.md), [Appeasement](dw.order.Appeasement.md), [AppeasementItem](dw.order.AppeasementItem.md), [Invoice](dw.order.Invoice.md), [InvoiceItem](dw.order.InvoiceItem.md), [Return](dw.order.Return.md), [ReturnCase](dw.order.ReturnCase.md), [ReturnCaseItem](dw.order.ReturnCaseItem.md), [ReturnItem](dw.order.ReturnItem.md), [ShippingOrder](dw.order.ShippingOrder.md), [ShippingOrderItem](dw.order.ShippingOrderItem.md), [TrackingInfo](dw.order.TrackingInfo.md)
## Property Summary

| Property | Description |
| --- | --- |
| [custom](#custom): [CustomAttributes](dw.object.CustomAttributes.md) `(read-only)` | Returns the custom attributes for this object. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [describe](dw.object.Extensible.md#describe)() | Returns the meta data of this object. |
| [getCustom](dw.object.Extensible.md#getcustom)() | Returns the custom attributes for this object. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### custom
- custom: [CustomAttributes](dw.object.CustomAttributes.md) `(read-only)`
  - : Returns the custom attributes for this object.


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
  - : Returns the custom attributes for this object.

    **Returns:**
    - the custom attributes for this object.


---

<!-- prettier-ignore-end -->
