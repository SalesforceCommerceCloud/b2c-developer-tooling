<!-- prettier-ignore-start -->
# Class PinterestOrder

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.extensions.pinterest.PinterestOrder](dw.extensions.pinterest.PinterestOrder.md)

An order that was placed through Pinterest.


## Constant Summary

| Constant | Description |
| --- | --- |
| [PAYMENT_STATUS_NOT_PAID](#payment_status_not_paid): [String](TopLevel.String.md) = "NOT_PAID" | Indicates that payment has not been made. |
| [PAYMENT_STATUS_PAID](#payment_status_paid): [String](TopLevel.String.md) = "PAID" | Indicates that payment is complete. |
| [PAYMENT_STATUS_PART_PAID](#payment_status_part_paid): [String](TopLevel.String.md) = "PART_PAID" | Indicates that payment is incomplete. |
| [STATUS_BACKORDER](#status_backorder): [String](TopLevel.String.md) = "BACKORDER" | Indicates an order on backorder. |
| [STATUS_CANCELLED](#status_cancelled): [String](TopLevel.String.md) = "CANCELLED" | Indicates an order that has been canceled. |
| [STATUS_DELIVERED](#status_delivered): [String](TopLevel.String.md) = "DELIVERED" | Indicates an order that has been delivered. |
| [STATUS_IN_PROGRESS](#status_in_progress): [String](TopLevel.String.md) = "IN_PROGRESS" | Indicates an order in progress. |
| [STATUS_NEW](#status_new): [String](TopLevel.String.md) = "NEW" | Indicates a new order. |
| [STATUS_RETURNED](#status_returned): [String](TopLevel.String.md) = "RETURNED" | Indicates an order that has been returned. |
| [STATUS_SHIPPED](#status_shipped): [String](TopLevel.String.md) = "SHIPPED" | Indicates an order that has shipped. |

## Property Summary

| Property | Description |
| --- | --- |
| [itemId](#itemid): [String](TopLevel.String.md) | Returns the item ID for this Pinterest order. |
| [orderNo](#orderno): [String](TopLevel.String.md) `(read-only)` | Returns the order number for this Pinterest order. |
| [paymentStatus](#paymentstatus): [String](TopLevel.String.md) | Returns the status of this Pinterest order. |
| [status](#status): [String](TopLevel.String.md) | Returns the status of this Pinterest order. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getItemId](dw.extensions.pinterest.PinterestOrder.md#getitemid)() | Returns the item ID for this Pinterest order. |
| [getOrderNo](dw.extensions.pinterest.PinterestOrder.md#getorderno)() | Returns the order number for this Pinterest order. |
| [getPaymentStatus](dw.extensions.pinterest.PinterestOrder.md#getpaymentstatus)() | Returns the status of this Pinterest order. |
| [getStatus](dw.extensions.pinterest.PinterestOrder.md#getstatus)() | Returns the status of this Pinterest order. |
| [setItemId](dw.extensions.pinterest.PinterestOrder.md#setitemidstring)([String](TopLevel.String.md)) | Sets the item ID for this Pinterest order. |
| [setPaymentStatus](dw.extensions.pinterest.PinterestOrder.md#setpaymentstatusstring)([String](TopLevel.String.md)) | Sets the status of this Pinterest order. |
| [setStatus](dw.extensions.pinterest.PinterestOrder.md#setstatusstring)([String](TopLevel.String.md)) | Sets the status of this Pinterest order. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### PAYMENT_STATUS_NOT_PAID

- PAYMENT_STATUS_NOT_PAID: [String](TopLevel.String.md) = "NOT_PAID"
  - : Indicates that payment has not been made.


---

### PAYMENT_STATUS_PAID

- PAYMENT_STATUS_PAID: [String](TopLevel.String.md) = "PAID"
  - : Indicates that payment is complete.


---

### PAYMENT_STATUS_PART_PAID

- PAYMENT_STATUS_PART_PAID: [String](TopLevel.String.md) = "PART_PAID"
  - : Indicates that payment is incomplete.


---

### STATUS_BACKORDER

- STATUS_BACKORDER: [String](TopLevel.String.md) = "BACKORDER"
  - : Indicates an order on backorder.


---

### STATUS_CANCELLED

- STATUS_CANCELLED: [String](TopLevel.String.md) = "CANCELLED"
  - : Indicates an order that has been canceled.


---

### STATUS_DELIVERED

- STATUS_DELIVERED: [String](TopLevel.String.md) = "DELIVERED"
  - : Indicates an order that has been delivered.


---

### STATUS_IN_PROGRESS

- STATUS_IN_PROGRESS: [String](TopLevel.String.md) = "IN_PROGRESS"
  - : Indicates an order in progress.


---

### STATUS_NEW

- STATUS_NEW: [String](TopLevel.String.md) = "NEW"
  - : Indicates a new order.


---

### STATUS_RETURNED

- STATUS_RETURNED: [String](TopLevel.String.md) = "RETURNED"
  - : Indicates an order that has been returned.


---

### STATUS_SHIPPED

- STATUS_SHIPPED: [String](TopLevel.String.md) = "SHIPPED"
  - : Indicates an order that has shipped.


---

## Property Details

### itemId
- itemId: [String](TopLevel.String.md)
  - : Returns the item ID for this Pinterest order.


---

### orderNo
- orderNo: [String](TopLevel.String.md) `(read-only)`
  - : Returns the order number for this Pinterest order. This is the same as the order number of the Demandware order.


---

### paymentStatus
- paymentStatus: [String](TopLevel.String.md)
  - : Returns the status of this Pinterest order. Possible values are
      [PAYMENT_STATUS_PAID](dw.extensions.pinterest.PinterestOrder.md#payment_status_paid),
      [PAYMENT_STATUS_NOT_PAID](dw.extensions.pinterest.PinterestOrder.md#payment_status_not_paid),
      or [PAYMENT_STATUS_PART_PAID](dw.extensions.pinterest.PinterestOrder.md#payment_status_part_paid).



---

### status
- status: [String](TopLevel.String.md)
  - : Returns the status of this Pinterest order. Possible values are
      [STATUS_NEW](dw.extensions.pinterest.PinterestOrder.md#status_new),
      [STATUS_IN_PROGRESS](dw.extensions.pinterest.PinterestOrder.md#status_in_progress),
      [STATUS_SHIPPED](dw.extensions.pinterest.PinterestOrder.md#status_shipped),
      [STATUS_BACKORDER](dw.extensions.pinterest.PinterestOrder.md#status_backorder),
      [STATUS_CANCELLED](dw.extensions.pinterest.PinterestOrder.md#status_cancelled),
      [STATUS_DELIVERED](dw.extensions.pinterest.PinterestOrder.md#status_delivered),
      or [STATUS_RETURNED](dw.extensions.pinterest.PinterestOrder.md#status_returned).



---

## Method Details

### getItemId()
- getItemId(): [String](TopLevel.String.md)
  - : Returns the item ID for this Pinterest order.


---

### getOrderNo()
- getOrderNo(): [String](TopLevel.String.md)
  - : Returns the order number for this Pinterest order. This is the same as the order number of the Demandware order.

    **Returns:**
    - order number


---

### getPaymentStatus()
- getPaymentStatus(): [String](TopLevel.String.md)
  - : Returns the status of this Pinterest order. Possible values are
      [PAYMENT_STATUS_PAID](dw.extensions.pinterest.PinterestOrder.md#payment_status_paid),
      [PAYMENT_STATUS_NOT_PAID](dw.extensions.pinterest.PinterestOrder.md#payment_status_not_paid),
      or [PAYMENT_STATUS_PART_PAID](dw.extensions.pinterest.PinterestOrder.md#payment_status_part_paid).



---

### getStatus()
- getStatus(): [String](TopLevel.String.md)
  - : Returns the status of this Pinterest order. Possible values are
      [STATUS_NEW](dw.extensions.pinterest.PinterestOrder.md#status_new),
      [STATUS_IN_PROGRESS](dw.extensions.pinterest.PinterestOrder.md#status_in_progress),
      [STATUS_SHIPPED](dw.extensions.pinterest.PinterestOrder.md#status_shipped),
      [STATUS_BACKORDER](dw.extensions.pinterest.PinterestOrder.md#status_backorder),
      [STATUS_CANCELLED](dw.extensions.pinterest.PinterestOrder.md#status_cancelled),
      [STATUS_DELIVERED](dw.extensions.pinterest.PinterestOrder.md#status_delivered),
      or [STATUS_RETURNED](dw.extensions.pinterest.PinterestOrder.md#status_returned).



---

### setItemId(String)
- setItemId(itemId: [String](TopLevel.String.md)): void
  - : Sets the item ID for this Pinterest order.

    **Parameters:**
    - itemId - item ID


---

### setPaymentStatus(String)
- setPaymentStatus(status: [String](TopLevel.String.md)): void
  - : Sets the status of this Pinterest order. Possible values are
      [PAYMENT_STATUS_PAID](dw.extensions.pinterest.PinterestOrder.md#payment_status_paid),
      [PAYMENT_STATUS_NOT_PAID](dw.extensions.pinterest.PinterestOrder.md#payment_status_not_paid),
      or [PAYMENT_STATUS_PART_PAID](dw.extensions.pinterest.PinterestOrder.md#payment_status_part_paid).


    **Parameters:**
    - status - the status to set for this order


---

### setStatus(String)
- setStatus(status: [String](TopLevel.String.md)): void
  - : Sets the status of this Pinterest order. Possible values are
      [STATUS_NEW](dw.extensions.pinterest.PinterestOrder.md#status_new),
      [STATUS_IN_PROGRESS](dw.extensions.pinterest.PinterestOrder.md#status_in_progress),
      [STATUS_SHIPPED](dw.extensions.pinterest.PinterestOrder.md#status_shipped),
      [STATUS_BACKORDER](dw.extensions.pinterest.PinterestOrder.md#status_backorder),
      [STATUS_CANCELLED](dw.extensions.pinterest.PinterestOrder.md#status_cancelled),
      [STATUS_DELIVERED](dw.extensions.pinterest.PinterestOrder.md#status_delivered),
      or [STATUS_RETURNED](dw.extensions.pinterest.PinterestOrder.md#status_returned).


    **Parameters:**
    - status - the status to set for this order


---

<!-- prettier-ignore-end -->
