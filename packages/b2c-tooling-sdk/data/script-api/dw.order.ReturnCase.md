<!-- prettier-ignore-start -->
# Class ReturnCase

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.object.Extensible](dw.object.Extensible.md)
    - [dw.order.AbstractItemCtnr](dw.order.AbstractItemCtnr.md)
      - [dw.order.ReturnCase](dw.order.ReturnCase.md)

All returns exist in the context of a ReturnCase, each [Order](dw.order.Order.md)
can have any number of ReturnCases. 

The ReturnCase has [ReturnCaseItem](dw.order.ReturnCaseItem.md)s, each of which is associated with an
[OrderItem](dw.order.OrderItem.md) (an extension to either a [ProductLineItem](dw.order.ProductLineItem.md) or a [ShippingLineItem](dw.order.ShippingLineItem.md)). 

Each ReturnCaseItem defines [ReturnCaseItem.getAuthorizedQuantity()](dw.order.ReturnCaseItem.md#getauthorizedquantity) representing the maximum
quantity expected to be returned. The ReturnCaseItem may be associated with
0..n [ReturnItem](dw.order.ReturnItem.md)s - ReturnItems are added to the ReturnCaseItem when
[Return](dw.order.Return.md)s are created.


_Either_ - a ReturnCase may be used as an RMA, in which case they are
created when a customer first shows a wish to return item(s). The customer
then includes the RMA number with the returned item(s). The Return created as
a result is then associated with the existing ReturnCase. 

_Or_ - a ReturnCase is automatically created as part of the return
creation, i.e. the customer returns some item(s) leading to a creation of
both a Return and an associated ReturnCase.




The scripting api allows access to the ReturnCases, whether the ReturnCase is an RMA or not,
and the ReturnCase status. Both the ReturnCaseItems and any Returns
associated with the ReturnCase can be accessed.


A ReturnCase has one of these status values:

- NEW - the ReturnCase has been created and can be edited previous to  its authorization
- CONFIRMED - the ReturnCase is CONFIRMED, can no longer be edited, no  Returns have been associated with it. Only a NEW- ReturnCase can be  CONFIRMED
- PARTIAL\_RETURNED - the ReturnCase has been associated with at least one Return,  but is not yet complete. Only a CONFIRMED- ReturnCase can be set to  PARTIAL\_RETURNED
- RETURNED - the ReturnCase has been associated with Returns which match  the expected authorized quantity. Only an CONFIRMED- or PARTIAL\_RETURNED- return-case  can be set to RETURNED
- CANCELLED - the ReturnCase has been cancelled (only a NEW- or  CONFIRMED- ReturnCase can be cancelled)



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
| [STATUS_CANCELLED](#status_cancelled): [String](TopLevel.String.md) = "CANCELLED" | constant for ReturnCase Status CANCELLED |
| [STATUS_CONFIRMED](#status_confirmed): [String](TopLevel.String.md) = "CONFIRMED" | constant for ReturnCase Status CONFIRMED |
| [STATUS_NEW](#status_new): [String](TopLevel.String.md) = "NEW" | constant for ReturnCase Status NEW |
| [STATUS_PARTIAL_RETURNED](#status_partial_returned): [String](TopLevel.String.md) = "PARTIAL_RETURNED" | constant for ReturnCase Status PARTIAL RETURNED |
| [STATUS_RETURNED](#status_returned): [String](TopLevel.String.md) = "RETURNED" | constant for ReturnCase Status RETURNED |

## Property Summary

| Property | Description |
| --- | --- |
| [RMA](#rma): [Boolean](TopLevel.Boolean.md) `(read-only)` | Return whether this is an RMA. |
| [invoice](#invoice): [Invoice](dw.order.Invoice.md) `(read-only)` | Returns null or the previously created [Invoice](dw.order.Invoice.md). |
| [invoiceNumber](#invoicenumber): [String](TopLevel.String.md) `(read-only)` | Returns null or the invoice-number. |
| [items](#items): [FilteringCollection](dw.util.FilteringCollection.md) `(read-only)` | Access the collection of [ReturnCaseItem](dw.order.ReturnCaseItem.md)s. |
| [returnCaseNumber](#returncasenumber): [String](TopLevel.String.md) `(read-only)` | Returns the mandatory return case number identifying this document. |
| [returns](#returns): [Collection](dw.util.Collection.md) `(read-only)` | Return the collection of [Return](dw.order.Return.md)s associated with this ReturnCase. |
| [status](#status): [EnumValue](dw.value.EnumValue.md) `(read-only)` | Gets the return case item status. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [confirm](dw.order.ReturnCase.md#confirm)() | <p>Attempt to confirm the ReturnCase. |
| [createInvoice](dw.order.ReturnCase.md#createinvoice)() | Creates a new [Invoice](dw.order.Invoice.md) based on this  ReturnCase. |
| [createInvoice](dw.order.ReturnCase.md#createinvoicestring)([String](TopLevel.String.md)) | Creates a new [Invoice](dw.order.Invoice.md) based on this  ReturnCase. |
| [createItem](dw.order.ReturnCase.md#createitemstring)([String](TopLevel.String.md)) | Creates a new item for a given order item. |
| [createReturn](dw.order.ReturnCase.md#createreturn)() | Creates a new [Return](dw.order.Return.md) with a generated number and associates it with this ReturnCase. |
| [createReturn](dw.order.ReturnCase.md#createreturnstring)([String](TopLevel.String.md)) | Creates a new [Return](dw.order.Return.md) with the given number and associates it with this ReturnCase. |
| [getInvoice](dw.order.ReturnCase.md#getinvoice)() | Returns null or the previously created [Invoice](dw.order.Invoice.md). |
| [getInvoiceNumber](dw.order.ReturnCase.md#getinvoicenumber)() | Returns null or the invoice-number. |
| [getItems](dw.order.ReturnCase.md#getitems)() | Access the collection of [ReturnCaseItem](dw.order.ReturnCaseItem.md)s. |
| [getReturnCaseNumber](dw.order.ReturnCase.md#getreturncasenumber)() | Returns the mandatory return case number identifying this document. |
| [getReturns](dw.order.ReturnCase.md#getreturns)() | Return the collection of [Return](dw.order.Return.md)s associated with this ReturnCase. |
| [getStatus](dw.order.ReturnCase.md#getstatus)() | Gets the return case item status. |
| [isRMA](dw.order.ReturnCase.md#isrma)() | Return whether this is an RMA. |

### Methods inherited from class AbstractItemCtnr

[getCreatedBy](dw.order.AbstractItemCtnr.md#getcreatedby), [getCreationDate](dw.order.AbstractItemCtnr.md#getcreationdate), [getGrandTotal](dw.order.AbstractItemCtnr.md#getgrandtotal), [getItems](dw.order.AbstractItemCtnr.md#getitems), [getLastModified](dw.order.AbstractItemCtnr.md#getlastmodified), [getModifiedBy](dw.order.AbstractItemCtnr.md#getmodifiedby), [getOrder](dw.order.AbstractItemCtnr.md#getorder), [getProductSubtotal](dw.order.AbstractItemCtnr.md#getproductsubtotal), [getServiceSubtotal](dw.order.AbstractItemCtnr.md#getservicesubtotal)
### Methods inherited from class Extensible

[describe](dw.object.Extensible.md#describe), [getCustom](dw.object.Extensible.md#getcustom)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### ORDERBY_ITEMID

- ORDERBY_ITEMID: [Object](TopLevel.Object.md)
  - : Sorting by item id. Use with method [getItems()](dw.order.ReturnCase.md#getitems) as an argument to method [FilteringCollection.sort(Object)](dw.util.FilteringCollection.md#sortobject).


---

### ORDERBY_ITEMPOSITION

- ORDERBY_ITEMPOSITION: [Object](TopLevel.Object.md)
  - : Sorting by the position of the related oder item. Use with method [getItems()](dw.order.ReturnCase.md#getitems) as an argument to method [FilteringCollection.sort(Object)](dw.util.FilteringCollection.md#sortobject).


---

### ORDERBY_UNSORTED

- ORDERBY_UNSORTED: [Object](TopLevel.Object.md)
  - : Unsorted , as it is. Use with method [getItems()](dw.order.ReturnCase.md#getitems) as an argument to method [FilteringCollection.sort(Object)](dw.util.FilteringCollection.md#sortobject).


---

### QUALIFIER_PRODUCTITEMS

- QUALIFIER_PRODUCTITEMS: [Object](TopLevel.Object.md)
  - : Selects the product items. Use with method [getItems()](dw.order.ReturnCase.md#getitems) as an argument to method [FilteringCollection.select(Object)](dw.util.FilteringCollection.md#selectobject).


---

### QUALIFIER_SERVICEITEMS

- QUALIFIER_SERVICEITEMS: [Object](TopLevel.Object.md)
  - : Selects for the service items. Use with method [getItems()](dw.order.ReturnCase.md#getitems) as an argument to method [FilteringCollection.select(Object)](dw.util.FilteringCollection.md#selectobject).


---

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

### RMA
- RMA: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Return whether this is an RMA. This is specified when calling [Order.createReturnCase(String, Boolean)](dw.order.Order.md#createreturncasestring-boolean).


---

### invoice
- invoice: [Invoice](dw.order.Invoice.md) `(read-only)`
  - : Returns null or the previously created [Invoice](dw.order.Invoice.md).

    **See Also:**
    - [createInvoice(String)](dw.order.ReturnCase.md#createinvoicestring)


---

### invoiceNumber
- invoiceNumber: [String](TopLevel.String.md) `(read-only)`
  - : Returns null or the invoice-number.

    **See Also:**
    - [createInvoice(String)](dw.order.ReturnCase.md#createinvoicestring)


---

### items
- items: [FilteringCollection](dw.util.FilteringCollection.md) `(read-only)`
  - : Access the collection of [ReturnCaseItem](dw.order.ReturnCaseItem.md)s.
      
      
      This [FilteringCollection](dw.util.FilteringCollection.md) can be sorted / filtered using:
      
      - [FilteringCollection.sort(Object)](dw.util.FilteringCollection.md#sortobject)with [ORDERBY_ITEMID](dw.order.ReturnCase.md#orderby_itemid)  - [FilteringCollection.sort(Object)](dw.util.FilteringCollection.md#sortobject)with    [ORDERBY_ITEMPOSITION](dw.order.ReturnCase.md#orderby_itemposition)    - [FilteringCollection.sort(Object)](dw.util.FilteringCollection.md#sortobject)with [ORDERBY_UNSORTED](dw.order.ReturnCase.md#orderby_unsorted)      - [FilteringCollection.select(Object)](dw.util.FilteringCollection.md#selectobject)with [QUALIFIER_PRODUCTITEMS](dw.order.ReturnCase.md#qualifier_productitems)        - [FilteringCollection.select(Object)](dw.util.FilteringCollection.md#selectobject)with [QUALIFIER_SERVICEITEMS](dw.order.ReturnCase.md#qualifier_serviceitems)



---

### returnCaseNumber
- returnCaseNumber: [String](TopLevel.String.md) `(read-only)`
  - : Returns the mandatory return case number identifying this document.


---

### returns
- returns: [Collection](dw.util.Collection.md) `(read-only)`
  - : Return the collection of [Return](dw.order.Return.md)s associated with this ReturnCase.


---

### status
- status: [EnumValue](dw.value.EnumValue.md) `(read-only)`
  - : Gets the return case item status. The status of a ReturnCase is read-only and calculated from the status of
      the associated [ReturnCaseItem](dw.order.ReturnCaseItem.md)s.
      
      
      The possible values are [STATUS_NEW](dw.order.ReturnCase.md#status_new),[STATUS_CONFIRMED](dw.order.ReturnCase.md#status_confirmed),
      [STATUS_PARTIAL_RETURNED](dw.order.ReturnCase.md#status_partial_returned), [STATUS_RETURNED](dw.order.ReturnCase.md#status_returned),
      [STATUS_CANCELLED](dw.order.ReturnCase.md#status_cancelled).



---

## Method Details

### confirm()
- confirm(): void
  - : 
      Attempt to confirm the ReturnCase.
      
      
      Without items the return case will be canceled
      
      
      When confirmed, only the the custom attributes of its return case items can be changed.


    **Throws:**
    - IllegalStateException - thrown if Status is not [STATUS_NEW](dw.order.ReturnCase.md#status_new)


---

### createInvoice()
- createInvoice(): [Invoice](dw.order.Invoice.md)
  - : Creates a new [Invoice](dw.order.Invoice.md) based on this
      ReturnCase. The return-case-number will
      be used as the invoice-number. The Invoice can then be
      accessed using [getInvoice()](dw.order.ReturnCase.md#getinvoice) or its number using
      [getInvoiceNumber()](dw.order.ReturnCase.md#getinvoicenumber). The method must not be called more than once
      for a ReturnCase, nor may 2 Invoices
      exist with the same invoice-number.
      
      
      The new Invoice is a credit-invoice with a
      [Invoice.STATUS_NOT_PAID](dw.order.Invoice.md#status_not_paid) status, and will be passed to
      the refund payment-hook in a separate database transaction for
      processing.


    **Returns:**
    - new invoice


---

### createInvoice(String)
- createInvoice(invoiceNumber: [String](TopLevel.String.md)): [Invoice](dw.order.Invoice.md)
  - : Creates a new [Invoice](dw.order.Invoice.md) based on this
      ReturnCase. The invoice-number must be specified as an
      argument. The Invoice can then be
      accessed using [getInvoice()](dw.order.ReturnCase.md#getinvoice) or its number using
      [getInvoiceNumber()](dw.order.ReturnCase.md#getinvoicenumber). The method must not be called more than once
      for a ReturnCase, nor may 2 Invoices
      exist with the same invoice-number.
      
      
      The new Invoice is a credit-invoice with a
      [Invoice.STATUS_NOT_PAID](dw.order.Invoice.md#status_not_paid) status, and will be passed to
      the refund payment-hook in a separate database transaction for
      processing.


    **Parameters:**
    - invoiceNumber - the invoice-number to be used for the invoice creation

    **Returns:**
    - new invoice


---

### createItem(String)
- createItem(orderItemID: [String](TopLevel.String.md)): [ReturnCaseItem](dw.order.ReturnCaseItem.md)
  - : Creates a new item for a given order item. Note: a ReturnCase may have
      only one item per order item.


    **Parameters:**
    - orderItemID - order item id

    **Returns:**
    - null or item for given order item

    **Throws:**
    - IllegalArgumentException - thrown if getItem(orderItem) returns non null


---

### createReturn()
- createReturn(): [Return](dw.order.Return.md)
  - : Creates a new [Return](dw.order.Return.md) with a generated number and associates it with this ReturnCase.

    **Returns:**
    - new Return instance


---

### createReturn(String)
- createReturn(returnNumber: [String](TopLevel.String.md)): [Return](dw.order.Return.md)
  - : Creates a new [Return](dw.order.Return.md) with the given number and associates it with this ReturnCase.

    **Parameters:**
    - returnNumber - return number to assign

    **Returns:**
    - new Return instance


---

### getInvoice()
- getInvoice(): [Invoice](dw.order.Invoice.md)
  - : Returns null or the previously created [Invoice](dw.order.Invoice.md).

    **Returns:**
    - null or the previously created invoice.

    **See Also:**
    - [createInvoice(String)](dw.order.ReturnCase.md#createinvoicestring)


---

### getInvoiceNumber()
- getInvoiceNumber(): [String](TopLevel.String.md)
  - : Returns null or the invoice-number.

    **Returns:**
    - null or the previously created invoice.

    **See Also:**
    - [createInvoice(String)](dw.order.ReturnCase.md#createinvoicestring)


---

### getItems()
- getItems(): [FilteringCollection](dw.util.FilteringCollection.md)
  - : Access the collection of [ReturnCaseItem](dw.order.ReturnCaseItem.md)s.
      
      
      This [FilteringCollection](dw.util.FilteringCollection.md) can be sorted / filtered using:
      
      - [FilteringCollection.sort(Object)](dw.util.FilteringCollection.md#sortobject)with [ORDERBY_ITEMID](dw.order.ReturnCase.md#orderby_itemid)  - [FilteringCollection.sort(Object)](dw.util.FilteringCollection.md#sortobject)with    [ORDERBY_ITEMPOSITION](dw.order.ReturnCase.md#orderby_itemposition)    - [FilteringCollection.sort(Object)](dw.util.FilteringCollection.md#sortobject)with [ORDERBY_UNSORTED](dw.order.ReturnCase.md#orderby_unsorted)      - [FilteringCollection.select(Object)](dw.util.FilteringCollection.md#selectobject)with [QUALIFIER_PRODUCTITEMS](dw.order.ReturnCase.md#qualifier_productitems)        - [FilteringCollection.select(Object)](dw.util.FilteringCollection.md#selectobject)with [QUALIFIER_SERVICEITEMS](dw.order.ReturnCase.md#qualifier_serviceitems)


    **Returns:**
    - the items


---

### getReturnCaseNumber()
- getReturnCaseNumber(): [String](TopLevel.String.md)
  - : Returns the mandatory return case number identifying this document.

    **Returns:**
    - the return case number


---

### getReturns()
- getReturns(): [Collection](dw.util.Collection.md)
  - : Return the collection of [Return](dw.order.Return.md)s associated with this ReturnCase.

    **Returns:**
    - the collection of Returns.


---

### getStatus()
- getStatus(): [EnumValue](dw.value.EnumValue.md)
  - : Gets the return case item status. The status of a ReturnCase is read-only and calculated from the status of
      the associated [ReturnCaseItem](dw.order.ReturnCaseItem.md)s.
      
      
      The possible values are [STATUS_NEW](dw.order.ReturnCase.md#status_new),[STATUS_CONFIRMED](dw.order.ReturnCase.md#status_confirmed),
      [STATUS_PARTIAL_RETURNED](dw.order.ReturnCase.md#status_partial_returned), [STATUS_RETURNED](dw.order.ReturnCase.md#status_returned),
      [STATUS_CANCELLED](dw.order.ReturnCase.md#status_cancelled).


    **Returns:**
    - the status


---

### isRMA()
- isRMA(): [Boolean](TopLevel.Boolean.md)
  - : Return whether this is an RMA. This is specified when calling [Order.createReturnCase(String, Boolean)](dw.order.Order.md#createreturncasestring-boolean).

    **Returns:**
    - whether this is an RMA.


---

<!-- prettier-ignore-end -->
