<!-- prettier-ignore-start -->
# Class AbstractItemCtnr

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.object.Extensible](dw.object.Extensible.md)
    - [dw.order.AbstractItemCtnr](dw.order.AbstractItemCtnr.md)

Basis for item-based objects stemming from a single [Order](dw.order.Order.md), with these common
properties (Invoice is used as an example):


- The object has been created from an Order accessible using [getOrder()](dw.order.AbstractItemCtnr.md#getorder)
- Contains a collection of [items](dw.order.AbstractItemCtnr.md#getitems), each item related to exactly one [OrderItem](dw.order.OrderItem.md)which in turn represents  an extension to one of the order [ProductLineItem](dw.order.ProductLineItem.md)or one [ShippingLineItem](dw.order.ShippingLineItem.md).  Example: an [Invoice](dw.order.Invoice.md)has [InvoiceItem](dw.order.InvoiceItem.md)s
- The items hold various prices which are summed, resulting in a  [product-subtotal](dw.order.AbstractItemCtnr.md#getproductsubtotal), a  [service-subtotal](dw.order.AbstractItemCtnr.md#getservicesubtotal)and a [grand-total](dw.order.AbstractItemCtnr.md#getgrandtotal),  each represented by a [SumItem](dw.order.SumItem.md).
- The object is customizable using custom properties



## All Known Subclasses
[Appeasement](dw.order.Appeasement.md), [Invoice](dw.order.Invoice.md), [Return](dw.order.Return.md), [ReturnCase](dw.order.ReturnCase.md), [ShippingOrder](dw.order.ShippingOrder.md)
## Property Summary

| Property | Description |
| --- | --- |
| [createdBy](#createdby): [String](TopLevel.String.md) `(read-only)` | Created by this user. |
| [creationDate](#creationdate): [Date](TopLevel.Date.md) `(read-only)` | The time of creation. |
| [grandTotal](#grandtotal): [SumItem](dw.order.SumItem.md) `(read-only)` | Returns the sum-item representing the grandtotal for all items. |
| [items](#items): [FilteringCollection](dw.util.FilteringCollection.md) `(read-only)` | Returns the unsorted collection of items |
| [lastModified](#lastmodified): [Date](TopLevel.Date.md) `(read-only)` | The last modification time. |
| [modifiedBy](#modifiedby): [String](TopLevel.String.md) `(read-only)` | Last modified by this user. |
| [order](#order): [Order](dw.order.Order.md) `(read-only)` | Returns the [Order](dw.order.Order.md) this object was created for. |
| [productSubtotal](#productsubtotal): [SumItem](dw.order.SumItem.md) `(read-only)` | Returns the sum-item representing the subtotal for product items. |
| [serviceSubtotal](#servicesubtotal): [SumItem](dw.order.SumItem.md) `(read-only)` | Returns the sum-item representing the subtotal for service items such as  shipping. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getCreatedBy](dw.order.AbstractItemCtnr.md#getcreatedby)() | Created by this user. |
| [getCreationDate](dw.order.AbstractItemCtnr.md#getcreationdate)() | The time of creation. |
| [getGrandTotal](dw.order.AbstractItemCtnr.md#getgrandtotal)() | Returns the sum-item representing the grandtotal for all items. |
| [getItems](dw.order.AbstractItemCtnr.md#getitems)() | Returns the unsorted collection of items |
| [getLastModified](dw.order.AbstractItemCtnr.md#getlastmodified)() | The last modification time. |
| [getModifiedBy](dw.order.AbstractItemCtnr.md#getmodifiedby)() | Last modified by this user. |
| [getOrder](dw.order.AbstractItemCtnr.md#getorder)() | Returns the [Order](dw.order.Order.md) this object was created for. |
| [getProductSubtotal](dw.order.AbstractItemCtnr.md#getproductsubtotal)() | Returns the sum-item representing the subtotal for product items. |
| [getServiceSubtotal](dw.order.AbstractItemCtnr.md#getservicesubtotal)() | Returns the sum-item representing the subtotal for service items such as  shipping. |

### Methods inherited from class Extensible

[describe](dw.object.Extensible.md#describe), [getCustom](dw.object.Extensible.md#getcustom)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### createdBy
- createdBy: [String](TopLevel.String.md) `(read-only)`
  - : Created by this user.


---

### creationDate
- creationDate: [Date](TopLevel.Date.md) `(read-only)`
  - : The time of creation.


---

### grandTotal
- grandTotal: [SumItem](dw.order.SumItem.md) `(read-only)`
  - : Returns the sum-item representing the grandtotal for all items.


---

### items
- items: [FilteringCollection](dw.util.FilteringCollection.md) `(read-only)`
  - : Returns the unsorted collection of items


---

### lastModified
- lastModified: [Date](TopLevel.Date.md) `(read-only)`
  - : The last modification time.


---

### modifiedBy
- modifiedBy: [String](TopLevel.String.md) `(read-only)`
  - : Last modified by this user.


---

### order
- order: [Order](dw.order.Order.md) `(read-only)`
  - : Returns the [Order](dw.order.Order.md) this object was created for.


---

### productSubtotal
- productSubtotal: [SumItem](dw.order.SumItem.md) `(read-only)`
  - : Returns the sum-item representing the subtotal for product items.


---

### serviceSubtotal
- serviceSubtotal: [SumItem](dw.order.SumItem.md) `(read-only)`
  - : Returns the sum-item representing the subtotal for service items such as
      shipping.



---

## Method Details

### getCreatedBy()
- getCreatedBy(): [String](TopLevel.String.md)
  - : Created by this user.

    **Returns:**
    - Created by this user


---

### getCreationDate()
- getCreationDate(): [Date](TopLevel.Date.md)
  - : The time of creation.

    **Returns:**
    - time of creation.


---

### getGrandTotal()
- getGrandTotal(): [SumItem](dw.order.SumItem.md)
  - : Returns the sum-item representing the grandtotal for all items.

    **Returns:**
    - sum-item for all items


---

### getItems()
- getItems(): [FilteringCollection](dw.util.FilteringCollection.md)
  - : Returns the unsorted collection of items

    **Returns:**
    - the unsorted collection of items


---

### getLastModified()
- getLastModified(): [Date](TopLevel.Date.md)
  - : The last modification time.

    **Returns:**
    - last modification time..


---

### getModifiedBy()
- getModifiedBy(): [String](TopLevel.String.md)
  - : Last modified by this user.

    **Returns:**
    - Last modified by this user


---

### getOrder()
- getOrder(): [Order](dw.order.Order.md)
  - : Returns the [Order](dw.order.Order.md) this object was created for.

    **Returns:**
    - the Order this object was created for.


---

### getProductSubtotal()
- getProductSubtotal(): [SumItem](dw.order.SumItem.md)
  - : Returns the sum-item representing the subtotal for product items.

    **Returns:**
    - sum-item for product items


---

### getServiceSubtotal()
- getServiceSubtotal(): [SumItem](dw.order.SumItem.md)
  - : Returns the sum-item representing the subtotal for service items such as
      shipping.


    **Returns:**
    - sum-item for service items such as shipping


---

<!-- prettier-ignore-end -->
