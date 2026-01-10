<!-- prettier-ignore-start -->
# Class ShippingOrder

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.object.Extensible](dw.object.Extensible.md)
    - [dw.order.AbstractItemCtnr](dw.order.AbstractItemCtnr.md)
      - [dw.order.ShippingOrder](dw.order.ShippingOrder.md)

A shipping order is used to specify items that should be shipped, and is
typically exported to, and updated by a back-office warehouse management
system.


An [Order](dw.order.Order.md) can have n shipping orders expressing how the order
is to be shipped. The creation, export and update of shipping orders is
largely handled by custom logic in scripts by implementing
[ShippingOrderHooks](dw.order.hooks.ShippingOrderHooks.md). Use method
[Order.createShippingOrder()](dw.order.Order.md#createshippingorder) for creation and add items using
[createShippingOrderItem(OrderItem, Quantity)](dw.order.ShippingOrder.md#createshippingorderitemorderitem-quantity) - each item is related
to an order item which in turn represents a product- or shipping- line item
in the order.


A shipping order has a status calculated from its item status, one of

- CONFIRMED - shipping order not yet exported, with 0 items, or all items  in status CONFIRMED.
- WAREHOUSE - shipping order exported, with all items in status WAREHOUSE.
- SHIPPED - exported shipping order has been updated, with 1-n items in  status SHIPPED and 0-n CANCELLED.
- CANCELLED - exported shipping order has been updated, with all items in  status CANCELLED.



The following status transitions are supported. Every status transition is
documented by the addition of an order note such as 'Shipping order 123456
status changed to WAREHOUSE.':
| From | To | When | Use |
| --- |--- |--- |--- |
| CONFIRMED | WAREHOUSE | Shipping order exported | Call [setStatusWarehouse()](dw.order.ShippingOrder.md#setstatuswarehouse) - note this is the only way to set the  items to status WAREHOUSE |
| WAREHOUSE | SHIPPED | One or more items have been SHIPPED | Call [ShippingOrderItem.setStatus(String)](dw.order.ShippingOrderItem.md#setstatusstring) using  [ShippingOrderItem.STATUS_SHIPPED](dw.order.ShippingOrderItem.md#status_shipped) |
| WAREHOUSE | CANCELLED | All items have been CANCELLED | Call [ShippingOrderItem.setStatus(String)](dw.order.ShippingOrderItem.md#setstatusstring) using  [ShippingOrderItem.STATUS_CANCELLED](dw.order.ShippingOrderItem.md#status_cancelled) |



Order post-processing APIs (gillian) are now inactive by default and will throw
an exception if accessed. Activation needs preliminary approval by Product Management.
Please contact support in this case. Existing customers using these APIs are not
affected by this change and can use the APIs until further notice.



## Constant Summary

| Constant | Description |
| --- | --- |
| [ORDERBY_ITEMID](#orderby_itemid): [Object](TopLevel.Object.md) | Sorting by item id. |
| [ORDERBY_ITEMPOSITION](#orderby_itemposition): [Object](TopLevel.Object.md) | Sorting by the position of the related oder item. |
| [ORDERBY_UNSORTED](#orderby_unsorted): [Object](TopLevel.Object.md) | Unsorted , as it is. |
| [QUALIFIER_PRODUCTITEMS](#qualifier_productitems): [Object](TopLevel.Object.md) | Selects the product items. |
| [QUALIFIER_SERVICEITEMS](#qualifier_serviceitems): [Object](TopLevel.Object.md) | Selects for the service items. |
| [STATUS_CANCELLED](#status_cancelled): [String](TopLevel.String.md) = "CANCELLED" | Constant for Shipping Order Status CANCELLED |
| [STATUS_CONFIRMED](#status_confirmed): [String](TopLevel.String.md) = "CONFIRMED" | Constant for Shipping Order Status CONFIRMED |
| [STATUS_SHIPPED](#status_shipped): [String](TopLevel.String.md) = "SHIPPED" | Constant for Shipping Order Status SHIPPED |
| [STATUS_WAREHOUSE](#status_warehouse): [String](TopLevel.String.md) = "WAREHOUSE" | Constant for Shipping Order Status WAREHOUSE |

## Property Summary

| Property | Description |
| --- | --- |
| [invoice](#invoice): [Invoice](dw.order.Invoice.md) `(read-only)` | Returns null or the previously created [Invoice](dw.order.Invoice.md). |
| [invoiceNumber](#invoicenumber): [String](TopLevel.String.md) `(read-only)` | Returns `null` or the invoice-number. |
| [items](#items): [FilteringCollection](dw.util.FilteringCollection.md) `(read-only)` | A filtering collection of the shipping order items belonging to the  shipping order. |
| [shipDate](#shipdate): [Date](TopLevel.Date.md) | Gets the shipping date. |
| [shippingAddress](#shippingaddress): [OrderAddress](dw.order.OrderAddress.md) | Returns the shipping address (optional, can be null). |
| [shippingMethod](#shippingmethod): [ShippingMethod](dw.order.ShippingMethod.md) `(read-only)` | Returns the shipping method of the shipping order. |
| [shippingOrderNumber](#shippingordernumber): [String](TopLevel.String.md) `(read-only)` | Gets the shipping order number. |
| [status](#status): [EnumValue](dw.value.EnumValue.md) `(read-only)` | Gets the status of this shipping order. |
| [trackingInfos](#trackinginfos): [Collection](dw.util.Collection.md) `(read-only)` | Gets all tracking informations for this shipping order. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [addTrackingInfo](dw.order.ShippingOrder.md#addtrackinginfostring)([String](TopLevel.String.md)) | Adds a tracking info to this shipping order with the given ID. |
| [createInvoice](dw.order.ShippingOrder.md#createinvoice)() | Creates a new [Invoice](dw.order.Invoice.md) based on this  ShippingOrder. |
| [createInvoice](dw.order.ShippingOrder.md#createinvoicestring)([String](TopLevel.String.md)) | Creates a new [Invoice](dw.order.Invoice.md) based on this ShippingOrder. |
| [createShippingOrderItem](dw.order.ShippingOrder.md#createshippingorderitemorderitem-quantity)([OrderItem](dw.order.OrderItem.md), [Quantity](dw.value.Quantity.md)) | Create a [ShippingOrderItem](dw.order.ShippingOrderItem.md) in the shipping order with  the number `shippingOrderNumber`. |
| [createShippingOrderItem](dw.order.ShippingOrder.md#createshippingorderitemorderitem-quantity-boolean)([OrderItem](dw.order.OrderItem.md), [Quantity](dw.value.Quantity.md), [Boolean](TopLevel.Boolean.md)) | Create a [ShippingOrderItem](dw.order.ShippingOrderItem.md) in the shipping order with  the number `shippingOrderNumber`. |
| [getInvoice](dw.order.ShippingOrder.md#getinvoice)() | Returns null or the previously created [Invoice](dw.order.Invoice.md). |
| [getInvoiceNumber](dw.order.ShippingOrder.md#getinvoicenumber)() | Returns `null` or the invoice-number. |
| [getItems](dw.order.ShippingOrder.md#getitems)() | A filtering collection of the shipping order items belonging to the  shipping order. |
| [getShipDate](dw.order.ShippingOrder.md#getshipdate)() | Gets the shipping date. |
| [getShippingAddress](dw.order.ShippingOrder.md#getshippingaddress)() | Returns the shipping address (optional, can be null). |
| [getShippingMethod](dw.order.ShippingOrder.md#getshippingmethod)() | Returns the shipping method of the shipping order. |
| [getShippingOrderNumber](dw.order.ShippingOrder.md#getshippingordernumber)() | Gets the shipping order number. |
| [getStatus](dw.order.ShippingOrder.md#getstatus)() | Gets the status of this shipping order. |
| [getTrackingInfo](dw.order.ShippingOrder.md#gettrackinginfostring)([String](TopLevel.String.md)) | Gets a tracking info for this shipping order. |
| [getTrackingInfos](dw.order.ShippingOrder.md#gettrackinginfos)() | Gets all tracking informations for this shipping order. |
| [setShipDate](dw.order.ShippingOrder.md#setshipdatedate)([Date](TopLevel.Date.md)) | Sets the shipping date. |
| [setShippingAddress](dw.order.ShippingOrder.md#setshippingaddressorderaddress)([OrderAddress](dw.order.OrderAddress.md)) | Set a shipping address for the shipping order. |
| [setShippingMethodID](dw.order.ShippingOrder.md#setshippingmethodidstring)([String](TopLevel.String.md)) | Set the id of shipping method. |
| [setStatusWarehouse](dw.order.ShippingOrder.md#setstatuswarehouse)() | Set a CONFIRMED shipping order (all items in status CONFIRMED) to status  WAREHOUSE (all items in status WAREHOUSE).<br/>  Note - this method is the only way to transition a shipping order from  CONFIRMED to WAREHOUSE. |

### Methods inherited from class AbstractItemCtnr

[getCreatedBy](dw.order.AbstractItemCtnr.md#getcreatedby), [getCreationDate](dw.order.AbstractItemCtnr.md#getcreationdate), [getGrandTotal](dw.order.AbstractItemCtnr.md#getgrandtotal), [getItems](dw.order.AbstractItemCtnr.md#getitems), [getLastModified](dw.order.AbstractItemCtnr.md#getlastmodified), [getModifiedBy](dw.order.AbstractItemCtnr.md#getmodifiedby), [getOrder](dw.order.AbstractItemCtnr.md#getorder), [getProductSubtotal](dw.order.AbstractItemCtnr.md#getproductsubtotal), [getServiceSubtotal](dw.order.AbstractItemCtnr.md#getservicesubtotal)
### Methods inherited from class Extensible

[describe](dw.object.Extensible.md#describe), [getCustom](dw.object.Extensible.md#getcustom)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### ORDERBY_ITEMID

- ORDERBY_ITEMID: [Object](TopLevel.Object.md)
  - : Sorting by item id. Use with method [getItems()](dw.order.ShippingOrder.md#getitems) as an argument to
      method [FilteringCollection.sort(Object)](dw.util.FilteringCollection.md#sortobject).



---

### ORDERBY_ITEMPOSITION

- ORDERBY_ITEMPOSITION: [Object](TopLevel.Object.md)
  - : Sorting by the position of the related oder item. Use with method
      [getItems()](dw.order.ShippingOrder.md#getitems) as an argument to method
      [FilteringCollection.sort(Object)](dw.util.FilteringCollection.md#sortobject).



---

### ORDERBY_UNSORTED

- ORDERBY_UNSORTED: [Object](TopLevel.Object.md)
  - : Unsorted , as it is. Use with method [getItems()](dw.order.ShippingOrder.md#getitems) as an argument
      to method [FilteringCollection.sort(Object)](dw.util.FilteringCollection.md#sortobject).



---

### QUALIFIER_PRODUCTITEMS

- QUALIFIER_PRODUCTITEMS: [Object](TopLevel.Object.md)
  - : Selects the product items. Use with method [getItems()](dw.order.ShippingOrder.md#getitems) as an
      argument to method [FilteringCollection.select(Object)](dw.util.FilteringCollection.md#selectobject).



---

### QUALIFIER_SERVICEITEMS

- QUALIFIER_SERVICEITEMS: [Object](TopLevel.Object.md)
  - : Selects for the service items. Use with method [getItems()](dw.order.ShippingOrder.md#getitems) as an
      argument to method [FilteringCollection.select(Object)](dw.util.FilteringCollection.md#selectobject).



---

### STATUS_CANCELLED

- STATUS_CANCELLED: [String](TopLevel.String.md) = "CANCELLED"
  - : Constant for Shipping Order Status CANCELLED


---

### STATUS_CONFIRMED

- STATUS_CONFIRMED: [String](TopLevel.String.md) = "CONFIRMED"
  - : Constant for Shipping Order Status CONFIRMED


---

### STATUS_SHIPPED

- STATUS_SHIPPED: [String](TopLevel.String.md) = "SHIPPED"
  - : Constant for Shipping Order Status SHIPPED


---

### STATUS_WAREHOUSE

- STATUS_WAREHOUSE: [String](TopLevel.String.md) = "WAREHOUSE"
  - : Constant for Shipping Order Status WAREHOUSE


---

## Property Details

### invoice
- invoice: [Invoice](dw.order.Invoice.md) `(read-only)`
  - : Returns null or the previously created [Invoice](dw.order.Invoice.md).

    **See Also:**
    - [createInvoice(String)](dw.order.ShippingOrder.md#createinvoicestring)


---

### invoiceNumber
- invoiceNumber: [String](TopLevel.String.md) `(read-only)`
  - : Returns `null` or the invoice-number.

    **See Also:**
    - [createInvoice(String)](dw.order.ShippingOrder.md#createinvoicestring)


---

### items
- items: [FilteringCollection](dw.util.FilteringCollection.md) `(read-only)`
  - : A filtering collection of the shipping order items belonging to the
      shipping order.
      
      
      This [FilteringCollection](dw.util.FilteringCollection.md) could be sorted / filtered
      using:
      
      - [FilteringCollection.sort(Object)](dw.util.FilteringCollection.md#sortobject)with  [ORDERBY_ITEMID](dw.order.ShippingOrder.md#orderby_itemid)  - [FilteringCollection.sort(Object)](dw.util.FilteringCollection.md#sortobject)with    [ORDERBY_ITEMPOSITION](dw.order.ShippingOrder.md#orderby_itemposition)    - [FilteringCollection.sort(Object)](dw.util.FilteringCollection.md#sortobject)with      [ORDERBY_UNSORTED](dw.order.ShippingOrder.md#orderby_unsorted)      - [FilteringCollection.select(Object)](dw.util.FilteringCollection.md#selectobject)with        [QUALIFIER_PRODUCTITEMS](dw.order.ShippingOrder.md#qualifier_productitems)        - [FilteringCollection.select(Object)](dw.util.FilteringCollection.md#selectobject)with          [QUALIFIER_SERVICEITEMS](dw.order.ShippingOrder.md#qualifier_serviceitems)


    **See Also:**
    - [createShippingOrderItem(OrderItem, Quantity)](dw.order.ShippingOrder.md#createshippingorderitemorderitem-quantity)
    - [ShippingOrderItem](dw.order.ShippingOrderItem.md)


---

### shipDate
- shipDate: [Date](TopLevel.Date.md)
  - : Gets the shipping date.
      
      
      Returns `null` if this shipping order is not yet shipped.



---

### shippingAddress
- shippingAddress: [OrderAddress](dw.order.OrderAddress.md)
  - : Returns the shipping address (optional, can be null).
      
      
      
      Note: the shipping address is not copied into the
      ShippingOrder but is a link to a
      [OrderAddress](dw.order.OrderAddress.md) held in the [Order](dw.order.Order.md).



---

### shippingMethod
- shippingMethod: [ShippingMethod](dw.order.ShippingMethod.md) `(read-only)`
  - : Returns the shipping method of the shipping order.
      
      
      Can be `null`.



---

### shippingOrderNumber
- shippingOrderNumber: [String](TopLevel.String.md) `(read-only)`
  - : Gets the shipping order number.


---

### status
- status: [EnumValue](dw.value.EnumValue.md) `(read-only)`
  - : Gets the status of this shipping order. The status is read-only and
      calculated from the item status. See class documentation for more
      details.
      
      The possible values are [STATUS_CONFIRMED](dw.order.ShippingOrder.md#status_confirmed),
      [STATUS_WAREHOUSE](dw.order.ShippingOrder.md#status_warehouse), [STATUS_SHIPPED](dw.order.ShippingOrder.md#status_shipped),
      [STATUS_CANCELLED](dw.order.ShippingOrder.md#status_cancelled).



---

### trackingInfos
- trackingInfos: [Collection](dw.util.Collection.md) `(read-only)`
  - : Gets all tracking informations for this shipping order.

    **See Also:**
    - [TrackingInfo](dw.order.TrackingInfo.md)


---

## Method Details

### addTrackingInfo(String)
- addTrackingInfo(trackingInfoID: [String](TopLevel.String.md)): [TrackingInfo](dw.order.TrackingInfo.md)
  - : Adds a tracking info to this shipping order with the given ID.

    **Parameters:**
    - trackingInfoID - the tracking info id

    **Returns:**
    - the new tracking info

    **See Also:**
    - [TrackingInfo](dw.order.TrackingInfo.md)


---

### createInvoice()
- createInvoice(): [Invoice](dw.order.Invoice.md)
  - : Creates a new [Invoice](dw.order.Invoice.md) based on this
      ShippingOrder.
      
      
      The shipping-order-number will be used as the
      invoice-number. The Invoice can then be accessed using
      [getInvoice()](dw.order.ShippingOrder.md#getinvoice) or [getInvoiceNumber()](dw.order.ShippingOrder.md#getinvoicenumber) can be used.
      The method must not be called more than once for a ShippingOrder,
      nor may 2 Invoices exist with the same invoice-number.
      
      
      The new Invoice is a debit-invoice with a status
      [Invoice.STATUS_NOT_PAID](dw.order.Invoice.md#status_not_paid), and will be passed to the
      capture payment-hook in a separate database transaction for processing.


    **Returns:**
    - new invoice


---

### createInvoice(String)
- createInvoice(invoiceNumber: [String](TopLevel.String.md)): [Invoice](dw.order.Invoice.md)
  - : Creates a new [Invoice](dw.order.Invoice.md) based on this ShippingOrder.
      
      
      The invoice-number must be specified as an argument.The Invoice can then be accessed using
      [getInvoice()](dw.order.ShippingOrder.md#getinvoice) or [getInvoiceNumber()](dw.order.ShippingOrder.md#getinvoicenumber) can be used.
      The method must not be called more than once for a ShippingOrder,
      nor may 2 Invoices exist with the same invoice-number.
      
      
      The new Invoice is a debit-invoice with a status [Invoice.STATUS_NOT_PAID](dw.order.Invoice.md#status_not_paid), and
      will be passed to the capture payment-hook in a separate database
      transaction for processing.


    **Parameters:**
    - invoiceNumber - the invoice-number to use

    **Returns:**
    - new invoice


---

### createShippingOrderItem(OrderItem, Quantity)
- createShippingOrderItem(orderItem: [OrderItem](dw.order.OrderItem.md), quantity: [Quantity](dw.value.Quantity.md)): [ShippingOrderItem](dw.order.ShippingOrderItem.md)
  - : Create a [ShippingOrderItem](dw.order.ShippingOrderItem.md) in the shipping order with
      the number `shippingOrderNumber`.
      
      
      The quantity of the new item can be optionally specified. A quantity of
      `null` indicates the new item should be based on the entire order item and
      is recommended for [ShippingLineItem](dw.order.ShippingLineItem.md)s. If a quantity is
      specified for a [ProductLineItem](dw.order.ProductLineItem.md) which is less than
      [ProductLineItem.getQuantity()](dw.order.ProductLineItem.md#getquantity) the
      ProductLineItem will be split, creating a new
      ProductLineItem. The new
      ShippingOrderItem will be associated with the new
      ProductLineItem, which will receive the specified
      quantity.
      See also [createShippingOrderItem(OrderItem, Quantity, Boolean)](dw.order.ShippingOrder.md#createshippingorderitemorderitem-quantity-boolean).


    **Parameters:**
    - quantity - the quantity for which the shipping order item will be created
    - orderItem - the order item for which the shipping order item is to be created

    **Returns:**
    - the created shipping order item


---

### createShippingOrderItem(OrderItem, Quantity, Boolean)
- createShippingOrderItem(orderItem: [OrderItem](dw.order.OrderItem.md), quantity: [Quantity](dw.value.Quantity.md), splitIfPartial: [Boolean](TopLevel.Boolean.md)): [ShippingOrderItem](dw.order.ShippingOrderItem.md)
  - : Create a [ShippingOrderItem](dw.order.ShippingOrderItem.md) in the shipping order with
      the number `shippingOrderNumber`.
      
      
      The quantity of the new item can be optionally specified. A quantity of
      `null` indicates the new item should be based on the entire order item and
      is recommended for [ShippingLineItem](dw.order.ShippingLineItem.md)s.
      If the specified quantity is less than [ProductLineItem.getQuantity()](dw.order.ProductLineItem.md#getquantity) the
      ProductLineItem will be split or not depending on `splitIfPartial` parameter.
      When `split` is `true`, the method is equivalent to
      [createShippingOrderItem(OrderItem, Quantity)](dw.order.ShippingOrder.md#createshippingorderitemorderitem-quantity).


    **Parameters:**
    - quantity - the quantity for which the shipping order item will be created, not null
    - orderItem - the order item for which the shipping order item is to be created
    - splitIfPartial - the flag whether ProductLineItem should be split when requested             quantity is less than ProductLineItem's quantity

    **Returns:**
    - the created shipping order item


---

### getInvoice()
- getInvoice(): [Invoice](dw.order.Invoice.md)
  - : Returns null or the previously created [Invoice](dw.order.Invoice.md).

    **Returns:**
    - null or the previously created invoice.

    **See Also:**
    - [createInvoice(String)](dw.order.ShippingOrder.md#createinvoicestring)


---

### getInvoiceNumber()
- getInvoiceNumber(): [String](TopLevel.String.md)
  - : Returns `null` or the invoice-number.

    **Returns:**
    - `null` or the previously created invoice number.

    **See Also:**
    - [createInvoice(String)](dw.order.ShippingOrder.md#createinvoicestring)


---

### getItems()
- getItems(): [FilteringCollection](dw.util.FilteringCollection.md)
  - : A filtering collection of the shipping order items belonging to the
      shipping order.
      
      
      This [FilteringCollection](dw.util.FilteringCollection.md) could be sorted / filtered
      using:
      
      - [FilteringCollection.sort(Object)](dw.util.FilteringCollection.md#sortobject)with  [ORDERBY_ITEMID](dw.order.ShippingOrder.md#orderby_itemid)  - [FilteringCollection.sort(Object)](dw.util.FilteringCollection.md#sortobject)with    [ORDERBY_ITEMPOSITION](dw.order.ShippingOrder.md#orderby_itemposition)    - [FilteringCollection.sort(Object)](dw.util.FilteringCollection.md#sortobject)with      [ORDERBY_UNSORTED](dw.order.ShippingOrder.md#orderby_unsorted)      - [FilteringCollection.select(Object)](dw.util.FilteringCollection.md#selectobject)with        [QUALIFIER_PRODUCTITEMS](dw.order.ShippingOrder.md#qualifier_productitems)        - [FilteringCollection.select(Object)](dw.util.FilteringCollection.md#selectobject)with          [QUALIFIER_SERVICEITEMS](dw.order.ShippingOrder.md#qualifier_serviceitems)


    **Returns:**
    - the filtering collection of the shipping items.

    **See Also:**
    - [createShippingOrderItem(OrderItem, Quantity)](dw.order.ShippingOrder.md#createshippingorderitemorderitem-quantity)
    - [ShippingOrderItem](dw.order.ShippingOrderItem.md)


---

### getShipDate()
- getShipDate(): [Date](TopLevel.Date.md)
  - : Gets the shipping date.
      
      
      Returns `null` if this shipping order is not yet shipped.


    **Returns:**
    - the shipping date or `null`


---

### getShippingAddress()
- getShippingAddress(): [OrderAddress](dw.order.OrderAddress.md)
  - : Returns the shipping address (optional, can be null).
      
      
      
      Note: the shipping address is not copied into the
      ShippingOrder but is a link to a
      [OrderAddress](dw.order.OrderAddress.md) held in the [Order](dw.order.Order.md).


    **Returns:**
    - the shipping address or `null`


---

### getShippingMethod()
- getShippingMethod(): [ShippingMethod](dw.order.ShippingMethod.md)
  - : Returns the shipping method of the shipping order.
      
      
      Can be `null`.


    **Returns:**
    - the shipping method or `null`


---

### getShippingOrderNumber()
- getShippingOrderNumber(): [String](TopLevel.String.md)
  - : Gets the shipping order number.

    **Returns:**
    - the shipping order number


---

### getStatus()
- getStatus(): [EnumValue](dw.value.EnumValue.md)
  - : Gets the status of this shipping order. The status is read-only and
      calculated from the item status. See class documentation for more
      details.
      
      The possible values are [STATUS_CONFIRMED](dw.order.ShippingOrder.md#status_confirmed),
      [STATUS_WAREHOUSE](dw.order.ShippingOrder.md#status_warehouse), [STATUS_SHIPPED](dw.order.ShippingOrder.md#status_shipped),
      [STATUS_CANCELLED](dw.order.ShippingOrder.md#status_cancelled).


    **Returns:**
    - the status


---

### getTrackingInfo(String)
- getTrackingInfo(trackingInfoID: [String](TopLevel.String.md)): [TrackingInfo](dw.order.TrackingInfo.md)
  - : Gets a tracking info for this shipping order.

    **Parameters:**
    - trackingInfoID - the tracking info id

    **Returns:**
    - the tracking info or `null`

    **See Also:**
    - [TrackingInfo](dw.order.TrackingInfo.md)


---

### getTrackingInfos()
- getTrackingInfos(): [Collection](dw.util.Collection.md)
  - : Gets all tracking informations for this shipping order.

    **Returns:**
    - all tracking informations for this shipping order

    **See Also:**
    - [TrackingInfo](dw.order.TrackingInfo.md)


---

### setShipDate(Date)
- setShipDate(date: [Date](TopLevel.Date.md)): void
  - : Sets the shipping date.

    **Parameters:**
    - date - the ship date


---

### setShippingAddress(OrderAddress)
- setShippingAddress(address: [OrderAddress](dw.order.OrderAddress.md)): void
  - : Set a shipping address for the shipping order.

    **Parameters:**
    - address - the shipping address

    **See Also:**
    - [getShippingAddress()](dw.order.ShippingOrder.md#getshippingaddress)


---

### setShippingMethodID(String)
- setShippingMethodID(shippingMethodID: [String](TopLevel.String.md)): void
  - : Set the id of shipping method.

    **Parameters:**
    - shippingMethodID - the id of the shipping method

    **See Also:**
    - [ShippingMethod.getID()](dw.order.ShippingMethod.md#getid)


---

### setStatusWarehouse()
- setStatusWarehouse(): void
  - : Set a CONFIRMED shipping order (all items in status CONFIRMED) to status
      WAREHOUSE (all items in status WAREHOUSE).
      
      Note - this method is the only way to transition a shipping order from
      CONFIRMED to WAREHOUSE.


    **Throws:**
    - IllegalArgumentException - if the shipping order is in a status other than CONFIRMED.


---

<!-- prettier-ignore-end -->
