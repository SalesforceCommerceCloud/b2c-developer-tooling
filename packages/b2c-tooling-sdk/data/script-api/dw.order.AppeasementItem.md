<!-- prettier-ignore-start -->
# Class AppeasementItem

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.object.Extensible](dw.object.Extensible.md)
    - [dw.order.AbstractItem](dw.order.AbstractItem.md)
      - [dw.order.AppeasementItem](dw.order.AppeasementItem.md)

Represents an item of an [Appeasement](dw.order.Appeasement.md) which is associated with one [OrderItem](dw.order.OrderItem.md) usually representing an [Order](dw.order.Order.md)
[ProductLineItem](dw.order.ProductLineItem.md). Items are created using method [Appeasement.addItems(Money, List)](dw.order.Appeasement.md#additemsmoney-list)


When the related Appeasement were set to status COMPLETED, only the the custom attributes of the appeasement item can be changed.


Order post-processing APIs (gillian) are now inactive by default and will throw
an exception if accessed. Activation needs preliminary approval by Product Management.
Please contact support in this case. Existing customers using these APIs are not
affected by this change and can use the APIs until further notice.



## Property Summary

| Property | Description |
| --- | --- |
| [appeasementNumber](#appeasementnumber): [String](TopLevel.String.md) `(read-only)` | Returns the number of the [Appeasement](dw.order.Appeasement.md) to which this item belongs. |
| [parentItem](#parentitem): [AppeasementItem](dw.order.AppeasementItem.md) | Returns null or the parent item. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getAppeasementNumber](dw.order.AppeasementItem.md#getappeasementnumber)() | Returns the number of the [Appeasement](dw.order.Appeasement.md) to which this item belongs. |
| [getParentItem](dw.order.AppeasementItem.md#getparentitem)() | Returns null or the parent item. |
| [setParentItem](dw.order.AppeasementItem.md#setparentitemappeasementitem)([AppeasementItem](dw.order.AppeasementItem.md)) | Set a parent item. |

### Methods inherited from class AbstractItem

[getGrossPrice](dw.order.AbstractItem.md#getgrossprice), [getItemID](dw.order.AbstractItem.md#getitemid), [getLineItem](dw.order.AbstractItem.md#getlineitem), [getNetPrice](dw.order.AbstractItem.md#getnetprice), [getOrderItem](dw.order.AbstractItem.md#getorderitem), [getOrderItemID](dw.order.AbstractItem.md#getorderitemid), [getTax](dw.order.AbstractItem.md#gettax), [getTaxBasis](dw.order.AbstractItem.md#gettaxbasis), [getTaxItems](dw.order.AbstractItem.md#gettaxitems)
### Methods inherited from class Extensible

[describe](dw.object.Extensible.md#describe), [getCustom](dw.object.Extensible.md#getcustom)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### appeasementNumber
- appeasementNumber: [String](TopLevel.String.md) `(read-only)`
  - : Returns the number of the [Appeasement](dw.order.Appeasement.md) to which this item belongs.


---

### parentItem
- parentItem: [AppeasementItem](dw.order.AppeasementItem.md)
  - : Returns null or the parent item.


---

## Method Details

### getAppeasementNumber()
- getAppeasementNumber(): [String](TopLevel.String.md)
  - : Returns the number of the [Appeasement](dw.order.Appeasement.md) to which this item belongs.

    **Returns:**
    - the number of the Appeasement to which this item belongs


---

### getParentItem()
- getParentItem(): [AppeasementItem](dw.order.AppeasementItem.md)
  - : Returns null or the parent item.

    **Returns:**
    - null or the parent item.


---

### setParentItem(AppeasementItem)
- setParentItem(parentItem: [AppeasementItem](dw.order.AppeasementItem.md)): void
  - : Set a parent item. The parent item must belong to the same
      [Appeasement](dw.order.Appeasement.md). An infinite parent-child loop is disallowed
      as is a parent-child depth greater than 10. Setting a parent item
      indicates a dependency of the child item on the parent item, and can be
      used to form a parallel structure to that accessed using
      [ProductLineItem.getParent()](dw.order.ProductLineItem.md#getparent).


    **Parameters:**
    - parentItem - The parent item, null is allowed


---

<!-- prettier-ignore-end -->
