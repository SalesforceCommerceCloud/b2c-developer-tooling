<!-- prettier-ignore-start -->
# Class Invoice

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.object.Extensible](dw.object.Extensible.md)
    - [dw.order.AbstractItemCtnr](dw.order.AbstractItemCtnr.md)
      - [dw.order.Invoice](dw.order.Invoice.md)

The Invoice can be a debit or credit invoice, and is created
from custom scripts using one of the methods
[ShippingOrder.createInvoice(String)](dw.order.ShippingOrder.md#createinvoicestring),
[Appeasement.createInvoice(String)](dw.order.Appeasement.md#createinvoicestring),
[ReturnCase.createInvoice(String)](dw.order.ReturnCase.md#createinvoicestring) or
[Return.createInvoice(String)](dw.order.Return.md#createinvoicestring).


Order post-processing APIs (gillian) are now inactive by default and will throw
an exception if accessed. Activation needs preliminary approval by Product Management.
Please contact support in this case. Existing customers using these APIs are not
affected by this change and can use the APIs until further notice.



## Constant Summary

| Constant | Description |
| --- | --- |
| [ORDERBY_CREATION_DATE](#orderby_creation_date): [Object](TopLevel.Object.md) | Sorting by creation date. |
| [ORDERBY_ITEMID](#orderby_itemid): [Object](TopLevel.Object.md) | Sorting by item id. |
| [ORDERBY_ITEMPOSITION](#orderby_itemposition): [Object](TopLevel.Object.md) | Sorting by the position of the related oder item. |
| [ORDERBY_REVERSE](#orderby_reverse): [Object](TopLevel.Object.md) | Reverse orders. |
| [ORDERBY_UNSORTED](#orderby_unsorted): [Object](TopLevel.Object.md) | Unsorted , as it is. |
| [QUALIFIER_CAPTURE](#qualifier_capture): [Object](TopLevel.Object.md) | Selects the capture transactions. |
| [QUALIFIER_PRODUCTITEMS](#qualifier_productitems): [Object](TopLevel.Object.md) | Selects the product items. |
| [QUALIFIER_REFUND](#qualifier_refund): [Object](TopLevel.Object.md) | Selects the refund transactions. |
| [QUALIFIER_SERVICEITEMS](#qualifier_serviceitems): [Object](TopLevel.Object.md) | Selects for the service items. |
| [STATUS_FAILED](#status_failed): [String](TopLevel.String.md) = "FAILED" | Constant for Invoice Status Failed.  The invoice handling failed. |
| [STATUS_MANUAL](#status_manual): [String](TopLevel.String.md) = "MANUAL" | Constant for Invoice Status Manual.  The invoice is not paid but will **not** be handled automatically.  A manual invoice handling (capture or refund) is necessary. |
| [STATUS_NOT_PAID](#status_not_paid): [String](TopLevel.String.md) = "NOT_PAID" | Constant for Invoice Status Not Paid.  The invoice is not paid and will be handled automatically. |
| [STATUS_PAID](#status_paid): [String](TopLevel.String.md) = "PAID" | Constant for Invoice Status Paid.  The invoice was successfully paid. |
| [TYPE_APPEASEMENT](#type_appeasement): [String](TopLevel.String.md) = "APPEASEMENT" | Constant for Invoice Type Appeasement.  The invoice was created for an appeasement.  The invoice amount needs to be refunded. |
| [TYPE_RETURN](#type_return): [String](TopLevel.String.md) = "RETURN" | Constant for Invoice Type Return.  The invoice was created for a return.  The invoice amount needs to be refunded. |
| [TYPE_RETURN_CASE](#type_return_case): [String](TopLevel.String.md) = "RETURN_CASE" | Constant for Invoice Type Return Case.  The invoice was created for a return case.  The invoice amount needs to be refunded. |
| [TYPE_SHIPPING](#type_shipping): [String](TopLevel.String.md) = "SHIPPING" | Constant for Invoice Type Shipping.  The invoice was created for a shipping order.  The invoice amount needs to be captured. |

## Property Summary

| Property | Description |
| --- | --- |
| [capturedAmount](#capturedamount): [Money](dw.value.Money.md) `(read-only)` | Returns the sum of the captured amounts. |
| [invoiceNumber](#invoicenumber): [String](TopLevel.String.md) `(read-only)` | Returns the invoice number. |
| [items](#items): [FilteringCollection](dw.util.FilteringCollection.md) `(read-only)` | Access the collection of [InvoiceItem](dw.order.InvoiceItem.md)s. |
| [paymentTransactions](#paymenttransactions): [FilteringCollection](dw.util.FilteringCollection.md) `(read-only)` | Returns the payment transactions belonging to this Invoice. |
| [refundedAmount](#refundedamount): [Money](dw.value.Money.md) `(read-only)` | Returns the sum of the refunded amounts. |
| [status](#status): [EnumValue](dw.value.EnumValue.md) | Returns the invoice status.  The possible values are [STATUS_NOT_PAID](dw.order.Invoice.md#status_not_paid), [STATUS_MANUAL](dw.order.Invoice.md#status_manual),  [STATUS_PAID](dw.order.Invoice.md#status_paid), [STATUS_FAILED](dw.order.Invoice.md#status_failed). |
| [type](#type): [EnumValue](dw.value.EnumValue.md) `(read-only)` | Returns the invoice type.  The possible values are [TYPE_SHIPPING](dw.order.Invoice.md#type_shipping), [TYPE_RETURN](dw.order.Invoice.md#type_return),  [TYPE_RETURN_CASE](dw.order.Invoice.md#type_return_case), [TYPE_APPEASEMENT](dw.order.Invoice.md#type_appeasement). |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [account](dw.order.Invoice.md#account)() | <p>  The invoice will be accounted. |
| [addCaptureTransaction](dw.order.Invoice.md#addcapturetransactionorderpaymentinstrument-money)([OrderPaymentInstrument](dw.order.OrderPaymentInstrument.md), [Money](dw.value.Money.md)) | Calling this method registers an amount captured for a given  order payment instrument. |
| [addRefundTransaction](dw.order.Invoice.md#addrefundtransactionorderpaymentinstrument-money)([OrderPaymentInstrument](dw.order.OrderPaymentInstrument.md), [Money](dw.value.Money.md)) | Calling this method registers an amount refunded for a given  order payment instrument. |
| [getCapturedAmount](dw.order.Invoice.md#getcapturedamount)() | Returns the sum of the captured amounts. |
| [getInvoiceNumber](dw.order.Invoice.md#getinvoicenumber)() | Returns the invoice number. |
| [getItems](dw.order.Invoice.md#getitems)() | Access the collection of [InvoiceItem](dw.order.InvoiceItem.md)s. |
| [getPaymentTransactions](dw.order.Invoice.md#getpaymenttransactions)() | Returns the payment transactions belonging to this Invoice. |
| [getRefundedAmount](dw.order.Invoice.md#getrefundedamount)() | Returns the sum of the refunded amounts. |
| [getStatus](dw.order.Invoice.md#getstatus)() | Returns the invoice status.  The possible values are [STATUS_NOT_PAID](dw.order.Invoice.md#status_not_paid), [STATUS_MANUAL](dw.order.Invoice.md#status_manual),  [STATUS_PAID](dw.order.Invoice.md#status_paid), [STATUS_FAILED](dw.order.Invoice.md#status_failed). |
| [getType](dw.order.Invoice.md#gettype)() | Returns the invoice type.  The possible values are [TYPE_SHIPPING](dw.order.Invoice.md#type_shipping), [TYPE_RETURN](dw.order.Invoice.md#type_return),  [TYPE_RETURN_CASE](dw.order.Invoice.md#type_return_case), [TYPE_APPEASEMENT](dw.order.Invoice.md#type_appeasement). |
| [setStatus](dw.order.Invoice.md#setstatusstring)([String](TopLevel.String.md)) | Sets the invoice status.  The possible values are [STATUS_NOT_PAID](dw.order.Invoice.md#status_not_paid), [STATUS_MANUAL](dw.order.Invoice.md#status_manual),  [STATUS_PAID](dw.order.Invoice.md#status_paid), [STATUS_FAILED](dw.order.Invoice.md#status_failed). |

### Methods inherited from class AbstractItemCtnr

[getCreatedBy](dw.order.AbstractItemCtnr.md#getcreatedby), [getCreationDate](dw.order.AbstractItemCtnr.md#getcreationdate), [getGrandTotal](dw.order.AbstractItemCtnr.md#getgrandtotal), [getItems](dw.order.AbstractItemCtnr.md#getitems), [getLastModified](dw.order.AbstractItemCtnr.md#getlastmodified), [getModifiedBy](dw.order.AbstractItemCtnr.md#getmodifiedby), [getOrder](dw.order.AbstractItemCtnr.md#getorder), [getProductSubtotal](dw.order.AbstractItemCtnr.md#getproductsubtotal), [getServiceSubtotal](dw.order.AbstractItemCtnr.md#getservicesubtotal)
### Methods inherited from class Extensible

[describe](dw.object.Extensible.md#describe), [getCustom](dw.object.Extensible.md#getcustom)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### ORDERBY_CREATION_DATE

- ORDERBY_CREATION_DATE: [Object](TopLevel.Object.md)
  - : Sorting by creation date. Use with method [getPaymentTransactions()](dw.order.Invoice.md#getpaymenttransactions) as an argument to
      method [FilteringCollection.sort(Object)](dw.util.FilteringCollection.md#sortobject).



---

### ORDERBY_ITEMID

- ORDERBY_ITEMID: [Object](TopLevel.Object.md)
  - : Sorting by item id. Use with method [getItems()](dw.order.Invoice.md#getitems) as an argument to
      method [FilteringCollection.sort(Object)](dw.util.FilteringCollection.md#sortobject).



---

### ORDERBY_ITEMPOSITION

- ORDERBY_ITEMPOSITION: [Object](TopLevel.Object.md)
  - : Sorting by the position of the related oder item. Use with method
      [getItems()](dw.order.Invoice.md#getitems) as an argument to method
      [FilteringCollection.sort(Object)](dw.util.FilteringCollection.md#sortobject).



---

### ORDERBY_REVERSE

- ORDERBY_REVERSE: [Object](TopLevel.Object.md)
  - : Reverse orders. Use as an argument
      to method [FilteringCollection.sort(Object)](dw.util.FilteringCollection.md#sortobject).



---

### ORDERBY_UNSORTED

- ORDERBY_UNSORTED: [Object](TopLevel.Object.md)
  - : Unsorted , as it is. Use with method [getItems()](dw.order.Invoice.md#getitems) as an argument
      to method [FilteringCollection.sort(Object)](dw.util.FilteringCollection.md#sortobject).



---

### QUALIFIER_CAPTURE

- QUALIFIER_CAPTURE: [Object](TopLevel.Object.md)
  - : Selects the capture transactions. Use with method [getPaymentTransactions()](dw.order.Invoice.md#getpaymenttransactions) as an
      argument to method [FilteringCollection.select(Object)](dw.util.FilteringCollection.md#selectobject).



---

### QUALIFIER_PRODUCTITEMS

- QUALIFIER_PRODUCTITEMS: [Object](TopLevel.Object.md)
  - : Selects the product items. Use with method [getItems()](dw.order.Invoice.md#getitems) as an
      argument to method [FilteringCollection.select(Object)](dw.util.FilteringCollection.md#selectobject).



---

### QUALIFIER_REFUND

- QUALIFIER_REFUND: [Object](TopLevel.Object.md)
  - : Selects the refund transactions. Use with method [getPaymentTransactions()](dw.order.Invoice.md#getpaymenttransactions) as an
      argument to method [FilteringCollection.select(Object)](dw.util.FilteringCollection.md#selectobject).



---

### QUALIFIER_SERVICEITEMS

- QUALIFIER_SERVICEITEMS: [Object](TopLevel.Object.md)
  - : Selects for the service items. Use with method [getItems()](dw.order.Invoice.md#getitems) as an
      argument to method [FilteringCollection.select(Object)](dw.util.FilteringCollection.md#selectobject).



---

### STATUS_FAILED

- STATUS_FAILED: [String](TopLevel.String.md) = "FAILED"
  - : Constant for Invoice Status Failed.
      
      The invoice handling failed.



---

### STATUS_MANUAL

- STATUS_MANUAL: [String](TopLevel.String.md) = "MANUAL"
  - : Constant for Invoice Status Manual.
      
      The invoice is not paid but will **not** be handled automatically.
      
      A manual invoice handling (capture or refund) is necessary.



---

### STATUS_NOT_PAID

- STATUS_NOT_PAID: [String](TopLevel.String.md) = "NOT_PAID"
  - : Constant for Invoice Status Not Paid.
      
      The invoice is not paid and will be handled automatically.



---

### STATUS_PAID

- STATUS_PAID: [String](TopLevel.String.md) = "PAID"
  - : Constant for Invoice Status Paid.
      
      The invoice was successfully paid.



---

### TYPE_APPEASEMENT

- TYPE_APPEASEMENT: [String](TopLevel.String.md) = "APPEASEMENT"
  - : Constant for Invoice Type Appeasement.
      
      The invoice was created for an appeasement.
      
      The invoice amount needs to be refunded.



---

### TYPE_RETURN

- TYPE_RETURN: [String](TopLevel.String.md) = "RETURN"
  - : Constant for Invoice Type Return.
      
      The invoice was created for a return.
      
      The invoice amount needs to be refunded.



---

### TYPE_RETURN_CASE

- TYPE_RETURN_CASE: [String](TopLevel.String.md) = "RETURN_CASE"
  - : Constant for Invoice Type Return Case.
      
      The invoice was created for a return case.
      
      The invoice amount needs to be refunded.



---

### TYPE_SHIPPING

- TYPE_SHIPPING: [String](TopLevel.String.md) = "SHIPPING"
  - : Constant for Invoice Type Shipping.
      
      The invoice was created for a shipping order.
      
      The invoice amount needs to be captured.



---

## Property Details

### capturedAmount
- capturedAmount: [Money](dw.value.Money.md) `(read-only)`
  - : Returns the sum of the captured amounts. The captured amounts are
      calculated on the fly.
      
      Associate a payment capture for a [OrderPaymentInstrument](dw.order.OrderPaymentInstrument.md)
      with an Invoice using
      [addCaptureTransaction(OrderPaymentInstrument, Money)](dw.order.Invoice.md#addcapturetransactionorderpaymentinstrument-money).



---

### invoiceNumber
- invoiceNumber: [String](TopLevel.String.md) `(read-only)`
  - : Returns the invoice number.


---

### items
- items: [FilteringCollection](dw.util.FilteringCollection.md) `(read-only)`
  - : Access the collection of [InvoiceItem](dw.order.InvoiceItem.md)s.
      
      
      This [FilteringCollection](dw.util.FilteringCollection.md) can be sorted / filtered using:
      
      - [FilteringCollection.sort(Object)](dw.util.FilteringCollection.md#sortobject)with  [ORDERBY_ITEMID](dw.order.Invoice.md#orderby_itemid)  - [FilteringCollection.sort(Object)](dw.util.FilteringCollection.md#sortobject)with    [ORDERBY_ITEMPOSITION](dw.order.Invoice.md#orderby_itemposition)    - [FilteringCollection.sort(Object)](dw.util.FilteringCollection.md#sortobject)with      [ORDERBY_UNSORTED](dw.order.Invoice.md#orderby_unsorted)      - [FilteringCollection.select(Object)](dw.util.FilteringCollection.md#selectobject)with        [QUALIFIER_PRODUCTITEMS](dw.order.Invoice.md#qualifier_productitems)        - [FilteringCollection.select(Object)](dw.util.FilteringCollection.md#selectobject)with          [QUALIFIER_SERVICEITEMS](dw.order.Invoice.md#qualifier_serviceitems)



---

### paymentTransactions
- paymentTransactions: [FilteringCollection](dw.util.FilteringCollection.md) `(read-only)`
  - : Returns the payment transactions belonging to this Invoice.
      
      
      This [FilteringCollection](dw.util.FilteringCollection.md) can be sorted / filtered using:
      
      - [FilteringCollection.sort(Object)](dw.util.FilteringCollection.md#sortobject)with  [ORDERBY_CREATION_DATE](dw.order.Invoice.md#orderby_creation_date)  - [FilteringCollection.sort(Object)](dw.util.FilteringCollection.md#sortobject)with    [ORDERBY_UNSORTED](dw.order.Invoice.md#orderby_unsorted)    - [FilteringCollection.select(Object)](dw.util.FilteringCollection.md#selectobject)with      [QUALIFIER_CAPTURE](dw.order.Invoice.md#qualifier_capture)      - [FilteringCollection.select(Object)](dw.util.FilteringCollection.md#selectobject)with        [QUALIFIER_REFUND](dw.order.Invoice.md#qualifier_refund)


    **See Also:**
    - [PaymentTransaction](dw.order.PaymentTransaction.md)


---

### refundedAmount
- refundedAmount: [Money](dw.value.Money.md) `(read-only)`
  - : Returns the sum of the refunded amounts. The refunded amounts are
      calculated on the fly.
      
      Associate a payment capture for a [OrderPaymentInstrument](dw.order.OrderPaymentInstrument.md)
      with an Invoice using
      [addRefundTransaction(OrderPaymentInstrument, Money)](dw.order.Invoice.md#addrefundtransactionorderpaymentinstrument-money).



---

### status
- status: [EnumValue](dw.value.EnumValue.md)
  - : Returns the invoice status.
      
      The possible values are [STATUS_NOT_PAID](dw.order.Invoice.md#status_not_paid), [STATUS_MANUAL](dw.order.Invoice.md#status_manual),
      [STATUS_PAID](dw.order.Invoice.md#status_paid), [STATUS_FAILED](dw.order.Invoice.md#status_failed).



---

### type
- type: [EnumValue](dw.value.EnumValue.md) `(read-only)`
  - : Returns the invoice type.
      
      The possible values are [TYPE_SHIPPING](dw.order.Invoice.md#type_shipping), [TYPE_RETURN](dw.order.Invoice.md#type_return),
      [TYPE_RETURN_CASE](dw.order.Invoice.md#type_return_case), [TYPE_APPEASEMENT](dw.order.Invoice.md#type_appeasement).



---

## Method Details

### account()
- account(): [Boolean](TopLevel.Boolean.md)
  - : 
      
      The invoice will be accounted.
      
      
      
      
      It will be captured in case of a shipping invoice and it will be refunded in
      case of an appeasement, return case or return invoice.
      
      
      
      
      
      The accounting will be handled in the payment hooks
      [PaymentHooks.capture(Invoice)](dw.order.hooks.PaymentHooks.md#captureinvoice) or
      [PaymentHooks.refund(Invoice)](dw.order.hooks.PaymentHooks.md#refundinvoice). The implementing script could add
      payment transactions to the invoice. The accompanying business logic will
      set the status to `PAID` or `FAILED`.
      
      
      
      
      The accounting will fail when the invoice state is different to
      [STATUS_NOT_PAID](dw.order.Invoice.md#status_not_paid) or [STATUS_FAILED](dw.order.Invoice.md#status_failed).
      
      
      
      
      The method implements its own transaction handling. The method must not
      be called inside a transaction.


    **Returns:**
    - `true` when the accounting was successful, otherwise
              `false`.



---

### addCaptureTransaction(OrderPaymentInstrument, Money)
- addCaptureTransaction(instrument: [OrderPaymentInstrument](dw.order.OrderPaymentInstrument.md), capturedAmount: [Money](dw.value.Money.md)): [PaymentTransaction](dw.order.PaymentTransaction.md)
  - : Calling this method registers an amount captured for a given
      order payment instrument. The authorization for the
      capture is associated with the payment transaction belonging to the
      instrument. Calling this method allows the Invoice, the
      [OrderPaymentInstrument](dw.order.OrderPaymentInstrument.md) and the [Order](dw.order.Order.md) to
      return their captured amount as a sum calculated on the fly. The method
      may be called multiple times for the same instrument (multiple capture
      for one authorization) or for different instruments (invoice settlement
      using multiple payments).


    **Parameters:**
    - instrument - the order payment instrument
    - capturedAmount - amount to register as captured

    **Returns:**
    - the created capture transaction


---

### addRefundTransaction(OrderPaymentInstrument, Money)
- addRefundTransaction(instrument: [OrderPaymentInstrument](dw.order.OrderPaymentInstrument.md), refundedAmount: [Money](dw.value.Money.md)): [PaymentTransaction](dw.order.PaymentTransaction.md)
  - : Calling this method registers an amount refunded for a given
      order payment instrument. Calling this method allows the
      Invoice, the [OrderPaymentInstrument](dw.order.OrderPaymentInstrument.md) and
      the [Order](dw.order.Order.md) to return their refunded amount as a sum
      calculated on the fly. The method may be called multiple times for the
      same instrument (multiple refunds of one payment) or for different
      instruments (invoice settlement using multiple payments).


    **Parameters:**
    - instrument - the order payment instrument
    - refundedAmount - amount to register as refunded

    **Returns:**
    - the created refund transaction


---

### getCapturedAmount()
- getCapturedAmount(): [Money](dw.value.Money.md)
  - : Returns the sum of the captured amounts. The captured amounts are
      calculated on the fly.
      
      Associate a payment capture for a [OrderPaymentInstrument](dw.order.OrderPaymentInstrument.md)
      with an Invoice using
      [addCaptureTransaction(OrderPaymentInstrument, Money)](dw.order.Invoice.md#addcapturetransactionorderpaymentinstrument-money).


    **Returns:**
    - sum of captured amounts


---

### getInvoiceNumber()
- getInvoiceNumber(): [String](TopLevel.String.md)
  - : Returns the invoice number.

    **Returns:**
    - the invoice number


---

### getItems()
- getItems(): [FilteringCollection](dw.util.FilteringCollection.md)
  - : Access the collection of [InvoiceItem](dw.order.InvoiceItem.md)s.
      
      
      This [FilteringCollection](dw.util.FilteringCollection.md) can be sorted / filtered using:
      
      - [FilteringCollection.sort(Object)](dw.util.FilteringCollection.md#sortobject)with  [ORDERBY_ITEMID](dw.order.Invoice.md#orderby_itemid)  - [FilteringCollection.sort(Object)](dw.util.FilteringCollection.md#sortobject)with    [ORDERBY_ITEMPOSITION](dw.order.Invoice.md#orderby_itemposition)    - [FilteringCollection.sort(Object)](dw.util.FilteringCollection.md#sortobject)with      [ORDERBY_UNSORTED](dw.order.Invoice.md#orderby_unsorted)      - [FilteringCollection.select(Object)](dw.util.FilteringCollection.md#selectobject)with        [QUALIFIER_PRODUCTITEMS](dw.order.Invoice.md#qualifier_productitems)        - [FilteringCollection.select(Object)](dw.util.FilteringCollection.md#selectobject)with          [QUALIFIER_SERVICEITEMS](dw.order.Invoice.md#qualifier_serviceitems)


    **Returns:**
    - the invoice items


---

### getPaymentTransactions()
- getPaymentTransactions(): [FilteringCollection](dw.util.FilteringCollection.md)
  - : Returns the payment transactions belonging to this Invoice.
      
      
      This [FilteringCollection](dw.util.FilteringCollection.md) can be sorted / filtered using:
      
      - [FilteringCollection.sort(Object)](dw.util.FilteringCollection.md#sortobject)with  [ORDERBY_CREATION_DATE](dw.order.Invoice.md#orderby_creation_date)  - [FilteringCollection.sort(Object)](dw.util.FilteringCollection.md#sortobject)with    [ORDERBY_UNSORTED](dw.order.Invoice.md#orderby_unsorted)    - [FilteringCollection.select(Object)](dw.util.FilteringCollection.md#selectobject)with      [QUALIFIER_CAPTURE](dw.order.Invoice.md#qualifier_capture)      - [FilteringCollection.select(Object)](dw.util.FilteringCollection.md#selectobject)with        [QUALIFIER_REFUND](dw.order.Invoice.md#qualifier_refund)


    **Returns:**
    - the payment transactions.

    **See Also:**
    - [PaymentTransaction](dw.order.PaymentTransaction.md)


---

### getRefundedAmount()
- getRefundedAmount(): [Money](dw.value.Money.md)
  - : Returns the sum of the refunded amounts. The refunded amounts are
      calculated on the fly.
      
      Associate a payment capture for a [OrderPaymentInstrument](dw.order.OrderPaymentInstrument.md)
      with an Invoice using
      [addRefundTransaction(OrderPaymentInstrument, Money)](dw.order.Invoice.md#addrefundtransactionorderpaymentinstrument-money).


    **Returns:**
    - sum of refunded amounts


---

### getStatus()
- getStatus(): [EnumValue](dw.value.EnumValue.md)
  - : Returns the invoice status.
      
      The possible values are [STATUS_NOT_PAID](dw.order.Invoice.md#status_not_paid), [STATUS_MANUAL](dw.order.Invoice.md#status_manual),
      [STATUS_PAID](dw.order.Invoice.md#status_paid), [STATUS_FAILED](dw.order.Invoice.md#status_failed).


    **Returns:**
    - the invoice status


---

### getType()
- getType(): [EnumValue](dw.value.EnumValue.md)
  - : Returns the invoice type.
      
      The possible values are [TYPE_SHIPPING](dw.order.Invoice.md#type_shipping), [TYPE_RETURN](dw.order.Invoice.md#type_return),
      [TYPE_RETURN_CASE](dw.order.Invoice.md#type_return_case), [TYPE_APPEASEMENT](dw.order.Invoice.md#type_appeasement).


    **Returns:**
    - the invoice type


---

### setStatus(String)
- setStatus(status: [String](TopLevel.String.md)): void
  - : Sets the invoice status.
      
      The possible values are [STATUS_NOT_PAID](dw.order.Invoice.md#status_not_paid), [STATUS_MANUAL](dw.order.Invoice.md#status_manual),
      [STATUS_PAID](dw.order.Invoice.md#status_paid), [STATUS_FAILED](dw.order.Invoice.md#status_failed).


    **Parameters:**
    - status - the invoice status to set


---

<!-- prettier-ignore-end -->
