<!-- prettier-ignore-start -->
# Class TrackingRef

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.order.TrackingRef](dw.order.TrackingRef.md)

Provides basic information about the [TrackingInfo](dw.order.TrackingInfo.md) a
[ShippingOrderItem](dw.order.ShippingOrderItem.md) is contained.



## Property Summary

| Property | Description |
| --- | --- |
| [quantity](#quantity): [Quantity](dw.value.Quantity.md) | Gets the quantity, the shipping order item is assigned to the tracking  info. |
| [shippingOrderItem](#shippingorderitem): [ShippingOrderItem](dw.order.ShippingOrderItem.md) `(read-only)` | Gets the shipping order item which is assigned to the tracking info. |
| [trackingInfo](#trackinginfo): [TrackingInfo](dw.order.TrackingInfo.md) `(read-only)` | Gets the tracking info, the shipping order item is assigned to. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getQuantity](dw.order.TrackingRef.md#getquantity)() | Gets the quantity, the shipping order item is assigned to the tracking  info. |
| [getShippingOrderItem](dw.order.TrackingRef.md#getshippingorderitem)() | Gets the shipping order item which is assigned to the tracking info. |
| [getTrackingInfo](dw.order.TrackingRef.md#gettrackinginfo)() | Gets the tracking info, the shipping order item is assigned to. |
| [setQuantity](dw.order.TrackingRef.md#setquantityquantity)([Quantity](dw.value.Quantity.md)) | Sets the quantity, the shipping order item is assigned to the tracking  info. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### quantity
- quantity: [Quantity](dw.value.Quantity.md)
  - : Gets the quantity, the shipping order item is assigned to the tracking
      info.



---

### shippingOrderItem
- shippingOrderItem: [ShippingOrderItem](dw.order.ShippingOrderItem.md) `(read-only)`
  - : Gets the shipping order item which is assigned to the tracking info.


---

### trackingInfo
- trackingInfo: [TrackingInfo](dw.order.TrackingInfo.md) `(read-only)`
  - : Gets the tracking info, the shipping order item is assigned to.


---

## Method Details

### getQuantity()
- getQuantity(): [Quantity](dw.value.Quantity.md)
  - : Gets the quantity, the shipping order item is assigned to the tracking
      info.


    **Returns:**
    - the quantity the shipping order item is assigned to the tracking
              info.



---

### getShippingOrderItem()
- getShippingOrderItem(): [ShippingOrderItem](dw.order.ShippingOrderItem.md)
  - : Gets the shipping order item which is assigned to the tracking info.

    **Returns:**
    - the shipping order item


---

### getTrackingInfo()
- getTrackingInfo(): [TrackingInfo](dw.order.TrackingInfo.md)
  - : Gets the tracking info, the shipping order item is assigned to.

    **Returns:**
    - the tracking info


---

### setQuantity(Quantity)
- setQuantity(quantity: [Quantity](dw.value.Quantity.md)): void
  - : Sets the quantity, the shipping order item is assigned to the tracking
      info.


    **Parameters:**
    - quantity - the quantity, the shipping order item is assigned to the             tracking info.


---

<!-- prettier-ignore-end -->
