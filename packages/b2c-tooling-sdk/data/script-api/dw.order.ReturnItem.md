<!-- prettier-ignore-start -->
# Class ReturnItem

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.object.Extensible](dw.object.Extensible.md)
    - [dw.order.AbstractItem](dw.order.AbstractItem.md)
      - [dw.order.ReturnItem](dw.order.ReturnItem.md)

An item of a [Return](dw.order.Return.md), created using [Return.createItem(String)](dw.order.Return.md#createitemstring).
Represents a physically returned order line item. Please refer to the documentation of [ReturnHooks](dw.order.hooks.ReturnHooks.md)
for further information.


When the related Return were set to status COMPLETED, only the the custom attributes of the return item can be changed.


Order post-processing APIs (gillian) are now inactive by default and will throw
an exception if accessed. Activation needs preliminary approval by Product Management.
Please contact support in this case. Existing customers using these APIs are not
affected by this change and can use the APIs until further notice.



## Property Summary

| Property | Description |
| --- | --- |
| [basePrice](#baseprice): [Money](dw.value.Money.md) `(read-only)` | Price of a single unit before discount application. |
| [note](#note): [String](TopLevel.String.md) | Return the note for this return item. |
| [parentItem](#parentitem): [ReturnItem](dw.order.ReturnItem.md) | Returns null or the parent item. |
| [reasonCode](#reasoncode): [EnumValue](dw.value.EnumValue.md) | Returns the reason code for return item. |
| [returnCaseItem](#returncaseitem): [ReturnCaseItem](dw.order.ReturnCaseItem.md) `(read-only)` | Returns the return case item related to this item. |
| [returnNumber](#returnnumber): [String](TopLevel.String.md) `(read-only)` | The mandatory returnNumber of the [Return](dw.order.Return.md) to which this item belongs. |
| [returnedQuantity](#returnedquantity): [Quantity](dw.value.Quantity.md) | The [Quantity](dw.value.Quantity.md) returned. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [addTaxItem](dw.order.ReturnItem.md#addtaxitemdecimal-taxgroup)([Decimal](dw.util.Decimal.md), [TaxGroup](dw.order.TaxGroup.md)) | Create a new [tax-item](dw.order.TaxItem.md) and add to this item. |
| [applyPriceRate](dw.order.ReturnItem.md#applypriceratedecimal-decimal-boolean)([Decimal](dw.util.Decimal.md), [Decimal](dw.util.Decimal.md), [Boolean](TopLevel.Boolean.md)) | Apply a rate of (factor / divisor) to the prices in this item, with the option to half round up or half round down to the  nearest cent if necessary. |
| [getBasePrice](dw.order.ReturnItem.md#getbaseprice)() | Price of a single unit before discount application. |
| [getNote](dw.order.ReturnItem.md#getnote)() | Return the note for this return item. |
| [getParentItem](dw.order.ReturnItem.md#getparentitem)() | Returns null or the parent item. |
| [getReasonCode](dw.order.ReturnItem.md#getreasoncode)() | Returns the reason code for return item. |
| [getReturnCaseItem](dw.order.ReturnItem.md#getreturncaseitem)() | Returns the return case item related to this item. |
| [getReturnNumber](dw.order.ReturnItem.md#getreturnnumber)() | The mandatory returnNumber of the [Return](dw.order.Return.md) to which this item belongs. |
| [getReturnedQuantity](dw.order.ReturnItem.md#getreturnedquantity)() | The [Quantity](dw.value.Quantity.md) returned. |
| [setNote](dw.order.ReturnItem.md#setnotestring)([String](TopLevel.String.md)) | Sets a note for this return item. |
| [setParentItem](dw.order.ReturnItem.md#setparentitemreturnitem)([ReturnItem](dw.order.ReturnItem.md)) | Set a parent item. |
| [setReasonCode](dw.order.ReturnItem.md#setreasoncodestring)([String](TopLevel.String.md)) | Set the reason code. |
| [setReturnedQuantity](dw.order.ReturnItem.md#setreturnedquantityquantity)([Quantity](dw.value.Quantity.md)) | Set the [Quantity](dw.value.Quantity.md) returned. |
| [setTaxBasis](dw.order.ReturnItem.md#settaxbasismoney)([Money](dw.value.Money.md)) | Set the tax-basis price for this item. |
| [setTaxItems](dw.order.ReturnItem.md#settaxitemscollection)([Collection](dw.util.Collection.md)) | Set the tax-items for this item. |

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

### note
- note: [String](TopLevel.String.md)
  - : Return the note for this return item.


---

### parentItem
- parentItem: [ReturnItem](dw.order.ReturnItem.md)
  - : Returns null or the parent item.


---

### reasonCode
- reasonCode: [EnumValue](dw.value.EnumValue.md)
  - : Returns the reason code for return item. The list of reason codes can be updated
      by updating meta-data for ReturnItem.



---

### returnCaseItem
- returnCaseItem: [ReturnCaseItem](dw.order.ReturnCaseItem.md) `(read-only)`
  - : Returns the return case item related to this item. Should never return null.


---

### returnNumber
- returnNumber: [String](TopLevel.String.md) `(read-only)`
  - : The mandatory returnNumber of the [Return](dw.order.Return.md) to which this item belongs.


---

### returnedQuantity
- returnedQuantity: [Quantity](dw.value.Quantity.md)
  - : The [Quantity](dw.value.Quantity.md) returned. This may return an N/A quantity.


---

## Method Details

### addTaxItem(Decimal, TaxGroup)
- addTaxItem(amount: [Decimal](dw.util.Decimal.md), taxGroup: [TaxGroup](dw.order.TaxGroup.md)): [TaxItem](dw.order.TaxItem.md)
  - : Create a new [tax-item](dw.order.TaxItem.md) and add to this item.

    **Parameters:**
    - amount - amount to assign to the tax-item
    - taxGroup - the [TaxGroup](dw.order.TaxGroup.md) to which the item belongs

    **Returns:**
    - the new tax-item


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

### getNote()
- getNote(): [String](TopLevel.String.md)
  - : Return the note for this return item.

    **Returns:**
    - the note or `null`


---

### getParentItem()
- getParentItem(): [ReturnItem](dw.order.ReturnItem.md)
  - : Returns null or the parent item.

    **Returns:**
    - null or the parent item.


---

### getReasonCode()
- getReasonCode(): [EnumValue](dw.value.EnumValue.md)
  - : Returns the reason code for return item. The list of reason codes can be updated
      by updating meta-data for ReturnItem.


    **Returns:**
    - the return reason code


---

### getReturnCaseItem()
- getReturnCaseItem(): [ReturnCaseItem](dw.order.ReturnCaseItem.md)
  - : Returns the return case item related to this item. Should never return null.

    **Returns:**
    - the return case item related to this item


---

### getReturnNumber()
- getReturnNumber(): [String](TopLevel.String.md)
  - : The mandatory returnNumber of the [Return](dw.order.Return.md) to which this item belongs.

    **Returns:**
    - the returnNumber of the Return to which this item belongs


---

### getReturnedQuantity()
- getReturnedQuantity(): [Quantity](dw.value.Quantity.md)
  - : The [Quantity](dw.value.Quantity.md) returned. This may return an N/A quantity.

    **Returns:**
    - the quantity returned, may be N/A


---

### setNote(String)
- setNote(note: [String](TopLevel.String.md)): void
  - : Sets a note for this return item.

    **Parameters:**
    - note - the note for this return item to set


---

### setParentItem(ReturnItem)
- setParentItem(parentItem: [ReturnItem](dw.order.ReturnItem.md)): void
  - : Set a parent item. The parent item must belong to the same
      [Return](dw.order.Return.md). An infinite parent-child loop is disallowed
      as is a parent-child depth greater than 10. Setting a parent item
      indicates a dependency of the child item on the parent item, and can be
      used to form a parallel structure to that accessed using
      [ProductLineItem.getParent()](dw.order.ProductLineItem.md#getparent).


    **Parameters:**
    - parentItem - The parent item, null is allowed


---

### setReasonCode(String)
- setReasonCode(reasonCode: [String](TopLevel.String.md)): void
  - : Set the reason code. The list of reason codes can be updated by updating meta-data for ReturnItem.

    **Parameters:**
    - reasonCode - the reason code to set


---

### setReturnedQuantity(Quantity)
- setReturnedQuantity(quantity: [Quantity](dw.value.Quantity.md)): void
  - : Set the [Quantity](dw.value.Quantity.md) returned. Passing null results in an exception being thrown.
      The quantity must be higher than zero and not be higher than the remaining quantity to return.
      
      
      The item prices are recalculated in this method as described in [applyPriceRate(Decimal, Decimal, Boolean)](dw.order.ReturnItem.md#applypriceratedecimal-decimal-boolean)
      with the `quantity` argument as the factor, and ordered quantity as divisor
      and `true` as the roundup parameter.


    **Parameters:**
    - quantity - the quantity returned, null not allowed

    **See Also:**
    - [OrderItem.getReturnedQuantity()](dw.order.OrderItem.md#getreturnedquantity)
    - [ProductLineItem.getQuantity()](dw.order.ProductLineItem.md#getquantity)


---

### setTaxBasis(Money)
- setTaxBasis(taxBasis: [Money](dw.value.Money.md)): void
  - : Set the tax-basis price for this item.

    **Parameters:**
    - taxBasis - the tax basis value.


---

### setTaxItems(Collection)
- setTaxItems(taxItems: [Collection](dw.util.Collection.md)): void
  - : Set the tax-items for this item.

    **Parameters:**
    - taxItems - items

    **See Also:**
    - [addTaxItem(Decimal, TaxGroup)](dw.order.ReturnItem.md#addtaxitemdecimal-taxgroup)
    - [TaxGroup.create(String, String, String, Decimal)](dw.order.TaxGroup.md#createstring-string-string-decimal)


---

<!-- prettier-ignore-end -->
