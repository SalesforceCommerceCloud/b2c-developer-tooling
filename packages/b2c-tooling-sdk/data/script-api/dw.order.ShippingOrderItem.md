<!-- prettier-ignore-start -->
# Class ShippingOrderItem

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.object.Extensible](dw.object.Extensible.md)
    - [dw.order.AbstractItem](dw.order.AbstractItem.md)
      - [dw.order.ShippingOrderItem](dw.order.ShippingOrderItem.md)

One or more ShippingOrderItems are contained in a
[ShippingOrder](dw.order.ShippingOrder.md), created using
[ShippingOrder.createShippingOrderItem(OrderItem, Quantity)](dw.order.ShippingOrder.md#createshippingorderitemorderitem-quantity)
and can be retrieved by
[ShippingOrder.getItems()](dw.order.ShippingOrder.md#getitems). A
ShippingOrderItem references a single
[OrderItem](dw.order.OrderItem.md) which in turn references a
[LineItem](dw.order.LineItem.md) associated with an [Order](dw.order.Order.md).


Order post-processing APIs (gillian) are now inactive by default and will throw
an exception if accessed. Activation needs preliminary approval by Product Management.
Please contact support in this case. Existing customers using these APIs are not
affected by this change and can use the APIs until further notice.



## Constant Summary

| Constant | Description |
| --- | --- |
| [STATUS_CANCELLED](#status_cancelled): [String](TopLevel.String.md) = "CANCELLED" | Constant for Order Item Status CANCELLED |
| [STATUS_CONFIRMED](#status_confirmed): [String](TopLevel.String.md) = "CONFIRMED" | Constant for Order Item Status CONFIRMED |
| [STATUS_SHIPPED](#status_shipped): [String](TopLevel.String.md) = "SHIPPED" | Constant for Order Item Status SHIPPED |
| [STATUS_WAREHOUSE](#status_warehouse): [String](TopLevel.String.md) = "WAREHOUSE" | Constant for Order Item Status WAREHOUSE |

## Property Summary

| Property | Description |
| --- | --- |
| [basePrice](#baseprice): [Money](dw.value.Money.md) `(read-only)` | Price of a single unit before discount application. |
| [parentItem](#parentitem): [ShippingOrderItem](dw.order.ShippingOrderItem.md) | Returns null or the parent item. |
| [quantity](#quantity): [Quantity](dw.value.Quantity.md) `(read-only)` | The quantity of the shipping order item. |
| [shippingOrderNumber](#shippingordernumber): [String](TopLevel.String.md) `(read-only)` | The mandatory shipping order number of the related  [ShippingOrder](dw.order.ShippingOrder.md). |
| [status](#status): [EnumValue](dw.value.EnumValue.md) | Gets the order item status. |
| [trackingRefs](#trackingrefs): [FilteringCollection](dw.util.FilteringCollection.md) `(read-only)` | Gets the tracking refs (tracking infos) the shipping order item is  assigned to. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [addTrackingRef](dw.order.ShippingOrderItem.md#addtrackingrefstring-quantity)([String](TopLevel.String.md), [Quantity](dw.value.Quantity.md)) | A shipping order item can be assigned  to one or many [tracking infos](dw.order.TrackingInfo.md) with  different quantities. |
| [applyPriceRate](dw.order.ShippingOrderItem.md#applypriceratedecimal-decimal-boolean)([Decimal](dw.util.Decimal.md), [Decimal](dw.util.Decimal.md), [Boolean](TopLevel.Boolean.md)) | Apply a rate of (factor / divisor) to the prices in this item, with the option to half round up or half round down to the  nearest cent if necessary. |
| [getBasePrice](dw.order.ShippingOrderItem.md#getbaseprice)() | Price of a single unit before discount application. |
| [getParentItem](dw.order.ShippingOrderItem.md#getparentitem)() | Returns null or the parent item. |
| [getQuantity](dw.order.ShippingOrderItem.md#getquantity)() | The quantity of the shipping order item. |
| [getShippingOrderNumber](dw.order.ShippingOrderItem.md#getshippingordernumber)() | The mandatory shipping order number of the related  [ShippingOrder](dw.order.ShippingOrder.md). |
| [getStatus](dw.order.ShippingOrderItem.md#getstatus)() | Gets the order item status. |
| [getTrackingRefs](dw.order.ShippingOrderItem.md#gettrackingrefs)() | Gets the tracking refs (tracking infos) the shipping order item is  assigned to. |
| [setParentItem](dw.order.ShippingOrderItem.md#setparentitemshippingorderitem)([ShippingOrderItem](dw.order.ShippingOrderItem.md)) | Set a parent item. |
| [setStatus](dw.order.ShippingOrderItem.md#setstatusstring)([String](TopLevel.String.md)) | Sets the status. |
| [split](dw.order.ShippingOrderItem.md#splitquantity)([Quantity](dw.value.Quantity.md)) | Split the shipping order item. |
| [split](dw.order.ShippingOrderItem.md#splitquantity-boolean)([Quantity](dw.value.Quantity.md), [Boolean](TopLevel.Boolean.md)) | Split the shipping order item. |

### Methods inherited from class AbstractItem

[getGrossPrice](dw.order.AbstractItem.md#getgrossprice), [getItemID](dw.order.AbstractItem.md#getitemid), [getLineItem](dw.order.AbstractItem.md#getlineitem), [getNetPrice](dw.order.AbstractItem.md#getnetprice), [getOrderItem](dw.order.AbstractItem.md#getorderitem), [getOrderItemID](dw.order.AbstractItem.md#getorderitemid), [getTax](dw.order.AbstractItem.md#gettax), [getTaxBasis](dw.order.AbstractItem.md#gettaxbasis), [getTaxItems](dw.order.AbstractItem.md#gettaxitems)
### Methods inherited from class Extensible

[describe](dw.object.Extensible.md#describe), [getCustom](dw.object.Extensible.md#getcustom)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### STATUS_CANCELLED

- STATUS_CANCELLED: [String](TopLevel.String.md) = "CANCELLED"
  - : Constant for Order Item Status CANCELLED


---

### STATUS_CONFIRMED

- STATUS_CONFIRMED: [String](TopLevel.String.md) = "CONFIRMED"
  - : Constant for Order Item Status CONFIRMED


---

### STATUS_SHIPPED

- STATUS_SHIPPED: [String](TopLevel.String.md) = "SHIPPED"
  - : Constant for Order Item Status SHIPPED


---

### STATUS_WAREHOUSE

- STATUS_WAREHOUSE: [String](TopLevel.String.md) = "WAREHOUSE"
  - : Constant for Order Item Status WAREHOUSE


---

## Property Details

### basePrice
- basePrice: [Money](dw.value.Money.md) `(read-only)`
  - : Price of a single unit before discount application.


---

### parentItem
- parentItem: [ShippingOrderItem](dw.order.ShippingOrderItem.md)
  - : Returns null or the parent item.


---

### quantity
- quantity: [Quantity](dw.value.Quantity.md) `(read-only)`
  - : The quantity of the shipping order item.
      
      
      The [Quantity](dw.value.Quantity.md) is equal to the related line item quantity.



---

### shippingOrderNumber
- shippingOrderNumber: [String](TopLevel.String.md) `(read-only)`
  - : The mandatory shipping order number of the related
      [ShippingOrder](dw.order.ShippingOrder.md).



---

### status
- status: [EnumValue](dw.value.EnumValue.md)
  - : Gets the order item status.
      
      
      The possible values are [STATUS_CONFIRMED](dw.order.ShippingOrderItem.md#status_confirmed),
      [STATUS_WAREHOUSE](dw.order.ShippingOrderItem.md#status_warehouse), [STATUS_SHIPPED](dw.order.ShippingOrderItem.md#status_shipped),
      [STATUS_CANCELLED](dw.order.ShippingOrderItem.md#status_cancelled).



---

### trackingRefs
- trackingRefs: [FilteringCollection](dw.util.FilteringCollection.md) `(read-only)`
  - : Gets the tracking refs (tracking infos) the shipping order item is
      assigned to.


    **See Also:**
    - [TrackingRef](dw.order.TrackingRef.md)


---

## Method Details

### addTrackingRef(String, Quantity)
- addTrackingRef(trackingInfoID: [String](TopLevel.String.md), quantity: [Quantity](dw.value.Quantity.md)): [TrackingRef](dw.order.TrackingRef.md)
  - : A shipping order item can be assigned
      to one or many [tracking infos](dw.order.TrackingInfo.md) with
      different quantities. For example an item with quantity 3 may have been
      shipped in 2 packages, each represented by its own
      tracking info - 2
      [TrackingRef](dw.order.TrackingRef.md)s would exist with quantities 1 and 2.
      
      
      This method creates and adds a new tracking
      reference to this shipping order item for a given
      tracking info and quantity. The new
      instance is returned.


    **Parameters:**
    - trackingInfoID - the id of the tracking info
    - quantity - the quantity the which is assigned to the tracking info for             this shipping order item. Optional (null is allowed).

    **Returns:**
    - the new tracking reference

    **See Also:**
    - [TrackingRef](dw.order.TrackingRef.md)


---

### applyPriceRate(Decimal, Decimal, Boolean)
- applyPriceRate(factor: [Decimal](dw.util.Decimal.md), divisor: [Decimal](dw.util.Decimal.md), roundUp: [Boolean](TopLevel.Boolean.md)): void
  - : Apply a rate of (factor / divisor) to the prices in this item, with the option to half round up or half round down to the
      nearest cent if necessary.
      
      _Examples_:
      
      | TaxBasis before | factor | divisor | roundup | Calculation | TaxBasis after |
      | --- |--- |--- |--- |--- |--- |
      | $10.00 | 1 | 2 | true | 10\*1/2= | $5.00 |
      | $10.00 | 9 | 10 | true | 10\*9/10= | $9.00 |
      | $10.00 | 1 | 3 | true | 10\*1/3=3.3333= | $3.33 |
      |  $2.47 | 1 | 2 | true | 2.47\*1/2=1.235= | $1.24 |
      |  $2.47 | 1 | 2 | false | 2.47\*1/2=1.235= | $1.23 |
      
      
      _Which prices are updated?_:
      
      The rate described above is applied to tax-basis and tax then the net-price and gross-price are recalculated by adding / subtracting
      depending on whether the order is based on net price.
      
      _Example (order based on net price)_
      
      New TaxBasis:$10.00, Tax:$1.00, NetPrice=TaxBasis=$10.00, GrossPrice=TaxBasis+Tax=$11.00
      
      _Example (order based on gross price)_
      
      New TaxBasis:$10.00, Tax:$1.00, NetPrice=TaxBasis-tax=$9.00, GrossPrice=TaxBasis=$10.00


    **Parameters:**
    - factor - factor used to calculate rate
    - divisor - divisor used to calculate rate
    - roundUp - whether to round up or down on 0.5

    **See Also:**
    - [AbstractItem.getTaxBasis()](dw.order.AbstractItem.md#gettaxbasis)
    - [AbstractItem.getTax()](dw.order.AbstractItem.md#gettax)
    - [AbstractItem.getNetPrice()](dw.order.AbstractItem.md#getnetprice)
    - [AbstractItem.getGrossPrice()](dw.order.AbstractItem.md#getgrossprice)
    - [TaxMgr.getTaxationPolicy()](dw.order.TaxMgr.md#gettaxationpolicy)


---

### getBasePrice()
- getBasePrice(): [Money](dw.value.Money.md)
  - : Price of a single unit before discount application.

    **Returns:**
    - Price of a single unit before discount application.


---

### getParentItem()
- getParentItem(): [ShippingOrderItem](dw.order.ShippingOrderItem.md)
  - : Returns null or the parent item.

    **Returns:**
    - null or the parent item.


---

### getQuantity()
- getQuantity(): [Quantity](dw.value.Quantity.md)
  - : The quantity of the shipping order item.
      
      
      The [Quantity](dw.value.Quantity.md) is equal to the related line item quantity.


    **Returns:**
    - the quantity


---

### getShippingOrderNumber()
- getShippingOrderNumber(): [String](TopLevel.String.md)
  - : The mandatory shipping order number of the related
      [ShippingOrder](dw.order.ShippingOrder.md).


    **Returns:**
    - the shipping order number.


---

### getStatus()
- getStatus(): [EnumValue](dw.value.EnumValue.md)
  - : Gets the order item status.
      
      
      The possible values are [STATUS_CONFIRMED](dw.order.ShippingOrderItem.md#status_confirmed),
      [STATUS_WAREHOUSE](dw.order.ShippingOrderItem.md#status_warehouse), [STATUS_SHIPPED](dw.order.ShippingOrderItem.md#status_shipped),
      [STATUS_CANCELLED](dw.order.ShippingOrderItem.md#status_cancelled).


    **Returns:**
    - the status


---

### getTrackingRefs()
- getTrackingRefs(): [FilteringCollection](dw.util.FilteringCollection.md)
  - : Gets the tracking refs (tracking infos) the shipping order item is
      assigned to.


    **Returns:**
    - the tracking refs ( tracking infos - [TrackingRef](dw.order.TrackingRef.md)
              ) the shipping order item is assigned to.


    **See Also:**
    - [TrackingRef](dw.order.TrackingRef.md)


---

### setParentItem(ShippingOrderItem)
- setParentItem(parentItem: [ShippingOrderItem](dw.order.ShippingOrderItem.md)): void
  - : Set a parent item. The parent item must belong to the same
      [ShippingOrder](dw.order.ShippingOrder.md). An infinite parent-child loop is disallowed
      as is a parent-child depth greater than 10. Setting a parent item
      indicates a dependency of the child item on the parent item, and can be
      used to form a parallel structure to that accessed using
      [ProductLineItem.getParent()](dw.order.ProductLineItem.md#getparent).


    **Parameters:**
    - parentItem - The parent item, null is allowed


---

### setStatus(String)
- setStatus(status: [String](TopLevel.String.md)): void
  - : Sets the status. See [ShippingOrder](dw.order.ShippingOrder.md) for details of
      shipping order status transitions. Do not use this method to set a
      shipping order to status WAREHOUSE, instead use
      [ShippingOrder.setStatusWarehouse()](dw.order.ShippingOrder.md#setstatuswarehouse)
      
      
      This also triggers the setting of the status of the
      [LineItem](dw.order.LineItem.md) when appropriate. Setting this status can also have an impact on
      the order status, accessed using [Order.getStatus()](dw.order.Order.md#getstatus) and the
      shipping order status, accessed using [ShippingOrder.getStatus()](dw.order.ShippingOrder.md#getstatus).


    **Parameters:**
    - status - the status

    **Throws:**
    - NullPointerException - if status is `null`
    - IllegalArgumentException - if the status transition to the status is not allowed


---

### split(Quantity)
- split(quantity: [Quantity](dw.value.Quantity.md)): [ShippingOrderItem](dw.order.ShippingOrderItem.md)
  - : Split the shipping order item.
      
      
      This will also lead to a split of the related [LineItem](dw.order.LineItem.md).
      Split means that for the passed quantity a new item is created with this
      quantity as an exact copy of this item. The remaining amount will stay in
      this item.
      
      
      If quantity is equal to [getQuantity()](dw.order.ShippingOrderItem.md#getquantity) no split is done and this
      item is returned itself.
      
      
      This method is equivalent to [split(Quantity, Boolean)](dw.order.ShippingOrderItem.md#splitquantity-boolean) called
      with `splitOrderItem` equals to `true`.


    **Parameters:**
    - quantity - the quantity for the newly created item

    **Returns:**
    - the newly created item or this item

    **Throws:**
    - IllegalArgumentException - if quantity is greater than [getQuantity()](dw.order.ShippingOrderItem.md#getquantity)


---

### split(Quantity, Boolean)
- split(quantity: [Quantity](dw.value.Quantity.md), splitOrderItem: [Boolean](TopLevel.Boolean.md)): [ShippingOrderItem](dw.order.ShippingOrderItem.md)
  - : Split the shipping order item.
      
      
      This will also lead to a split of the related [LineItem](dw.order.LineItem.md)
      when `splitOrderItem` is `true`.
      Split means that for the passed quantity a new item is created with this
      quantity as an exact copy of this item. The remaining amount will stay in
      this item.
      
      
      If quantity is equal to [getQuantity()](dw.order.ShippingOrderItem.md#getquantity) no split is done and this
      item is returned itself.


    **Parameters:**
    - quantity - the quantity for the newly created item
    - splitOrderItem -              <li>`true` the related [LineItem](dw.order.LineItem.md)             will be splitted too</li>             <li>`false` the related [LineItem](dw.order.LineItem.md)             will not be splitted</li>             </ul>

    **Returns:**
    - the newly created item or this item

    **Throws:**
    - IllegalArgumentException - if quantity is greater than [getQuantity()](dw.order.ShippingOrderItem.md#getquantity)


---

<!-- prettier-ignore-end -->
