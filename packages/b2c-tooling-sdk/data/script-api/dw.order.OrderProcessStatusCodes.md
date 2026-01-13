<!-- prettier-ignore-start -->
# Class OrderProcessStatusCodes

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.order.OrderProcessStatusCodes](dw.order.OrderProcessStatusCodes.md)

Contains constants representing different status codes
for interacting with an order, such as cancelling
or editing an order.



## Constant Summary

| Constant | Description |
| --- | --- |
| [COUPON_INVALID](#coupon_invalid): [String](TopLevel.String.md) = "COUPON_INVALID" | Indicates that a coupon in the order is not valid. |
| [INVENTORY_RESERVATION_FAILED](#inventory_reservation_failed): [String](TopLevel.String.md) = "INVENTORY_RESERVATION_FAILED" | Indicates that no inventory could be reserved for the order. |
| [ORDER_ALREADY_CANCELLED](#order_already_cancelled): [String](TopLevel.String.md) = "ORDER_CANCELLED" | Indicates that the order could not be used because  it has already been cancelled. |
| [ORDER_ALREADY_EXPORTED](#order_already_exported): [String](TopLevel.String.md) = "ORDER_EXPORTED" | Indicates that the order could not be used because it  has already been exported. |
| [ORDER_ALREADY_FAILED](#order_already_failed): [String](TopLevel.String.md) = "ORDER_FAILED" | Indicates that the order could not be used because  it has already been failed. |
| [ORDER_ALREADY_REPLACED](#order_already_replaced): [String](TopLevel.String.md) = "ORDER_REPLACED" | Indicates that the order could not be used because  it has already been replaced. |
| [ORDER_CONTAINS_GC](#order_contains_gc): [String](TopLevel.String.md) = "CANCEL_ORDER_GC" | Indicates that the order could not be used because it  contains gift certificates. |
| [ORDER_NOT_CANCELLED](#order_not_cancelled): [String](TopLevel.String.md) = "ORDER_NOT_CANCELLED" | Indicates that the order could not be used because  it is not cancelled. |
| [ORDER_NOT_FAILED](#order_not_failed): [String](TopLevel.String.md) = "ORDER_NOT_FAILED" | Indicates that the order could not be used because  it has not been failed. |
| [ORDER_NOT_PLACED](#order_not_placed): [String](TopLevel.String.md) = "ORDER_NOT_PLACED" | Indicates that the order could not be used because  it has not been placed. |

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [OrderProcessStatusCodes](#orderprocessstatuscodes)() |  |

## Method Summary

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### COUPON_INVALID

- COUPON_INVALID: [String](TopLevel.String.md) = "COUPON_INVALID"
  - : Indicates that a coupon in the order is not valid.


---

### INVENTORY_RESERVATION_FAILED

- INVENTORY_RESERVATION_FAILED: [String](TopLevel.String.md) = "INVENTORY_RESERVATION_FAILED"
  - : Indicates that no inventory could be reserved for the order.


---

### ORDER_ALREADY_CANCELLED

- ORDER_ALREADY_CANCELLED: [String](TopLevel.String.md) = "ORDER_CANCELLED"
  - : Indicates that the order could not be used because
      it has already been cancelled.



---

### ORDER_ALREADY_EXPORTED

- ORDER_ALREADY_EXPORTED: [String](TopLevel.String.md) = "ORDER_EXPORTED"
  - : Indicates that the order could not be used because it
      has already been exported.



---

### ORDER_ALREADY_FAILED

- ORDER_ALREADY_FAILED: [String](TopLevel.String.md) = "ORDER_FAILED"
  - : Indicates that the order could not be used because
      it has already been failed.



---

### ORDER_ALREADY_REPLACED

- ORDER_ALREADY_REPLACED: [String](TopLevel.String.md) = "ORDER_REPLACED"
  - : Indicates that the order could not be used because
      it has already been replaced.



---

### ORDER_CONTAINS_GC

- ORDER_CONTAINS_GC: [String](TopLevel.String.md) = "CANCEL_ORDER_GC"
  - : Indicates that the order could not be used because it
      contains gift certificates.



---

### ORDER_NOT_CANCELLED

- ORDER_NOT_CANCELLED: [String](TopLevel.String.md) = "ORDER_NOT_CANCELLED"
  - : Indicates that the order could not be used because
      it is not cancelled.



---

### ORDER_NOT_FAILED

- ORDER_NOT_FAILED: [String](TopLevel.String.md) = "ORDER_NOT_FAILED"
  - : Indicates that the order could not be used because
      it has not been failed.



---

### ORDER_NOT_PLACED

- ORDER_NOT_PLACED: [String](TopLevel.String.md) = "ORDER_NOT_PLACED"
  - : Indicates that the order could not be used because
      it has not been placed.



---

## Constructor Details

### OrderProcessStatusCodes()
- OrderProcessStatusCodes()
  - : 


---

<!-- prettier-ignore-end -->
