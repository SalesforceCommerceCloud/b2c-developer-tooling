<!-- prettier-ignore-start -->
# Class Return

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.object.Extensible](dw.object.Extensible.md)
    - [dw.order.AbstractItemCtnr](dw.order.AbstractItemCtnr.md)
      - [dw.order.Return](dw.order.Return.md)

The Return represents a physical customer return, and contains 1..n
[ReturnItem](dw.order.ReturnItem.md)s. The Return is associated with one [ReturnCase](dw.order.ReturnCase.md), and each
ReturnItem is associated with one [ReturnCaseItem](dw.order.ReturnCaseItem.md) and (via the
ReturnCaseItem) a single [OrderItem](dw.order.OrderItem.md) usually representing an [Order](dw.order.Order.md)
[ProductLineItem](dw.order.ProductLineItem.md). 

The ReturnItem records the quantity returned.

The Return can have one of these status values:

- NEW - the return is new, i.e. needs to undergo a check before it can be  marked as COMPLETED
- COMPLETED - the return is complete, this is a precondition for refunding the  customer for a return.



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
| [STATUS_COMPLETED](#status_completed): [String](TopLevel.String.md) = "COMPLETED" | Constant for Return Status COMPLETED |
| [STATUS_NEW](#status_new): [String](TopLevel.String.md) = "NEW" | Constant for Return Status NEW |

## Property Summary

| Property | Description |
| --- | --- |
| [invoice](#invoice): [Invoice](dw.order.Invoice.md) `(read-only)` | Returns null or the previously created [Invoice](dw.order.Invoice.md). |
| [invoiceNumber](#invoicenumber): [String](TopLevel.String.md) `(read-only)` | Returns null or the invoice-number. |
| [items](#items): [FilteringCollection](dw.util.FilteringCollection.md) `(read-only)` | Returns the [ReturnItem](dw.order.ReturnItem.md)s contained in the Return, created with method  [createItem(String)](dw.order.Return.md#createitemstring). |
| [note](#note): [String](TopLevel.String.md) | A note for the return. |
| [returnCase](#returncase): [ReturnCase](dw.order.ReturnCase.md) `(read-only)` | Returns the [ReturnCase](dw.order.ReturnCase.md) with which this Return is associated. |
| [returnNumber](#returnnumber): [String](TopLevel.String.md) `(read-only)` | The return number identifying this return. |
| [status](#status): [EnumValue](dw.value.EnumValue.md) | Gets the return status. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [createInvoice](dw.order.Return.md#createinvoice)() | Creates a new [Invoice](dw.order.Invoice.md) based on this Return. |
| [createInvoice](dw.order.Return.md#createinvoicestring)([String](TopLevel.String.md)) | Creates a new [Invoice](dw.order.Invoice.md) based on this Return. |
| [createItem](dw.order.Return.md#createitemstring)([String](TopLevel.String.md)) | Create a [ReturnItem](dw.order.ReturnItem.md) based on a [ReturnCaseItem](dw.order.ReturnCaseItem.md). |
| [getInvoice](dw.order.Return.md#getinvoice)() | Returns null or the previously created [Invoice](dw.order.Invoice.md). |
| [getInvoiceNumber](dw.order.Return.md#getinvoicenumber)() | Returns null or the invoice-number. |
| [getItems](dw.order.Return.md#getitems)() | Returns the [ReturnItem](dw.order.ReturnItem.md)s contained in the Return, created with method  [createItem(String)](dw.order.Return.md#createitemstring). |
| [getNote](dw.order.Return.md#getnote)() | A note for the return. |
| [getReturnCase](dw.order.Return.md#getreturncase)() | Returns the [ReturnCase](dw.order.ReturnCase.md) with which this Return is associated. |
| [getReturnNumber](dw.order.Return.md#getreturnnumber)() | The return number identifying this return. |
| [getStatus](dw.order.Return.md#getstatus)() | Gets the return status. |
| [setNote](dw.order.Return.md#setnotestring)([String](TopLevel.String.md)) | Sets a note for the return. |
| [setStatus](dw.order.Return.md#setstatusstring)([String](TopLevel.String.md)) | Sets the return status. |

### Methods inherited from class AbstractItemCtnr

[getCreatedBy](dw.order.AbstractItemCtnr.md#getcreatedby), [getCreationDate](dw.order.AbstractItemCtnr.md#getcreationdate), [getGrandTotal](dw.order.AbstractItemCtnr.md#getgrandtotal), [getItems](dw.order.AbstractItemCtnr.md#getitems), [getLastModified](dw.order.AbstractItemCtnr.md#getlastmodified), [getModifiedBy](dw.order.AbstractItemCtnr.md#getmodifiedby), [getOrder](dw.order.AbstractItemCtnr.md#getorder), [getProductSubtotal](dw.order.AbstractItemCtnr.md#getproductsubtotal), [getServiceSubtotal](dw.order.AbstractItemCtnr.md#getservicesubtotal)
### Methods inherited from class Extensible

[describe](dw.object.Extensible.md#describe), [getCustom](dw.object.Extensible.md#getcustom)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### ORDERBY_ITEMID

- ORDERBY_ITEMID: [Object](TopLevel.Object.md)
  - : Sorting by item id. Use with method [getItems()](dw.order.Return.md#getitems) as an argument to method [FilteringCollection.sort(Object)](dw.util.FilteringCollection.md#sortobject).


---

### ORDERBY_ITEMPOSITION

- ORDERBY_ITEMPOSITION: [Object](TopLevel.Object.md)
  - : Sorting by the position of the related oder item. Use with method [getItems()](dw.order.Return.md#getitems) as an argument to method [FilteringCollection.sort(Object)](dw.util.FilteringCollection.md#sortobject).


---

### ORDERBY_UNSORTED

- ORDERBY_UNSORTED: [Object](TopLevel.Object.md)
  - : Unsorted , as it is. Use with method [getItems()](dw.order.Return.md#getitems) as an argument to method [FilteringCollection.sort(Object)](dw.util.FilteringCollection.md#sortobject).


---

### QUALIFIER_PRODUCTITEMS

- QUALIFIER_PRODUCTITEMS: [Object](TopLevel.Object.md)
  - : Selects the product items. Use with method [getItems()](dw.order.Return.md#getitems) as an argument to method [FilteringCollection.select(Object)](dw.util.FilteringCollection.md#selectobject).


---

### QUALIFIER_SERVICEITEMS

- QUALIFIER_SERVICEITEMS: [Object](TopLevel.Object.md)
  - : Selects for the service items. Use with method [getItems()](dw.order.Return.md#getitems) as an argument to method [FilteringCollection.select(Object)](dw.util.FilteringCollection.md#selectobject).


---

### STATUS_COMPLETED

- STATUS_COMPLETED: [String](TopLevel.String.md) = "COMPLETED"
  - : Constant for Return Status COMPLETED


---

### STATUS_NEW

- STATUS_NEW: [String](TopLevel.String.md) = "NEW"
  - : Constant for Return Status NEW


---

## Property Details

### invoice
- invoice: [Invoice](dw.order.Invoice.md) `(read-only)`
  - : Returns null or the previously created [Invoice](dw.order.Invoice.md).

    **See Also:**
    - [createInvoice(String)](dw.order.Return.md#createinvoicestring)


---

### invoiceNumber
- invoiceNumber: [String](TopLevel.String.md) `(read-only)`
  - : Returns null or the invoice-number.

    **See Also:**
    - [createInvoice(String)](dw.order.Return.md#createinvoicestring)


---

### items
- items: [FilteringCollection](dw.util.FilteringCollection.md) `(read-only)`
  - : Returns the [ReturnItem](dw.order.ReturnItem.md)s contained in the Return, created with method
      [createItem(String)](dw.order.Return.md#createitemstring).
      
      
      
      This [FilteringCollection](dw.util.FilteringCollection.md) can be sorted / filtered using:
      
      - [FilteringCollection.sort(Object)](dw.util.FilteringCollection.md#sortobject)with [ORDERBY_ITEMID](dw.order.Return.md#orderby_itemid)  - [FilteringCollection.sort(Object)](dw.util.FilteringCollection.md#sortobject)with    [ORDERBY_ITEMPOSITION](dw.order.Return.md#orderby_itemposition)    - [FilteringCollection.sort(Object)](dw.util.FilteringCollection.md#sortobject)with [ORDERBY_UNSORTED](dw.order.Return.md#orderby_unsorted)      - [FilteringCollection.select(Object)](dw.util.FilteringCollection.md#selectobject)with [QUALIFIER_PRODUCTITEMS](dw.order.Return.md#qualifier_productitems)        - [FilteringCollection.select(Object)](dw.util.FilteringCollection.md#selectobject)with [QUALIFIER_SERVICEITEMS](dw.order.Return.md#qualifier_serviceitems)


    **See Also:**
    - [ReturnItem](dw.order.ReturnItem.md)


---

### note
- note: [String](TopLevel.String.md)
  - : A note for the return.


---

### returnCase
- returnCase: [ReturnCase](dw.order.ReturnCase.md) `(read-only)`
  - : Returns the [ReturnCase](dw.order.ReturnCase.md) with which this Return is associated. The ReturnCase
      may represent an RMA (return merchandise authorization).



---

### returnNumber
- returnNumber: [String](TopLevel.String.md) `(read-only)`
  - : The return number identifying this return.


---

### status
- status: [EnumValue](dw.value.EnumValue.md)
  - : Gets the return status.
      
      
      Possible values are [STATUS_NEW](dw.order.Return.md#status_new), [STATUS_COMPLETED](dw.order.Return.md#status_completed).



---

## Method Details

### createInvoice()
- createInvoice(): [Invoice](dw.order.Invoice.md)
  - : Creates a new [Invoice](dw.order.Invoice.md) based on this Return.
      The return-number will be used as the invoice-number. The
      Invoice can then be accessed using [getInvoice()](dw.order.Return.md#getinvoice) or its
      number using [getInvoiceNumber()](dw.order.Return.md#getinvoicenumber). The method must not be called
      more than once for a Return, nor may 2 Invoices exist
      with the same invoice-number.
      
      
      The new Invoice is a credit-invoice with a [Invoice.STATUS_NOT_PAID](dw.order.Invoice.md#status_not_paid) status, and
      will be passed to the refund payment-hook in a separate database
      transaction for processing.


    **Returns:**
    - new invoice


---

### createInvoice(String)
- createInvoice(invoiceNumber: [String](TopLevel.String.md)): [Invoice](dw.order.Invoice.md)
  - : Creates a new [Invoice](dw.order.Invoice.md) based on this Return. The
      invoice-number must be specified as an argument. The
      Invoice can then be accessed using [getInvoice()](dw.order.Return.md#getinvoice) or its
      number using [getInvoiceNumber()](dw.order.Return.md#getinvoicenumber). The method must not be called
      more than once for a Return, nor may 2 Invoices exist
      with the same invoice-number.
      
      
      The new Invoice is a credit-invoice with a [Invoice.STATUS_NOT_PAID](dw.order.Invoice.md#status_not_paid) status, and
      will be passed to the refund payment-hook in a separate database
      transaction for processing.


    **Parameters:**
    - invoiceNumber - the invoice-number to use

    **Returns:**
    - the new invoice


---

### createItem(String)
- createItem(returnCaseItemID: [String](TopLevel.String.md)): [ReturnItem](dw.order.ReturnItem.md)
  - : Create a [ReturnItem](dw.order.ReturnItem.md) based on a [ReturnCaseItem](dw.order.ReturnCaseItem.md).

    **Parameters:**
    - returnCaseItemID - the id of the return case item

    **Returns:**
    - the created return item


---

### getInvoice()
- getInvoice(): [Invoice](dw.order.Invoice.md)
  - : Returns null or the previously created [Invoice](dw.order.Invoice.md).

    **Returns:**
    - null or the previously created invoice.

    **See Also:**
    - [createInvoice(String)](dw.order.Return.md#createinvoicestring)


---

### getInvoiceNumber()
- getInvoiceNumber(): [String](TopLevel.String.md)
  - : Returns null or the invoice-number.

    **Returns:**
    - null or the previously created invoice.

    **See Also:**
    - [createInvoice(String)](dw.order.Return.md#createinvoicestring)


---

### getItems()
- getItems(): [FilteringCollection](dw.util.FilteringCollection.md)
  - : Returns the [ReturnItem](dw.order.ReturnItem.md)s contained in the Return, created with method
      [createItem(String)](dw.order.Return.md#createitemstring).
      
      
      
      This [FilteringCollection](dw.util.FilteringCollection.md) can be sorted / filtered using:
      
      - [FilteringCollection.sort(Object)](dw.util.FilteringCollection.md#sortobject)with [ORDERBY_ITEMID](dw.order.Return.md#orderby_itemid)  - [FilteringCollection.sort(Object)](dw.util.FilteringCollection.md#sortobject)with    [ORDERBY_ITEMPOSITION](dw.order.Return.md#orderby_itemposition)    - [FilteringCollection.sort(Object)](dw.util.FilteringCollection.md#sortobject)with [ORDERBY_UNSORTED](dw.order.Return.md#orderby_unsorted)      - [FilteringCollection.select(Object)](dw.util.FilteringCollection.md#selectobject)with [QUALIFIER_PRODUCTITEMS](dw.order.Return.md#qualifier_productitems)        - [FilteringCollection.select(Object)](dw.util.FilteringCollection.md#selectobject)with [QUALIFIER_SERVICEITEMS](dw.order.Return.md#qualifier_serviceitems)


    **Returns:**
    - the return items

    **See Also:**
    - [ReturnItem](dw.order.ReturnItem.md)


---

### getNote()
- getNote(): [String](TopLevel.String.md)
  - : A note for the return.

    **Returns:**
    - the note or `null`


---

### getReturnCase()
- getReturnCase(): [ReturnCase](dw.order.ReturnCase.md)
  - : Returns the [ReturnCase](dw.order.ReturnCase.md) with which this Return is associated. The ReturnCase
      may represent an RMA (return merchandise authorization).


    **Returns:**
    - the return case


---

### getReturnNumber()
- getReturnNumber(): [String](TopLevel.String.md)
  - : The return number identifying this return.

    **Returns:**
    - the return number


---

### getStatus()
- getStatus(): [EnumValue](dw.value.EnumValue.md)
  - : Gets the return status.
      
      
      Possible values are [STATUS_NEW](dw.order.Return.md#status_new), [STATUS_COMPLETED](dw.order.Return.md#status_completed).


    **Returns:**
    - the status


---

### setNote(String)
- setNote(note: [String](TopLevel.String.md)): void
  - : Sets a note for the return.

    **Parameters:**
    - note - the note


---

### setStatus(String)
- setStatus(statusName: [String](TopLevel.String.md)): void
  - : Sets the return status.
      
      
      Possible values are [STATUS_NEW](dw.order.Return.md#status_new), [STATUS_COMPLETED](dw.order.Return.md#status_completed)
      
      
      When set to status COMPLETED, only the the custom attributes of the return itself and its return items can be changed.


    **Parameters:**
    - statusName - the status


---

<!-- prettier-ignore-end -->
