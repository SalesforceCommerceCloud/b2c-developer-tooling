<!-- prettier-ignore-start -->
# Class AbstractItem

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.object.Extensible](dw.object.Extensible.md)
    - [dw.order.AbstractItem](dw.order.AbstractItem.md)

An item which references, or in other words is based upon, an [OrderItem](dw.order.OrderItem.md). Provides methods to access the
OrderItem, the order [LineItem](dw.order.LineItem.md) which has been extended, and the [Order](dw.order.Order.md). In addition it defines
methods to access item level prices and the item id. Supports custom-properties.



## All Known Subclasses
[AppeasementItem](dw.order.AppeasementItem.md), [InvoiceItem](dw.order.InvoiceItem.md), [ReturnCaseItem](dw.order.ReturnCaseItem.md), [ReturnItem](dw.order.ReturnItem.md), [ShippingOrderItem](dw.order.ShippingOrderItem.md)
## Property Summary

| Property | Description |
| --- | --- |
| [grossPrice](#grossprice): [Money](dw.value.Money.md) `(read-only)` | Gross price of item. |
| [itemID](#itemid): [String](TopLevel.String.md) `(read-only)` | The item-id used for referencing between items |
| [lineItem](#lineitem): [LineItem](dw.order.LineItem.md) `(read-only)` | Returns the Order Product- or Shipping- LineItem associated with this item. |
| [netPrice](#netprice): [Money](dw.value.Money.md) `(read-only)` | Net price of item. |
| [orderItem](#orderitem): [OrderItem](dw.order.OrderItem.md) `(read-only)` | Returns the order item extensions related to this item. |
| [orderItemID](#orderitemid): [String](TopLevel.String.md) `(read-only)` | The order-item-id used for referencing the [OrderItem](dw.order.OrderItem.md) |
| [tax](#tax): [Money](dw.value.Money.md) `(read-only)` | Total tax for item. |
| [taxBasis](#taxbasis): [Money](dw.value.Money.md) `(read-only)` | Price of entire item on which tax calculation is based. |
| [taxItems](#taxitems): [Collection](dw.util.Collection.md) `(read-only)` | Tax items representing a tax breakdown |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getGrossPrice](dw.order.AbstractItem.md#getgrossprice)() | Gross price of item. |
| [getItemID](dw.order.AbstractItem.md#getitemid)() | The item-id used for referencing between items |
| [getLineItem](dw.order.AbstractItem.md#getlineitem)() | Returns the Order Product- or Shipping- LineItem associated with this item. |
| [getNetPrice](dw.order.AbstractItem.md#getnetprice)() | Net price of item. |
| [getOrderItem](dw.order.AbstractItem.md#getorderitem)() | Returns the order item extensions related to this item. |
| [getOrderItemID](dw.order.AbstractItem.md#getorderitemid)() | The order-item-id used for referencing the [OrderItem](dw.order.OrderItem.md) |
| [getTax](dw.order.AbstractItem.md#gettax)() | Total tax for item. |
| [getTaxBasis](dw.order.AbstractItem.md#gettaxbasis)() | Price of entire item on which tax calculation is based. |
| [getTaxItems](dw.order.AbstractItem.md#gettaxitems)() | Tax items representing a tax breakdown |

### Methods inherited from class Extensible

[describe](dw.object.Extensible.md#describe), [getCustom](dw.object.Extensible.md#getcustom)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### grossPrice
- grossPrice: [Money](dw.value.Money.md) `(read-only)`
  - : Gross price of item.


---

### itemID
- itemID: [String](TopLevel.String.md) `(read-only)`
  - : The item-id used for referencing between items


---

### lineItem
- lineItem: [LineItem](dw.order.LineItem.md) `(read-only)`
  - : Returns the Order Product- or Shipping- LineItem associated with this item. Should never return null.


---

### netPrice
- netPrice: [Money](dw.value.Money.md) `(read-only)`
  - : Net price of item.


---

### orderItem
- orderItem: [OrderItem](dw.order.OrderItem.md) `(read-only)`
  - : Returns the order item extensions related to this item. Should never return null.


---

### orderItemID
- orderItemID: [String](TopLevel.String.md) `(read-only)`
  - : The order-item-id used for referencing the [OrderItem](dw.order.OrderItem.md)


---

### tax
- tax: [Money](dw.value.Money.md) `(read-only)`
  - : Total tax for item.


---

### taxBasis
- taxBasis: [Money](dw.value.Money.md) `(read-only)`
  - : Price of entire item on which tax calculation is based. Same as [getNetPrice()](dw.order.AbstractItem.md#getnetprice)
      or [getGrossPrice()](dw.order.AbstractItem.md#getgrossprice) depending on whether the order is based on net or gross prices.



---

### taxItems
- taxItems: [Collection](dw.util.Collection.md) `(read-only)`
  - : Tax items representing a tax breakdown

    **See Also:**
    - [TaxItem](dw.order.TaxItem.md)


---

## Method Details

### getGrossPrice()
- getGrossPrice(): [Money](dw.value.Money.md)
  - : Gross price of item.

    **Returns:**
    - Gross price of item.


---

### getItemID()
- getItemID(): [String](TopLevel.String.md)
  - : The item-id used for referencing between items

    **Returns:**
    - the item-id used for referencing between items


---

### getLineItem()
- getLineItem(): [LineItem](dw.order.LineItem.md)
  - : Returns the Order Product- or Shipping- LineItem associated with this item. Should never return null.

    **Returns:**
    - the Order Product- or Shipping- LineItem associated with this item


---

### getNetPrice()
- getNetPrice(): [Money](dw.value.Money.md)
  - : Net price of item.

    **Returns:**
    - Net price of item.


---

### getOrderItem()
- getOrderItem(): [OrderItem](dw.order.OrderItem.md)
  - : Returns the order item extensions related to this item. Should never return null.

    **Returns:**
    - the order item extensions related to this item


---

### getOrderItemID()
- getOrderItemID(): [String](TopLevel.String.md)
  - : The order-item-id used for referencing the [OrderItem](dw.order.OrderItem.md)

    **Returns:**
    - the order-item-id used for referencing the OrderItem


---

### getTax()
- getTax(): [Money](dw.value.Money.md)
  - : Total tax for item.

    **Returns:**
    - Total tax for item.


---

### getTaxBasis()
- getTaxBasis(): [Money](dw.value.Money.md)
  - : Price of entire item on which tax calculation is based. Same as [getNetPrice()](dw.order.AbstractItem.md#getnetprice)
      or [getGrossPrice()](dw.order.AbstractItem.md#getgrossprice) depending on whether the order is based on net or gross prices.


    **Returns:**
    - Price of entire item on which tax calculation is based


---

### getTaxItems()
- getTaxItems(): [Collection](dw.util.Collection.md)
  - : Tax items representing a tax breakdown

    **Returns:**
    - tax items representing a tax breakdown

    **See Also:**
    - [TaxItem](dw.order.TaxItem.md)


---

<!-- prettier-ignore-end -->
