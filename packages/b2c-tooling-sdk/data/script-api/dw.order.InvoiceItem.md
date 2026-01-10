<!-- prettier-ignore-start -->
# Class InvoiceItem

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.object.Extensible](dw.object.Extensible.md)
    - [dw.order.AbstractItem](dw.order.AbstractItem.md)
      - [dw.order.InvoiceItem](dw.order.InvoiceItem.md)

Represents a specific item in an [Invoice](dw.order.Invoice.md). Invoice items are added to the invoice
on its creation, each item references exactly one order-item.


Order post-processing APIs (gillian) are now inactive by default and will throw
an exception if accessed. Activation needs preliminary approval by Product Management.
Please contact support in this case. Existing customers using these APIs are not
affected by this change and can use the APIs until further notice.



## Property Summary

| Property | Description |
| --- | --- |
| [basePrice](#baseprice): [Money](dw.value.Money.md) `(read-only)` | Price of a single unit before discount application. |
| [capturedAmount](#capturedamount): [Money](dw.value.Money.md) | Returns the captured amount for this item. |
| [invoiceNumber](#invoicenumber): [String](TopLevel.String.md) `(read-only)` | Returns the number of the invoice to which this item belongs. |
| [parentItem](#parentitem): [InvoiceItem](dw.order.InvoiceItem.md) | Returns null or the parent item. |
| [quantity](#quantity): [Quantity](dw.value.Quantity.md) `(read-only)` | Returns the quantity of this item. |
| [refundedAmount](#refundedamount): [Money](dw.value.Money.md) | Returns the refunded amount for this item. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getBasePrice](dw.order.InvoiceItem.md#getbaseprice)() | Price of a single unit before discount application. |
| [getCapturedAmount](dw.order.InvoiceItem.md#getcapturedamount)() | Returns the captured amount for this item. |
| [getInvoiceNumber](dw.order.InvoiceItem.md#getinvoicenumber)() | Returns the number of the invoice to which this item belongs. |
| [getParentItem](dw.order.InvoiceItem.md#getparentitem)() | Returns null or the parent item. |
| [getQuantity](dw.order.InvoiceItem.md#getquantity)() | Returns the quantity of this item. |
| [getRefundedAmount](dw.order.InvoiceItem.md#getrefundedamount)() | Returns the refunded amount for this item. |
| [setCapturedAmount](dw.order.InvoiceItem.md#setcapturedamountmoney)([Money](dw.value.Money.md)) | Updates the captured amount for this item. |
| [setParentItem](dw.order.InvoiceItem.md#setparentiteminvoiceitem)([InvoiceItem](dw.order.InvoiceItem.md)) | Set a parent item. |
| [setRefundedAmount](dw.order.InvoiceItem.md#setrefundedamountmoney)([Money](dw.value.Money.md)) | Updates the refunded amount for this item. |

### Methods inherited from class AbstractItem

[getGrossPrice](dw.order.AbstractItem.md#getgrossprice), [getItemID](dw.order.AbstractItem.md#getitemid), [getLineItem](dw.order.AbstractItem.md#getlineitem), [getNetPrice](dw.order.AbstractItem.md#getnetprice), [getOrderItem](dw.order.AbstractItem.md#getorderitem), [getOrderItemID](dw.order.AbstractItem.md#getorderitemid), [getTax](dw.order.AbstractItem.md#gettax), [getTaxBasis](dw.order.AbstractItem.md#gettaxbasis), [getTaxItems](dw.order.AbstractItem.md#gettaxitems)
### Methods inherited from class Extensible

[describe](dw.object.Extensible.md#describe), [getCustom](dw.object.Extensible.md#getcustom)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### basePrice
- basePrice: [Money](dw.value.Money.md) `(read-only)`
  - : Price of a single unit before discount application.


---

### capturedAmount
- capturedAmount: [Money](dw.value.Money.md)
  - : Returns the captured amount for this item.


---

### invoiceNumber
- invoiceNumber: [String](TopLevel.String.md) `(read-only)`
  - : Returns the number of the invoice to which this item belongs.


---

### parentItem
- parentItem: [InvoiceItem](dw.order.InvoiceItem.md)
  - : Returns null or the parent item.


---

### quantity
- quantity: [Quantity](dw.value.Quantity.md) `(read-only)`
  - : Returns the quantity of this item.


---

### refundedAmount
- refundedAmount: [Money](dw.value.Money.md)
  - : Returns the refunded amount for this item.


---

## Method Details

### getBasePrice()
- getBasePrice(): [Money](dw.value.Money.md)
  - : Price of a single unit before discount application.

    **Returns:**
    - Price of a single unit before discount application.


---

### getCapturedAmount()
- getCapturedAmount(): [Money](dw.value.Money.md)
  - : Returns the captured amount for this item.

    **Returns:**
    - the captured amount for this item


---

### getInvoiceNumber()
- getInvoiceNumber(): [String](TopLevel.String.md)
  - : Returns the number of the invoice to which this item belongs.

    **Returns:**
    - the number of the invoice to which this item belongs


---

### getParentItem()
- getParentItem(): [InvoiceItem](dw.order.InvoiceItem.md)
  - : Returns null or the parent item.

    **Returns:**
    - null or the parent item.


---

### getQuantity()
- getQuantity(): [Quantity](dw.value.Quantity.md)
  - : Returns the quantity of this item.

    **Returns:**
    - quantity of this item


---

### getRefundedAmount()
- getRefundedAmount(): [Money](dw.value.Money.md)
  - : Returns the refunded amount for this item.

    **Returns:**
    - the refunded amount for this item


---

### setCapturedAmount(Money)
- setCapturedAmount(capturedAmount: [Money](dw.value.Money.md)): void
  - : Updates the captured amount for this item.

    **Parameters:**
    - capturedAmount - the captured amount for this item


---

### setParentItem(InvoiceItem)
- setParentItem(parentItem: [InvoiceItem](dw.order.InvoiceItem.md)): void
  - : Set a parent item. The parent item must belong to the same
      [Invoice](dw.order.Invoice.md). An infinite parent-child loop is disallowed
      as is a parent-child depth greater than 10. Setting a parent item
      indicates a dependency of the child item on the parent item, and can be
      used to form a parallel structure to that accessed using
      [ProductLineItem.getParent()](dw.order.ProductLineItem.md#getparent).


    **Parameters:**
    - parentItem - The parent item, null is allowed


---

### setRefundedAmount(Money)
- setRefundedAmount(refundedAmount: [Money](dw.value.Money.md)): void
  - : Updates the refunded amount for this item.

    **Parameters:**
    - refundedAmount - the refunded amount for this item


---

<!-- prettier-ignore-end -->
