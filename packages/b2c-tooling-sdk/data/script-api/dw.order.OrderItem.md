<!-- prettier-ignore-start -->
# Class OrderItem

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.order.OrderItem](dw.order.OrderItem.md)

Defines _extensions_ to [ProductLineItem](dw.order.ProductLineItem.md)s and
[ShippingLineItem](dw.order.ShippingLineItem.md)s belonging to an [order](dw.order.Order.md).



The order-item can be accessed using
[ProductLineItem.getOrderItem()](dw.order.ProductLineItem.md#getorderitem) or
[ShippingLineItem.getOrderItem()](dw.order.ShippingLineItem.md#getorderitem) - these methods return null
if the item is associated with a [basket](dw.order.Basket.md) rather than
an [order](dw.order.Order.md). Alternative access is available using
[Order.getOrderItem(String)](dw.order.Order.md#getorderitemstring) by passing the
[itemID](dw.order.OrderItem.md#getitemid) used to identify the
order-item in for example export files. The
associated order-item can also be accessed from
[invoice-items](dw.order.InvoiceItem.md),
[shipping-order-items](dw.order.ShippingOrderItem.md),
[return-items](dw.order.ReturnItem.md) and [return-case-items](dw.order.ReturnCaseItem.md)
using [AbstractItem.getOrderItem()](dw.order.AbstractItem.md#getorderitem).



The order-item provides an item-level [status](dw.order.OrderItem.md#getstatus) and
[type](dw.order.OrderItem.md#gettype), methods for accessing and creating associated items,
and methods used to [allocate  inventory](dw.order.OrderItem.md#allocateinventoryboolean) for [shipping-order](dw.order.ShippingOrder.md) creation.


Order post-processing APIs (gillian) are now inactive by default and will throw
an exception if accessed. Activation needs preliminary approval by Product Management.
Please contact support in this case. Existing customers using these APIs are not
affected by this change and can use the APIs until further notice.



## Constant Summary

| Constant | Description |
| --- | --- |
| [STATUS_BACKORDER](#status_backorder): [String](TopLevel.String.md) = "BACKORDER" | Constant for Order Item Status BACKORDER |
| [STATUS_CANCELLED](#status_cancelled): [String](TopLevel.String.md) = "CANCELLED" | Constant for Order Item Status CANCELLED |
| [STATUS_CONFIRMED](#status_confirmed): [String](TopLevel.String.md) = "CONFIRMED" | Constant for Order Item Status CONFIRMED |
| [STATUS_CREATED](#status_created): [String](TopLevel.String.md) = "CREATED" | Constant for Order Item Status CREATED |
| [STATUS_NEW](#status_new): [String](TopLevel.String.md) = "NEW" | Constant for Order Item Status NEW |
| [STATUS_OPEN](#status_open): [String](TopLevel.String.md) = "OPEN" | Constant for Order Item Status OPEN |
| [STATUS_SHIPPED](#status_shipped): [String](TopLevel.String.md) = "SHIPPED" | Constant for Order Item Status SHIPPED |
| [STATUS_WAREHOUSE](#status_warehouse): [String](TopLevel.String.md) = "WAREHOUSE" | Constant for Order Item Status WAREHOUSE |
| [TYPE_PRODUCT](#type_product): [String](TopLevel.String.md) = "PRODUCT" | Constant for Order Item Type PRODUCT |
| [TYPE_SERVICE](#type_service): [String](TopLevel.String.md) = "SERVICE" | Constant for Order Item Type SERVICE |

## Property Summary

| Property | Description |
| --- | --- |
| [appeasedAmount](#appeasedamount): [Money](dw.value.Money.md) `(read-only)` | Sum of amounts appeased for this item, calculated by iterating over  invoice items associated with the item. |
| [capturedAmount](#capturedamount): [Money](dw.value.Money.md) `(read-only)` | Sum of amounts captured for this item, calculated by iterating over  invoice items associated with the item. |
| [invoiceItems](#invoiceitems): [Collection](dw.util.Collection.md) `(read-only)` | Returns all invoice items associated with this item, each  [InvoiceItem](dw.order.InvoiceItem.md) will belong to a different  [Invoice](dw.order.Invoice.md), which can also be accessed using  [Order.getInvoices()](dw.order.Order.md#getinvoices) or [Order.getInvoice(String)](dw.order.Order.md#getinvoicestring). |
| [itemID](#itemid): [String](TopLevel.String.md) `(read-only)` | The itemID used to identify the OrderItem. |
| [lineItem](#lineitem): [LineItem](dw.order.LineItem.md) `(read-only)` | Returns the line item which is being extended by this instance. |
| [refundedAmount](#refundedamount): [Money](dw.value.Money.md) `(read-only)` | Sum of amounts refunded for this item, calculated by iterating over  invoice items associated with the item. |
| [returnCaseItems](#returncaseitems): [Collection](dw.util.Collection.md) `(read-only)` | Returns all return case items associated with this item,  each [ReturnCaseItem](dw.order.ReturnCaseItem.md) will belong to a different  [ReturnCase](dw.order.ReturnCase.md), which can also be accessed using  [Order.getReturnCases()](dw.order.Order.md#getreturncases) or [Order.getReturnCase(String)](dw.order.Order.md#getreturncasestring). |
| [returnedQuantity](#returnedquantity): [Quantity](dw.value.Quantity.md) `(read-only)` | The quantity returned, dynamically sum of quantities held by associated  ReturnItems. |
| ~~[shippingOrderItem](#shippingorderitem): [ShippingOrderItem](dw.order.ShippingOrderItem.md)~~ `(read-only)` | The last added non-cancelled shipping order item if one exists, otherwise `null`. |
| [shippingOrderItems](#shippingorderitems): [Collection](dw.util.Collection.md) `(read-only)` | Returns a collection of the [ShippingOrderItem](dw.order.ShippingOrderItem.md)s created for this item. |
| [splitItems](#splititems): [Collection](dw.util.Collection.md) `(read-only)` | Returns a collection of all split [OrderItem](dw.order.OrderItem.md)s associated with this item. |
| [splitSourceItem](#splitsourceitem): [OrderItem](dw.order.OrderItem.md) `(read-only)` | Returns the split source item associated with this item, if existing. |
| [status](#status): [EnumValue](dw.value.EnumValue.md) | Gets the order item status.<br/>  The possible values are:  <ul>  <li>[STATUS_NEW](dw.order.OrderItem.md#status_new)</li>  <li>[STATUS_OPEN](dw.order.OrderItem.md#status_open)</li>  <li>[STATUS_BACKORDER](dw.order.OrderItem.md#status_backorder)</li>  <li>[STATUS_CONFIRMED](dw.order.OrderItem.md#status_confirmed)</li>  <li>[STATUS_WAREHOUSE](dw.order.OrderItem.md#status_warehouse)</li>  <li>[STATUS_SHIPPED](dw.order.OrderItem.md#status_shipped)</li>  <li>[STATUS_CANCELLED](dw.order.OrderItem.md#status_cancelled)</li>  <ul> |
| [type](#type): [EnumValue](dw.value.EnumValue.md) `(read-only)` | Returns the type of line item with which this instance is associated, one  of  <ul>  <li>SERVICE (method [getLineItem()](dw.order.OrderItem.md#getlineitem) returns a  [ShippingLineItem](dw.order.ShippingLineItem.md)</li>  <li>PRODUCT (method [getLineItem()](dw.order.OrderItem.md#getlineitem) returns a  [ProductLineItem](dw.order.ProductLineItem.md)</li>  </ul> |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [allocateInventory](dw.order.OrderItem.md#allocateinventoryboolean)([Boolean](TopLevel.Boolean.md)) | Please note that this method is disabled by default. |
| [getAppeasedAmount](dw.order.OrderItem.md#getappeasedamount)() | Sum of amounts appeased for this item, calculated by iterating over  invoice items associated with the item. |
| [getCapturedAmount](dw.order.OrderItem.md#getcapturedamount)() | Sum of amounts captured for this item, calculated by iterating over  invoice items associated with the item. |
| [getInvoiceItems](dw.order.OrderItem.md#getinvoiceitems)() | Returns all invoice items associated with this item, each  [InvoiceItem](dw.order.InvoiceItem.md) will belong to a different  [Invoice](dw.order.Invoice.md), which can also be accessed using  [Order.getInvoices()](dw.order.Order.md#getinvoices) or [Order.getInvoice(String)](dw.order.Order.md#getinvoicestring). |
| [getItemID](dw.order.OrderItem.md#getitemid)() | The itemID used to identify the OrderItem. |
| [getLineItem](dw.order.OrderItem.md#getlineitem)() | Returns the line item which is being extended by this instance. |
| [getRefundedAmount](dw.order.OrderItem.md#getrefundedamount)() | Sum of amounts refunded for this item, calculated by iterating over  invoice items associated with the item. |
| [getReturnCaseItems](dw.order.OrderItem.md#getreturncaseitems)() | Returns all return case items associated with this item,  each [ReturnCaseItem](dw.order.ReturnCaseItem.md) will belong to a different  [ReturnCase](dw.order.ReturnCase.md), which can also be accessed using  [Order.getReturnCases()](dw.order.Order.md#getreturncases) or [Order.getReturnCase(String)](dw.order.Order.md#getreturncasestring). |
| [getReturnedQuantity](dw.order.OrderItem.md#getreturnedquantity)() | The quantity returned, dynamically sum of quantities held by associated  ReturnItems. |
| ~~[getShippingOrderItem](dw.order.OrderItem.md#getshippingorderitem)()~~ | The last added non-cancelled shipping order item if one exists, otherwise `null`. |
| [getShippingOrderItems](dw.order.OrderItem.md#getshippingorderitems)() | Returns a collection of the [ShippingOrderItem](dw.order.ShippingOrderItem.md)s created for this item. |
| [getShippingOrderItems](dw.order.OrderItem.md#getshippingorderitemsboolean)([Boolean](TopLevel.Boolean.md)) | Returns a collection of the [ShippingOrderItem](dw.order.ShippingOrderItem.md)s created for this item. |
| [getSplitItems](dw.order.OrderItem.md#getsplititems)() | Returns a collection of all split [OrderItem](dw.order.OrderItem.md)s associated with this item. |
| [getSplitSourceItem](dw.order.OrderItem.md#getsplitsourceitem)() | Returns the split source item associated with this item, if existing. |
| [getStatus](dw.order.OrderItem.md#getstatus)() | Gets the order item status.<br/>  The possible values are:  <ul>  <li>[STATUS_NEW](dw.order.OrderItem.md#status_new)</li>  <li>[STATUS_OPEN](dw.order.OrderItem.md#status_open)</li>  <li>[STATUS_BACKORDER](dw.order.OrderItem.md#status_backorder)</li>  <li>[STATUS_CONFIRMED](dw.order.OrderItem.md#status_confirmed)</li>  <li>[STATUS_WAREHOUSE](dw.order.OrderItem.md#status_warehouse)</li>  <li>[STATUS_SHIPPED](dw.order.OrderItem.md#status_shipped)</li>  <li>[STATUS_CANCELLED](dw.order.OrderItem.md#status_cancelled)</li>  <ul> |
| [getType](dw.order.OrderItem.md#gettype)() | Returns the type of line item with which this instance is associated, one  of  <ul>  <li>SERVICE (method [getLineItem()](dw.order.OrderItem.md#getlineitem) returns a  [ShippingLineItem](dw.order.ShippingLineItem.md)</li>  <li>PRODUCT (method [getLineItem()](dw.order.OrderItem.md#getlineitem) returns a  [ProductLineItem](dw.order.ProductLineItem.md)</li>  </ul> |
| [setStatus](dw.order.OrderItem.md#setstatusstring)([String](TopLevel.String.md)) | Set the status of the order item, use one of the values documented in [getStatus()](dw.order.OrderItem.md#getstatus). |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### STATUS_BACKORDER

- STATUS_BACKORDER: [String](TopLevel.String.md) = "BACKORDER"
  - : Constant for Order Item Status BACKORDER


---

### STATUS_CANCELLED

- STATUS_CANCELLED: [String](TopLevel.String.md) = "CANCELLED"
  - : Constant for Order Item Status CANCELLED


---

### STATUS_CONFIRMED

- STATUS_CONFIRMED: [String](TopLevel.String.md) = "CONFIRMED"
  - : Constant for Order Item Status CONFIRMED


---

### STATUS_CREATED

- STATUS_CREATED: [String](TopLevel.String.md) = "CREATED"
  - : Constant for Order Item Status CREATED


---

### STATUS_NEW

- STATUS_NEW: [String](TopLevel.String.md) = "NEW"
  - : Constant for Order Item Status NEW


---

### STATUS_OPEN

- STATUS_OPEN: [String](TopLevel.String.md) = "OPEN"
  - : Constant for Order Item Status OPEN


---

### STATUS_SHIPPED

- STATUS_SHIPPED: [String](TopLevel.String.md) = "SHIPPED"
  - : Constant for Order Item Status SHIPPED


---

### STATUS_WAREHOUSE

- STATUS_WAREHOUSE: [String](TopLevel.String.md) = "WAREHOUSE"
  - : Constant for Order Item Status WAREHOUSE


---

### TYPE_PRODUCT

- TYPE_PRODUCT: [String](TopLevel.String.md) = "PRODUCT"
  - : Constant for Order Item Type PRODUCT


---

### TYPE_SERVICE

- TYPE_SERVICE: [String](TopLevel.String.md) = "SERVICE"
  - : Constant for Order Item Type SERVICE


---

## Property Details

### appeasedAmount
- appeasedAmount: [Money](dw.value.Money.md) `(read-only)`
  - : Sum of amounts appeased for this item, calculated by iterating over
      invoice items associated with the item.



---

### capturedAmount
- capturedAmount: [Money](dw.value.Money.md) `(read-only)`
  - : Sum of amounts captured for this item, calculated by iterating over
      invoice items associated with the item.



---

### invoiceItems
- invoiceItems: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns all invoice items associated with this item, each
      [InvoiceItem](dw.order.InvoiceItem.md) will belong to a different
      [Invoice](dw.order.Invoice.md), which can also be accessed using
      [Order.getInvoices()](dw.order.Order.md#getinvoices) or [Order.getInvoice(String)](dw.order.Order.md#getinvoicestring).



---

### itemID
- itemID: [String](TopLevel.String.md) `(read-only)`
  - : The itemID used to identify the OrderItem. Note this is
      not a UUID, it is created internally when the OrderItem
      instance is created, and is typically used within export files to
      identify the item.



---

### lineItem
- lineItem: [LineItem](dw.order.LineItem.md) `(read-only)`
  - : Returns the line item which is being extended by this instance.


---

### refundedAmount
- refundedAmount: [Money](dw.value.Money.md) `(read-only)`
  - : Sum of amounts refunded for this item, calculated by iterating over
      invoice items associated with the item.



---

### returnCaseItems
- returnCaseItems: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns all return case items associated with this item,
      each [ReturnCaseItem](dw.order.ReturnCaseItem.md) will belong to a different
      [ReturnCase](dw.order.ReturnCase.md), which can also be accessed using
      [Order.getReturnCases()](dw.order.Order.md#getreturncases) or [Order.getReturnCase(String)](dw.order.Order.md#getreturncasestring).



---

### returnedQuantity
- returnedQuantity: [Quantity](dw.value.Quantity.md) `(read-only)`
  - : The quantity returned, dynamically sum of quantities held by associated
      ReturnItems.



---

### shippingOrderItem
- ~~shippingOrderItem: [ShippingOrderItem](dw.order.ShippingOrderItem.md)~~ `(read-only)`
  - : The last added non-cancelled shipping order item if one exists, otherwise `null`.
      
      
      Multiple shipping order items that are not in status [ShippingOrderItem.STATUS_CANCELLED](dw.order.ShippingOrderItem.md#status_cancelled)
      can exist for one OrderItem, for example if the OrderItem has been split for shipping purposes.
      The method returns `null` if no non-cancelled shipping order item exists.



---

### shippingOrderItems
- shippingOrderItems: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns a collection of the [ShippingOrderItem](dw.order.ShippingOrderItem.md)s created for this item.
      ShippingOrder items represents the whole or part of this item which could
      be delivered, and belong to a shipping order.
      Note that the cancelled shipping order items are returned too.
      This method is equivalent to [getShippingOrderItems(Boolean)](dw.order.OrderItem.md#getshippingorderitemsboolean)
      called with parameter `true`.



---

### splitItems
- splitItems: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns a collection of all split [OrderItem](dw.order.OrderItem.md)s associated with this item. Inverse relation to [getSplitSourceItem()](dw.order.OrderItem.md#getsplitsourceitem).
      
      
      Split order items are created when
      
      - creating a [ShippingOrderItem](dw.order.ShippingOrderItem.md)for a [ShippingOrder](dw.order.ShippingOrder.md), see [ShippingOrder.createShippingOrderItem(OrderItem, Quantity)](dw.order.ShippingOrder.md#createshippingorderitemorderitem-quantity)  - splitting an existing [ShippingOrderItem](dw.order.ShippingOrderItem.md), see [ShippingOrderItem.split(Quantity)](dw.order.ShippingOrderItem.md#splitquantity)with a specified quantity less than the existing quantity of the associated [ProductLineItem](dw.order.ProductLineItem.md). In this case the associated [ProductLineItem](dw.order.ProductLineItem.md)is split by creating a new [ProductLineItem](dw.order.ProductLineItem.md)and associating a new [ShippingOrderItem](dw.order.ShippingOrderItem.md)with this item. The new [ShippingOrderItem](dw.order.ShippingOrderItem.md)receives the specified quantity and the quantity of the item is set to the remaining quantity. All split items are associated to their originating item via    the "split source item" association.



---

### splitSourceItem
- splitSourceItem: [OrderItem](dw.order.OrderItem.md) `(read-only)`
  - : Returns the split source item associated with this item, if existing. Inverse relation to [getSplitItems()](dw.order.OrderItem.md#getsplititems).
      
      
      A split source item is associated after the successful creation of a split item with a quantity less than the existing quantity of the item to split.
      For details see [getSplitItems()](dw.order.OrderItem.md#getsplititems).



---

### status
- status: [EnumValue](dw.value.EnumValue.md)
  - : Gets the order item status.
      
      The possible values are:
      
      - [STATUS_NEW](dw.order.OrderItem.md#status_new)
      - [STATUS_OPEN](dw.order.OrderItem.md#status_open)
      - [STATUS_BACKORDER](dw.order.OrderItem.md#status_backorder)
      - [STATUS_CONFIRMED](dw.order.OrderItem.md#status_confirmed)
      - [STATUS_WAREHOUSE](dw.order.OrderItem.md#status_warehouse)
      - [STATUS_SHIPPED](dw.order.OrderItem.md#status_shipped)
      - [STATUS_CANCELLED](dw.order.OrderItem.md#status_cancelled)



---

### type
- type: [EnumValue](dw.value.EnumValue.md) `(read-only)`
  - : Returns the type of line item with which this instance is associated, one
      of
      
      - SERVICE (method [getLineItem()](dw.order.OrderItem.md#getlineitem)returns a  [ShippingLineItem](dw.order.ShippingLineItem.md)
      - PRODUCT (method [getLineItem()](dw.order.OrderItem.md#getlineitem)returns a  [ProductLineItem](dw.order.ProductLineItem.md)



---

## Method Details

### allocateInventory(Boolean)
- allocateInventory(partialAllocation: [Boolean](TopLevel.Boolean.md)): [Quantity](dw.value.Quantity.md)
  - : Please note that this method is disabled by default. Please contact support for enabling it.
      
      
      Attempts to allocate inventory for the item and returns the quantity that could be allocated or `null`
      if no allocation was possible.
      
      
      All [option product line items](dw.order.ProductLineItem.md#getoptionproductlineitems) are allocated with
      their parent. Note that for items with option product line items no partial allocation is possible. That means
      the partialAllocation parameter will in this case always be considered as `false`


    **Parameters:**
    - partialAllocation -              <li>`true` accept a partial allocation as a result. Partial allocation is only possible             when no option product line items are included,</li>             <li>`false` only full allocation will be used, partial allocation will be released             automatically</li>             </ul>

    **Returns:**
    - 
      - successful: the newly allocated quantity
      - failed: `null`



---

### getAppeasedAmount()
- getAppeasedAmount(): [Money](dw.value.Money.md)
  - : Sum of amounts appeased for this item, calculated by iterating over
      invoice items associated with the item.


    **Returns:**
    - Sum of amounts refunded for this item


---

### getCapturedAmount()
- getCapturedAmount(): [Money](dw.value.Money.md)
  - : Sum of amounts captured for this item, calculated by iterating over
      invoice items associated with the item.


    **Returns:**
    - Sum of amounts captured for this item


---

### getInvoiceItems()
- getInvoiceItems(): [Collection](dw.util.Collection.md)
  - : Returns all invoice items associated with this item, each
      [InvoiceItem](dw.order.InvoiceItem.md) will belong to a different
      [Invoice](dw.order.Invoice.md), which can also be accessed using
      [Order.getInvoices()](dw.order.Order.md#getinvoices) or [Order.getInvoice(String)](dw.order.Order.md#getinvoicestring).


    **Returns:**
    - invoice items associated with this item


---

### getItemID()
- getItemID(): [String](TopLevel.String.md)
  - : The itemID used to identify the OrderItem. Note this is
      not a UUID, it is created internally when the OrderItem
      instance is created, and is typically used within export files to
      identify the item.


    **Returns:**
    - the itemID of the OrderItem


---

### getLineItem()
- getLineItem(): [LineItem](dw.order.LineItem.md)
  - : Returns the line item which is being extended by this instance.

    **Returns:**
    - the line item associated with this instance


---

### getRefundedAmount()
- getRefundedAmount(): [Money](dw.value.Money.md)
  - : Sum of amounts refunded for this item, calculated by iterating over
      invoice items associated with the item.


    **Returns:**
    - Sum of amounts refunded for this item


---

### getReturnCaseItems()
- getReturnCaseItems(): [Collection](dw.util.Collection.md)
  - : Returns all return case items associated with this item,
      each [ReturnCaseItem](dw.order.ReturnCaseItem.md) will belong to a different
      [ReturnCase](dw.order.ReturnCase.md), which can also be accessed using
      [Order.getReturnCases()](dw.order.Order.md#getreturncases) or [Order.getReturnCase(String)](dw.order.Order.md#getreturncasestring).


    **Returns:**
    - return case items associated with this item


---

### getReturnedQuantity()
- getReturnedQuantity(): [Quantity](dw.value.Quantity.md)
  - : The quantity returned, dynamically sum of quantities held by associated
      ReturnItems.


    **Returns:**
    - quantity returned, the sum of quantities held by associated
              ReturnItems



---

### getShippingOrderItem()
- ~~getShippingOrderItem(): [ShippingOrderItem](dw.order.ShippingOrderItem.md)~~
  - : The last added non-cancelled shipping order item if one exists, otherwise `null`.
      
      
      Multiple shipping order items that are not in status [ShippingOrderItem.STATUS_CANCELLED](dw.order.ShippingOrderItem.md#status_cancelled)
      can exist for one OrderItem, for example if the OrderItem has been split for shipping purposes.
      The method returns `null` if no non-cancelled shipping order item exists.


    **Returns:**
    - the last not cancelled shipping order item or `null`


---

### getShippingOrderItems()
- getShippingOrderItems(): [Collection](dw.util.Collection.md)
  - : Returns a collection of the [ShippingOrderItem](dw.order.ShippingOrderItem.md)s created for this item.
      ShippingOrder items represents the whole or part of this item which could
      be delivered, and belong to a shipping order.
      Note that the cancelled shipping order items are returned too.
      This method is equivalent to [getShippingOrderItems(Boolean)](dw.order.OrderItem.md#getshippingorderitemsboolean)
      called with parameter `true`.


    **Returns:**
    - collection of the shipping order items created for this item


---

### getShippingOrderItems(Boolean)
- getShippingOrderItems(includeCancelled: [Boolean](TopLevel.Boolean.md)): [Collection](dw.util.Collection.md)
  - : Returns a collection of the [ShippingOrderItem](dw.order.ShippingOrderItem.md)s created for this item.
      ShippingOrder items represent the whole or part of this item which could
      be delivered, and belong to a shipping order.
      Depending on the `includeCancelled` parameter the cancelled shipping order
      items will be returned or not.


    **Parameters:**
    - includeCancelled -              <li>`true` all shipping order items, including the             cancelled, created for this item will be returned</li>             <li>`false` only non-cancelled shipping order items             created for this item will be returned</li>             </ul>

    **Returns:**
    - collection of the shipping order items created for this item


---

### getSplitItems()
- getSplitItems(): [Collection](dw.util.Collection.md)
  - : Returns a collection of all split [OrderItem](dw.order.OrderItem.md)s associated with this item. Inverse relation to [getSplitSourceItem()](dw.order.OrderItem.md#getsplitsourceitem).
      
      
      Split order items are created when
      
      - creating a [ShippingOrderItem](dw.order.ShippingOrderItem.md)for a [ShippingOrder](dw.order.ShippingOrder.md), see [ShippingOrder.createShippingOrderItem(OrderItem, Quantity)](dw.order.ShippingOrder.md#createshippingorderitemorderitem-quantity)  - splitting an existing [ShippingOrderItem](dw.order.ShippingOrderItem.md), see [ShippingOrderItem.split(Quantity)](dw.order.ShippingOrderItem.md#splitquantity)with a specified quantity less than the existing quantity of the associated [ProductLineItem](dw.order.ProductLineItem.md). In this case the associated [ProductLineItem](dw.order.ProductLineItem.md)is split by creating a new [ProductLineItem](dw.order.ProductLineItem.md)and associating a new [ShippingOrderItem](dw.order.ShippingOrderItem.md)with this item. The new [ShippingOrderItem](dw.order.ShippingOrderItem.md)receives the specified quantity and the quantity of the item is set to the remaining quantity. All split items are associated to their originating item via    the "split source item" association.


    **Returns:**
    - the split order items associated with this item


---

### getSplitSourceItem()
- getSplitSourceItem(): [OrderItem](dw.order.OrderItem.md)
  - : Returns the split source item associated with this item, if existing. Inverse relation to [getSplitItems()](dw.order.OrderItem.md#getsplititems).
      
      
      A split source item is associated after the successful creation of a split item with a quantity less than the existing quantity of the item to split.
      For details see [getSplitItems()](dw.order.OrderItem.md#getsplititems).


    **Returns:**
    - the split source item or `null`


---

### getStatus()
- getStatus(): [EnumValue](dw.value.EnumValue.md)
  - : Gets the order item status.
      
      The possible values are:
      
      - [STATUS_NEW](dw.order.OrderItem.md#status_new)
      - [STATUS_OPEN](dw.order.OrderItem.md#status_open)
      - [STATUS_BACKORDER](dw.order.OrderItem.md#status_backorder)
      - [STATUS_CONFIRMED](dw.order.OrderItem.md#status_confirmed)
      - [STATUS_WAREHOUSE](dw.order.OrderItem.md#status_warehouse)
      - [STATUS_SHIPPED](dw.order.OrderItem.md#status_shipped)
      - [STATUS_CANCELLED](dw.order.OrderItem.md#status_cancelled)


    **Returns:**
    - the status


---

### getType()
- getType(): [EnumValue](dw.value.EnumValue.md)
  - : Returns the type of line item with which this instance is associated, one
      of
      
      - SERVICE (method [getLineItem()](dw.order.OrderItem.md#getlineitem)returns a  [ShippingLineItem](dw.order.ShippingLineItem.md)
      - PRODUCT (method [getLineItem()](dw.order.OrderItem.md#getlineitem)returns a  [ProductLineItem](dw.order.ProductLineItem.md)


    **Returns:**
    - the type of order item, one of [TYPE_PRODUCT](dw.order.OrderItem.md#type_product) or
              [TYPE_SERVICE](dw.order.OrderItem.md#type_service).



---

### setStatus(String)
- setStatus(status: [String](TopLevel.String.md)): void
  - : Set the status of the order item, use one of the values documented in [getStatus()](dw.order.OrderItem.md#getstatus).
      
      
      If the order item has a related shipping order item (see [getShippingOrderItem()](dw.order.OrderItem.md#getshippingorderitem)) the status of the
      shipping order item will be adjusted to the same status. Setting the status of an order item might also change
      the status of the related order. The following rules apply in top-down order:
      
      - all items [STATUS_CANCELLED](dw.order.OrderItem.md#status_cancelled)- order status is [Order.ORDER_STATUS_CANCELLED](dw.order.Order.md#order_status_cancelled)
      - at least one item in status [STATUS_SHIPPED](dw.order.OrderItem.md#status_shipped)and all other items are [STATUS_CANCELLED](dw.order.OrderItem.md#status_cancelled)order  status is [Order.ORDER_STATUS_COMPLETED](dw.order.Order.md#order_status_completed)
      - at least one item in status [STATUS_CREATED](dw.order.OrderItem.md#status_created), [STATUS_OPEN](dw.order.OrderItem.md#status_open), [STATUS_NEW](dw.order.OrderItem.md#status_new), [STATUS_BACKORDER](dw.order.OrderItem.md#status_backorder)- order status is [Order.ORDER_STATUS_OPEN](dw.order.Order.md#order_status_open), order confirmation status  is [Order.CONFIRMATION_STATUS_NOTCONFIRMED](dw.order.Order.md#confirmation_status_notconfirmed)
      - other combinations will have only items in [STATUS_CONFIRMED](dw.order.OrderItem.md#status_confirmed), [STATUS_CANCELLED](dw.order.OrderItem.md#status_cancelled)and  [STATUS_SHIPPED](dw.order.OrderItem.md#status_shipped)- order status is [Order.ORDER_STATUS_OPEN](dw.order.Order.md#order_status_open), order confirmation status is  [Order.CONFIRMATION_STATUS_CONFIRMED](dw.order.Order.md#confirmation_status_confirmed)


    **Parameters:**
    - status - status string matching one of the values for status


---

<!-- prettier-ignore-end -->
