<!-- prettier-ignore-start -->
# Class Appeasement

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.object.Extensible](dw.object.Extensible.md)
    - [dw.order.AbstractItemCtnr](dw.order.AbstractItemCtnr.md)
      - [dw.order.Appeasement](dw.order.Appeasement.md)

The Appeasement represents a shopper request for an order credit.

Example: The buyer finds any problem with the products but he agrees to preserve them, if he would be compensated,
rather than return them.



The Appeasement contains 1..n appeasement items.
Each appeasement item is associated with one [OrderItem](dw.order.OrderItem.md) usually representing an [Order](dw.order.Order.md)
[ProductLineItem](dw.order.ProductLineItem.md). 



An Appeasement can have one of these status values:

- OPEN - the appeasement is open and appeasement items could be added to it
- COMPLETED - the appeasement is complete and it is not allowed to add new items to it, this is a precondition  for refunding the customer for an appeasement.



Order post-processing APIs (gillian) are now inactive by default and will throw
an exception if accessed. Activation needs preliminary approval by Product Management.
Please contact support in this case. Existing customers using these APIs are not
affected by this change and can use the APIs until further notice.



## Constant Summary

| Constant | Description |
| --- | --- |
| [ORDERBY_ITEMID](#orderby_itemid): [Object](TopLevel.Object.md) | Sorting by item id. |
| [ORDERBY_ITEMPOSITION](#orderby_itemposition): [Object](TopLevel.Object.md) | Sorting by the position of the related order item. |
| [ORDERBY_UNSORTED](#orderby_unsorted): [Object](TopLevel.Object.md) | Unsorted, as it is. |
| [QUALIFIER_PRODUCTITEMS](#qualifier_productitems): [Object](TopLevel.Object.md) | Selects the product items. |
| [QUALIFIER_SERVICEITEMS](#qualifier_serviceitems): [Object](TopLevel.Object.md) | Selects the service items. |
| [STATUS_COMPLETED](#status_completed): [String](TopLevel.String.md) = "COMPLETED" | Constant for Appeasement Status COMPLETED |
| [STATUS_OPEN](#status_open): [String](TopLevel.String.md) = "OPEN" | Constant for Appeasement Status OPEN |

## Property Summary

| Property | Description |
| --- | --- |
| [appeasementNumber](#appeasementnumber): [String](TopLevel.String.md) `(read-only)` | Returns the appeasement number. |
| [invoice](#invoice): [Invoice](dw.order.Invoice.md) `(read-only)` | Returns null or the previously created [Invoice](dw.order.Invoice.md). |
| [invoiceNumber](#invoicenumber): [String](TopLevel.String.md) `(read-only)` | Returns `null` or the invoice-number. |
| [items](#items): [FilteringCollection](dw.util.FilteringCollection.md) `(read-only)` | Returns a filtering collection of the appeasement items belonging to the appeasement. |
| [reasonCode](#reasoncode): [EnumValue](dw.value.EnumValue.md) | Returns the reason code for the appeasement. |
| [reasonNote](#reasonnote): [String](TopLevel.String.md) | Returns the reason note for the appeasement. |
| [status](#status): [EnumValue](dw.value.EnumValue.md) | Gets the status of this appeasement.  The possible values are [STATUS_OPEN](dw.order.Appeasement.md#status_open), [STATUS_COMPLETED](dw.order.Appeasement.md#status_completed). |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [addItems](dw.order.Appeasement.md#additemsmoney-list)([Money](dw.value.Money.md), [List](dw.util.List.md)) | Creates appeasement items corresponding to certain order items and adds them to the appeasement. |
| [createInvoice](dw.order.Appeasement.md#createinvoice)() | Creates a new [Invoice](dw.order.Invoice.md) based on this Appeasement. |
| [createInvoice](dw.order.Appeasement.md#createinvoicestring)([String](TopLevel.String.md)) | Creates a new [Invoice](dw.order.Invoice.md) based on this Appeasement. |
| [getAppeasementNumber](dw.order.Appeasement.md#getappeasementnumber)() | Returns the appeasement number. |
| [getInvoice](dw.order.Appeasement.md#getinvoice)() | Returns null or the previously created [Invoice](dw.order.Invoice.md). |
| [getInvoiceNumber](dw.order.Appeasement.md#getinvoicenumber)() | Returns `null` or the invoice-number. |
| [getItems](dw.order.Appeasement.md#getitems)() | Returns a filtering collection of the appeasement items belonging to the appeasement. |
| [getReasonCode](dw.order.Appeasement.md#getreasoncode)() | Returns the reason code for the appeasement. |
| [getReasonNote](dw.order.Appeasement.md#getreasonnote)() | Returns the reason note for the appeasement. |
| [getStatus](dw.order.Appeasement.md#getstatus)() | Gets the status of this appeasement.  The possible values are [STATUS_OPEN](dw.order.Appeasement.md#status_open), [STATUS_COMPLETED](dw.order.Appeasement.md#status_completed). |
| [setReasonCode](dw.order.Appeasement.md#setreasoncodestring)([String](TopLevel.String.md)) | Set the reason code for the appeasement. |
| [setReasonNote](dw.order.Appeasement.md#setreasonnotestring)([String](TopLevel.String.md)) | Sets the reason note for the appeasement. |
| [setStatus](dw.order.Appeasement.md#setstatusstring)([String](TopLevel.String.md)) | Sets the appeasement status. |

### Methods inherited from class AbstractItemCtnr

[getCreatedBy](dw.order.AbstractItemCtnr.md#getcreatedby), [getCreationDate](dw.order.AbstractItemCtnr.md#getcreationdate), [getGrandTotal](dw.order.AbstractItemCtnr.md#getgrandtotal), [getItems](dw.order.AbstractItemCtnr.md#getitems), [getLastModified](dw.order.AbstractItemCtnr.md#getlastmodified), [getModifiedBy](dw.order.AbstractItemCtnr.md#getmodifiedby), [getOrder](dw.order.AbstractItemCtnr.md#getorder), [getProductSubtotal](dw.order.AbstractItemCtnr.md#getproductsubtotal), [getServiceSubtotal](dw.order.AbstractItemCtnr.md#getservicesubtotal)
### Methods inherited from class Extensible

[describe](dw.object.Extensible.md#describe), [getCustom](dw.object.Extensible.md#getcustom)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### ORDERBY_ITEMID

- ORDERBY_ITEMID: [Object](TopLevel.Object.md)
  - : Sorting by item id. Use with method [getItems()](dw.order.Appeasement.md#getitems) as an argument to method [FilteringCollection.sort(Object)](dw.util.FilteringCollection.md#sortobject).


---

### ORDERBY_ITEMPOSITION

- ORDERBY_ITEMPOSITION: [Object](TopLevel.Object.md)
  - : Sorting by the position of the related order item. Use with method [getItems()](dw.order.Appeasement.md#getitems) as an argument to method [FilteringCollection.sort(Object)](dw.util.FilteringCollection.md#sortobject).


---

### ORDERBY_UNSORTED

- ORDERBY_UNSORTED: [Object](TopLevel.Object.md)
  - : Unsorted, as it is. Use with method [getItems()](dw.order.Appeasement.md#getitems) as an argument to method [FilteringCollection.sort(Object)](dw.util.FilteringCollection.md#sortobject).


---

### QUALIFIER_PRODUCTITEMS

- QUALIFIER_PRODUCTITEMS: [Object](TopLevel.Object.md)
  - : Selects the product items. Use with method [getItems()](dw.order.Appeasement.md#getitems) as an argument to method [FilteringCollection.select(Object)](dw.util.FilteringCollection.md#selectobject).


---

### QUALIFIER_SERVICEITEMS

- QUALIFIER_SERVICEITEMS: [Object](TopLevel.Object.md)
  - : Selects the service items. Use with method [getItems()](dw.order.Appeasement.md#getitems) as an argument to method [FilteringCollection.select(Object)](dw.util.FilteringCollection.md#selectobject).


---

### STATUS_COMPLETED

- STATUS_COMPLETED: [String](TopLevel.String.md) = "COMPLETED"
  - : Constant for Appeasement Status COMPLETED


---

### STATUS_OPEN

- STATUS_OPEN: [String](TopLevel.String.md) = "OPEN"
  - : Constant for Appeasement Status OPEN


---

## Property Details

### appeasementNumber
- appeasementNumber: [String](TopLevel.String.md) `(read-only)`
  - : Returns the appeasement number.


---

### invoice
- invoice: [Invoice](dw.order.Invoice.md) `(read-only)`
  - : Returns null or the previously created [Invoice](dw.order.Invoice.md).

    **See Also:**
    - [createInvoice(String)](dw.order.Appeasement.md#createinvoicestring)


---

### invoiceNumber
- invoiceNumber: [String](TopLevel.String.md) `(read-only)`
  - : Returns `null` or the invoice-number.

    **See Also:**
    - [createInvoice(String)](dw.order.Appeasement.md#createinvoicestring)


---

### items
- items: [FilteringCollection](dw.util.FilteringCollection.md) `(read-only)`
  - : Returns a filtering collection of the appeasement items belonging to the appeasement.
      
      
      This [FilteringCollection](dw.util.FilteringCollection.md) could be sorted / filtered using:
      
      - [FilteringCollection.sort(Object)](dw.util.FilteringCollection.md#sortobject)with [ORDERBY_ITEMID](dw.order.Appeasement.md#orderby_itemid)  - [FilteringCollection.sort(Object)](dw.util.FilteringCollection.md#sortobject)with [ORDERBY_ITEMPOSITION](dw.order.Appeasement.md#orderby_itemposition)    - [FilteringCollection.sort(Object)](dw.util.FilteringCollection.md#sortobject)with [ORDERBY_UNSORTED](dw.order.Appeasement.md#orderby_unsorted)      - [FilteringCollection.select(Object)](dw.util.FilteringCollection.md#selectobject)with [QUALIFIER_PRODUCTITEMS](dw.order.Appeasement.md#qualifier_productitems)        - [FilteringCollection.select(Object)](dw.util.FilteringCollection.md#selectobject)with [QUALIFIER_SERVICEITEMS](dw.order.Appeasement.md#qualifier_serviceitems)



---

### reasonCode
- reasonCode: [EnumValue](dw.value.EnumValue.md)
  - : Returns the reason code for the appeasement. The list of reason codes can be updated
      by updating meta-data for Appeasement.



---

### reasonNote
- reasonNote: [String](TopLevel.String.md)
  - : Returns the reason note for the appeasement.


---

### status
- status: [EnumValue](dw.value.EnumValue.md)
  - : Gets the status of this appeasement.
      
      The possible values are [STATUS_OPEN](dw.order.Appeasement.md#status_open), [STATUS_COMPLETED](dw.order.Appeasement.md#status_completed).



---

## Method Details

### addItems(Money, List)
- addItems(totalAmount: [Money](dw.value.Money.md), orderItems: [List](dw.util.List.md)): void
  - : Creates appeasement items corresponding to certain order items and adds them to the appeasement.

    **Parameters:**
    - totalAmount - the appeasement amount corresponding to the provided order items; this amount is the net price                     when the order is net based and respectively - gross price when the order is gross based
    - orderItems - the order items for which appeasement items should be created


---

### createInvoice()
- createInvoice(): [Invoice](dw.order.Invoice.md)
  - : Creates a new [Invoice](dw.order.Invoice.md) based on this Appeasement. The appeasement-number
      will be used as the invoice-number.
      
      
      The method must not be called more than once for an Appeasement,
      nor may 2 invoices exist with the same invoice-number.
      
      
      The new Invoice is a credit-invoice with a [Invoice.STATUS_NOT_PAID](dw.order.Invoice.md#status_not_paid) status, and
      should be passed to the refund payment-hook in a separate database transaction for processing.


    **Returns:**
    - the created invoice


---

### createInvoice(String)
- createInvoice(invoiceNumber: [String](TopLevel.String.md)): [Invoice](dw.order.Invoice.md)
  - : Creates a new [Invoice](dw.order.Invoice.md) based on this Appeasement. The
      invoice-number must be specified as an argument.
      
      
      The method must not be called more than once for an Appeasement,
      nor may 2 invoices exist with the same invoice-number.
      
      
      The new Invoice is a credit-invoice with a [Invoice.STATUS_NOT_PAID](dw.order.Invoice.md#status_not_paid) status, and
      should be passed to the refund payment-hook in a separate database transaction for processing.


    **Parameters:**
    - invoiceNumber - the invoice-number to be used in the appeasement creation process

    **Returns:**
    - the created invoice


---

### getAppeasementNumber()
- getAppeasementNumber(): [String](TopLevel.String.md)
  - : Returns the appeasement number.

    **Returns:**
    - the appeasement number


---

### getInvoice()
- getInvoice(): [Invoice](dw.order.Invoice.md)
  - : Returns null or the previously created [Invoice](dw.order.Invoice.md).

    **Returns:**
    - null or the previously created invoice

    **See Also:**
    - [createInvoice(String)](dw.order.Appeasement.md#createinvoicestring)


---

### getInvoiceNumber()
- getInvoiceNumber(): [String](TopLevel.String.md)
  - : Returns `null` or the invoice-number.

    **Returns:**
    - `null` or the number of the previously created invoice

    **See Also:**
    - [createInvoice(String)](dw.order.Appeasement.md#createinvoicestring)


---

### getItems()
- getItems(): [FilteringCollection](dw.util.FilteringCollection.md)
  - : Returns a filtering collection of the appeasement items belonging to the appeasement.
      
      
      This [FilteringCollection](dw.util.FilteringCollection.md) could be sorted / filtered using:
      
      - [FilteringCollection.sort(Object)](dw.util.FilteringCollection.md#sortobject)with [ORDERBY_ITEMID](dw.order.Appeasement.md#orderby_itemid)  - [FilteringCollection.sort(Object)](dw.util.FilteringCollection.md#sortobject)with [ORDERBY_ITEMPOSITION](dw.order.Appeasement.md#orderby_itemposition)    - [FilteringCollection.sort(Object)](dw.util.FilteringCollection.md#sortobject)with [ORDERBY_UNSORTED](dw.order.Appeasement.md#orderby_unsorted)      - [FilteringCollection.select(Object)](dw.util.FilteringCollection.md#selectobject)with [QUALIFIER_PRODUCTITEMS](dw.order.Appeasement.md#qualifier_productitems)        - [FilteringCollection.select(Object)](dw.util.FilteringCollection.md#selectobject)with [QUALIFIER_SERVICEITEMS](dw.order.Appeasement.md#qualifier_serviceitems)


    **Returns:**
    - the filtering collection of the appeasement items


---

### getReasonCode()
- getReasonCode(): [EnumValue](dw.value.EnumValue.md)
  - : Returns the reason code for the appeasement. The list of reason codes can be updated
      by updating meta-data for Appeasement.


    **Returns:**
    - the appeasement reason code


---

### getReasonNote()
- getReasonNote(): [String](TopLevel.String.md)
  - : Returns the reason note for the appeasement.

    **Returns:**
    - the reason note or `null`


---

### getStatus()
- getStatus(): [EnumValue](dw.value.EnumValue.md)
  - : Gets the status of this appeasement.
      
      The possible values are [STATUS_OPEN](dw.order.Appeasement.md#status_open), [STATUS_COMPLETED](dw.order.Appeasement.md#status_completed).


    **Returns:**
    - the status


---

### setReasonCode(String)
- setReasonCode(reasonCode: [String](TopLevel.String.md)): void
  - : Set the reason code for the appeasement. The list of reason codes can be updated
      by updating meta-data for Appeasement.


    **Parameters:**
    - reasonCode - the reason code to set


---

### setReasonNote(String)
- setReasonNote(reasonNote: [String](TopLevel.String.md)): void
  - : Sets the reason note for the appeasement.

    **Parameters:**
    - reasonNote - the reason note for the appeasement to set


---

### setStatus(String)
- setStatus(appeasementStatus: [String](TopLevel.String.md)): void
  - : Sets the appeasement status.
      
      
      The possible values are [STATUS_OPEN](dw.order.Appeasement.md#status_open), [STATUS_COMPLETED](dw.order.Appeasement.md#status_completed).
      
      
      When set to status COMPLETED, only the the custom attributes of its appeasement items can be changed.


    **Parameters:**
    - appeasementStatus - the appeasement status to set.


---

<!-- prettier-ignore-end -->
