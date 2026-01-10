<!-- prettier-ignore-start -->
# Class ReturnCaseItem

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.object.Extensible](dw.object.Extensible.md)
    - [dw.order.AbstractItem](dw.order.AbstractItem.md)
      - [dw.order.ReturnCaseItem](dw.order.ReturnCaseItem.md)

An item of a [ReturnCase](dw.order.ReturnCase.md), created using method
[ReturnCase.createItem(String)](dw.order.ReturnCase.md#createitemstring). Initially the
ReturnCaseItem is NEW. No [Return](dw.order.Return.md) can be
created at this point. From NEW the item transitions in CONFIRMED state.
Now Return can be created. Next transition is either to
PARTIAL\_RETURNED or to CANCELLED. At the end the item can be RETURNED (no other
Returns can be created.

The custom code implementing the ReturnHooks is
responsible to provide the logic for the transitions. Please refer to the
documentation of [ReturnHooks](dw.order.hooks.ReturnHooks.md) for further
information.


When the related ReturnCase were confirmed, only the the custom attributes of the return case item can be changed.


Order post-processing APIs (gillian) are now inactive by default and will throw
an exception if accessed. Activation needs preliminary approval by Product Management.
Please contact support in this case. Existing customers using these APIs are not
affected by this change and can use the APIs until further notice.



## Constant Summary

| Constant | Description |
| --- | --- |
| [STATUS_CANCELLED](#status_cancelled): [String](TopLevel.String.md) = "CANCELLED" | constant for ReturnCase Status CANCELLED |
| [STATUS_CONFIRMED](#status_confirmed): [String](TopLevel.String.md) = "CONFIRMED" | constant for ReturnCase Status CONFIRMED |
| [STATUS_NEW](#status_new): [String](TopLevel.String.md) = "NEW" | constant for ReturnCase Status NEW |
| [STATUS_PARTIAL_RETURNED](#status_partial_returned): [String](TopLevel.String.md) = "PARTIAL_RETURNED" | constant for ReturnCase Status PARTIAL RETURNED |
| [STATUS_RETURNED](#status_returned): [String](TopLevel.String.md) = "RETURNED" | constant for ReturnCase Status RETURNED |

## Property Summary

| Property | Description |
| --- | --- |
| [authorizedQuantity](#authorizedquantity): [Quantity](dw.value.Quantity.md) | Return the [Quantity](dw.value.Quantity.md) authorized for this ReturnCaseItem, may be N/A. |
| [basePrice](#baseprice): [Money](dw.value.Money.md) `(read-only)` | Price of a single unit before discount application. |
| [note](#note): [String](TopLevel.String.md) | Return the note for this return case item. |
| [parentItem](#parentitem): [ReturnCaseItem](dw.order.ReturnCaseItem.md) | Returns null or the parent item. |
| [reasonCode](#reasoncode): [EnumValue](dw.value.EnumValue.md) | Returns the reason code for return case item. |
| [returnCaseNumber](#returncasenumber): [String](TopLevel.String.md) `(read-only)` | Mandatory number of [ReturnCase](dw.order.ReturnCase.md) to which this item belongs |
| [returnItems](#returnitems): [Collection](dw.util.Collection.md) `(read-only)` | Unsorted collection of [ReturnItem](dw.order.ReturnItem.md)s associated with this ReturnCaseItem. |
| [status](#status): [EnumValue](dw.value.EnumValue.md) | Gets the return case item status. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [createReturnItem](dw.order.ReturnCaseItem.md#createreturnitemstring)([String](TopLevel.String.md)) | Create a new [ReturnItem](dw.order.ReturnItem.md) for this ReturnCaseItem and assign it to the  given [Return](dw.order.Return.md). |
| [getAuthorizedQuantity](dw.order.ReturnCaseItem.md#getauthorizedquantity)() | Return the [Quantity](dw.value.Quantity.md) authorized for this ReturnCaseItem, may be N/A. |
| [getBasePrice](dw.order.ReturnCaseItem.md#getbaseprice)() | Price of a single unit before discount application. |
| [getNote](dw.order.ReturnCaseItem.md#getnote)() | Return the note for this return case item. |
| [getParentItem](dw.order.ReturnCaseItem.md#getparentitem)() | Returns null or the parent item. |
| [getReasonCode](dw.order.ReturnCaseItem.md#getreasoncode)() | Returns the reason code for return case item. |
| [getReturnCaseNumber](dw.order.ReturnCaseItem.md#getreturncasenumber)() | Mandatory number of [ReturnCase](dw.order.ReturnCase.md) to which this item belongs |
| [getReturnItems](dw.order.ReturnCaseItem.md#getreturnitems)() | Unsorted collection of [ReturnItem](dw.order.ReturnItem.md)s associated with this ReturnCaseItem. |
| [getStatus](dw.order.ReturnCaseItem.md#getstatus)() | Gets the return case item status. |
| [setAuthorizedQuantity](dw.order.ReturnCaseItem.md#setauthorizedquantityquantity)([Quantity](dw.value.Quantity.md)) | Set the optional authorized [Quantity](dw.value.Quantity.md) for this item. |
| [setNote](dw.order.ReturnCaseItem.md#setnotestring)([String](TopLevel.String.md)) | Sets a note for this return case item. |
| [setParentItem](dw.order.ReturnCaseItem.md#setparentitemreturncaseitem)([ReturnCaseItem](dw.order.ReturnCaseItem.md)) | Set a parent item. |
| [setReasonCode](dw.order.ReturnCaseItem.md#setreasoncodestring)([String](TopLevel.String.md)) | Changes the reason code. |
| [setStatus](dw.order.ReturnCaseItem.md#setstatusstring)([String](TopLevel.String.md)) | Sets the status. |

### Methods inherited from class AbstractItem

[getGrossPrice](dw.order.AbstractItem.md#getgrossprice), [getItemID](dw.order.AbstractItem.md#getitemid), [getLineItem](dw.order.AbstractItem.md#getlineitem), [getNetPrice](dw.order.AbstractItem.md#getnetprice), [getOrderItem](dw.order.AbstractItem.md#getorderitem), [getOrderItemID](dw.order.AbstractItem.md#getorderitemid), [getTax](dw.order.AbstractItem.md#gettax), [getTaxBasis](dw.order.AbstractItem.md#gettaxbasis), [getTaxItems](dw.order.AbstractItem.md#gettaxitems)
### Methods inherited from class Extensible

[describe](dw.object.Extensible.md#describe), [getCustom](dw.object.Extensible.md#getcustom)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### STATUS_CANCELLED

- STATUS_CANCELLED: [String](TopLevel.String.md) = "CANCELLED"
  - : constant for ReturnCase Status CANCELLED


---

### STATUS_CONFIRMED

- STATUS_CONFIRMED: [String](TopLevel.String.md) = "CONFIRMED"
  - : constant for ReturnCase Status CONFIRMED


---

### STATUS_NEW

- STATUS_NEW: [String](TopLevel.String.md) = "NEW"
  - : constant for ReturnCase Status NEW


---

### STATUS_PARTIAL_RETURNED

- STATUS_PARTIAL_RETURNED: [String](TopLevel.String.md) = "PARTIAL_RETURNED"
  - : constant for ReturnCase Status PARTIAL RETURNED


---

### STATUS_RETURNED

- STATUS_RETURNED: [String](TopLevel.String.md) = "RETURNED"
  - : constant for ReturnCase Status RETURNED


---

## Property Details

### authorizedQuantity
- authorizedQuantity: [Quantity](dw.value.Quantity.md)
  - : Return the [Quantity](dw.value.Quantity.md) authorized for this ReturnCaseItem, may be N/A.


---

### basePrice
- basePrice: [Money](dw.value.Money.md) `(read-only)`
  - : Price of a single unit before discount application.


---

### note
- note: [String](TopLevel.String.md)
  - : Return the note for this return case item.


---

### parentItem
- parentItem: [ReturnCaseItem](dw.order.ReturnCaseItem.md)
  - : Returns null or the parent item.


---

### reasonCode
- reasonCode: [EnumValue](dw.value.EnumValue.md)
  - : Returns the reason code for return case item.


---

### returnCaseNumber
- returnCaseNumber: [String](TopLevel.String.md) `(read-only)`
  - : Mandatory number of [ReturnCase](dw.order.ReturnCase.md) to which this item belongs


---

### returnItems
- returnItems: [Collection](dw.util.Collection.md) `(read-only)`
  - : Unsorted collection of [ReturnItem](dw.order.ReturnItem.md)s associated with this ReturnCaseItem.

    **See Also:**
    - [createReturnItem(String)](dw.order.ReturnCaseItem.md#createreturnitemstring)


---

### status
- status: [EnumValue](dw.value.EnumValue.md)
  - : Gets the return case item status.
      
      
      The possible values are [STATUS_NEW](dw.order.ReturnCaseItem.md#status_new),[STATUS_CONFIRMED](dw.order.ReturnCaseItem.md#status_confirmed),
      [STATUS_PARTIAL_RETURNED](dw.order.ReturnCaseItem.md#status_partial_returned), [STATUS_RETURNED](dw.order.ReturnCaseItem.md#status_returned),
      [STATUS_CANCELLED](dw.order.ReturnCaseItem.md#status_cancelled).



---

## Method Details

### createReturnItem(String)
- createReturnItem(returnNumber: [String](TopLevel.String.md)): [ReturnItem](dw.order.ReturnItem.md)
  - : Create a new [ReturnItem](dw.order.ReturnItem.md) for this ReturnCaseItem and assign it to the
      given [Return](dw.order.Return.md).


    **Parameters:**
    - returnNumber - number of Return to which new item is assigned.

    **Returns:**
    - new ReturnItem


---

### getAuthorizedQuantity()
- getAuthorizedQuantity(): [Quantity](dw.value.Quantity.md)
  - : Return the [Quantity](dw.value.Quantity.md) authorized for this ReturnCaseItem, may be N/A.

    **Returns:**
    - the authorized quantity or N/A


---

### getBasePrice()
- getBasePrice(): [Money](dw.value.Money.md)
  - : Price of a single unit before discount application.

    **Returns:**
    - Price of a single unit before discount application.


---

### getNote()
- getNote(): [String](TopLevel.String.md)
  - : Return the note for this return case item.

    **Returns:**
    - the note or `null`


---

### getParentItem()
- getParentItem(): [ReturnCaseItem](dw.order.ReturnCaseItem.md)
  - : Returns null or the parent item.

    **Returns:**
    - null or the parent item.


---

### getReasonCode()
- getReasonCode(): [EnumValue](dw.value.EnumValue.md)
  - : Returns the reason code for return case item.

    **Returns:**
    - the return reason code


---

### getReturnCaseNumber()
- getReturnCaseNumber(): [String](TopLevel.String.md)
  - : Mandatory number of [ReturnCase](dw.order.ReturnCase.md) to which this item belongs

    **Returns:**
    - number of ReturnCase to which this item belongs


---

### getReturnItems()
- getReturnItems(): [Collection](dw.util.Collection.md)
  - : Unsorted collection of [ReturnItem](dw.order.ReturnItem.md)s associated with this ReturnCaseItem.

    **Returns:**
    - unsorted collection of ReturnItems associated with this ReturnCaseItem

    **See Also:**
    - [createReturnItem(String)](dw.order.ReturnCaseItem.md#createreturnitemstring)


---

### getStatus()
- getStatus(): [EnumValue](dw.value.EnumValue.md)
  - : Gets the return case item status.
      
      
      The possible values are [STATUS_NEW](dw.order.ReturnCaseItem.md#status_new),[STATUS_CONFIRMED](dw.order.ReturnCaseItem.md#status_confirmed),
      [STATUS_PARTIAL_RETURNED](dw.order.ReturnCaseItem.md#status_partial_returned), [STATUS_RETURNED](dw.order.ReturnCaseItem.md#status_returned),
      [STATUS_CANCELLED](dw.order.ReturnCaseItem.md#status_cancelled).


    **Returns:**
    - the status


---

### setAuthorizedQuantity(Quantity)
- setAuthorizedQuantity(authorizedQuantity: [Quantity](dw.value.Quantity.md)): void
  - : Set the optional authorized [Quantity](dw.value.Quantity.md) for this item. Passing null will result in an N/A Quantity
      being set.


    **Parameters:**
    - authorizedQuantity - null or the quantity


---

### setNote(String)
- setNote(note: [String](TopLevel.String.md)): void
  - : Sets a note for this return case item.

    **Parameters:**
    - note - the note for this return case item to set


---

### setParentItem(ReturnCaseItem)
- setParentItem(parentItem: [ReturnCaseItem](dw.order.ReturnCaseItem.md)): void
  - : Set a parent item. The parent item must belong to the same
      [ReturnCase](dw.order.ReturnCase.md). An infinite parent-child loop is disallowed
      as is a parent-child depth greater than 10. Setting a parent item
      indicates a dependency of the child item on the parent item, and can be
      used to form a parallel structure to that accessed using
      [ProductLineItem.getParent()](dw.order.ProductLineItem.md#getparent).


    **Parameters:**
    - parentItem - The parent item, null is allowed


---

### setReasonCode(String)
- setReasonCode(reasonCode: [String](TopLevel.String.md)): void
  - : Changes the reason code. Initially the reason code is set on return case
      item creation.


    **Parameters:**
    - reasonCode - the reason code to set


---

### setStatus(String)
- setStatus(statusString: [String](TopLevel.String.md)): void
  - : Sets the status.
      
      
      The possible values are [STATUS_NEW](dw.order.ReturnCaseItem.md#status_new),[STATUS_CONFIRMED](dw.order.ReturnCaseItem.md#status_confirmed),
      [STATUS_PARTIAL_RETURNED](dw.order.ReturnCaseItem.md#status_partial_returned), [STATUS_RETURNED](dw.order.ReturnCaseItem.md#status_returned),
      [STATUS_CANCELLED](dw.order.ReturnCaseItem.md#status_cancelled).


    **Parameters:**
    - statusString - the status

    **Throws:**
    - NullPointerException - if status is `null`
    - IllegalArgumentException - if the status transition to the status is not allowed


---

<!-- prettier-ignore-end -->
