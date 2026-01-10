<!-- prettier-ignore-start -->
# Class CustomerContextMgr

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.customer.CustomerContextMgr](dw.customer.CustomerContextMgr.md)

Provides helper methods for managing customer context, such as the Effective Time for which the customer is shopping
at



## Property Summary

| Property | Description |
| --- | --- |
| [effectiveTime](#effectivetime): [Date](TopLevel.Date.md) | Get the effective time associated with the customer. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| static [getEffectiveTime](dw.customer.CustomerContextMgr.md#geteffectivetime)() | Get the effective time associated with the customer. |
| static [setEffectiveTime](dw.customer.CustomerContextMgr.md#seteffectivetimedate)([Date](TopLevel.Date.md)) | Set the effective time for the customer. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### effectiveTime
- effectiveTime: [Date](TopLevel.Date.md)
  - : Get the effective time associated with the customer. By default, the effective time is null.


---

## Method Details

### getEffectiveTime()
- static getEffectiveTime(): [Date](TopLevel.Date.md)
  - : Get the effective time associated with the customer. By default, the effective time is null.

    **Returns:**
    - effective time. When null is returned it means no effective time is associated with the customer


---

### setEffectiveTime(Date)
- static setEffectiveTime(effectiveTime: [Date](TopLevel.Date.md)): void
  - : Set the effective time for the customer. Null is allowed to remove effective time from the customer.

    **Parameters:**
    - effectiveTime - the effective time.


---

<!-- prettier-ignore-end -->
