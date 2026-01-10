<!-- prettier-ignore-start -->
# Class Order

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.object.PersistentObject](dw.object.PersistentObject.md)
    - [dw.object.ExtensibleObject](dw.object.ExtensibleObject.md)
      - [dw.order.LineItemCtnr](dw.order.LineItemCtnr.md)
        - [dw.order.Order](dw.order.Order.md)

The Order class represents an order. The correct way to retrieve an order is described in [OrderMgr](dw.order.OrderMgr.md).


## Constant Summary

| Constant | Description |
| --- | --- |
| [CONFIRMATION_STATUS_CONFIRMED](#confirmation_status_confirmed): [Number](TopLevel.Number.md) = 2 | constant for when Confirmation Status is Confirmed |
| [CONFIRMATION_STATUS_NOTCONFIRMED](#confirmation_status_notconfirmed): [Number](TopLevel.Number.md) = 0 | constant for when Confirmation Status is Not Confirmed |
| [ENCRYPTION_ALGORITHM_RSA_ECB_OAEPWITHSHA_256ANDMGF1PADDING](#encryption_algorithm_rsa_ecb_oaepwithsha_256andmgf1padding): [String](TopLevel.String.md) = "RSA/ECB/OAEPWithSHA-256AndMGF1Padding" | The encryption algorithm "RSA/ECB/OAEPWithSHA-256AndMGF1Padding". |
| ~~[ENCRYPTION_ALGORITHM_RSA_ECB_PKCS1PADDING](#encryption_algorithm_rsa_ecb_pkcs1padding): [String](TopLevel.String.md) = "RSA/ECB/PKCS1Padding"~~ | The outdated encryption algorithm "RSA/ECB/PKCS1Padding". |
| [EXPORT_STATUS_EXPORTED](#export_status_exported): [Number](TopLevel.Number.md) = 1 | constant for when Export Status is Exported |
| [EXPORT_STATUS_FAILED](#export_status_failed): [Number](TopLevel.Number.md) = 3 | constant for when Export Status is Failed |
| [EXPORT_STATUS_NOTEXPORTED](#export_status_notexported): [Number](TopLevel.Number.md) = 0 | constant for when Export Status is Not Exported |
| [EXPORT_STATUS_READY](#export_status_ready): [Number](TopLevel.Number.md) = 2 | constant for when Export Status is ready to be exported. |
| [ORDER_STATUS_CANCELLED](#order_status_cancelled): [Number](TopLevel.Number.md) = 6 | constant for when Order Status is Cancelled |
| [ORDER_STATUS_COMPLETED](#order_status_completed): [Number](TopLevel.Number.md) = 5 | constant for when Order Status is Completed |
| [ORDER_STATUS_CREATED](#order_status_created): [Number](TopLevel.Number.md) = 0 | constant for when Order Status is Created |
| [ORDER_STATUS_FAILED](#order_status_failed): [Number](TopLevel.Number.md) = 8 | constant for when Order Status is Failed |
| [ORDER_STATUS_NEW](#order_status_new): [Number](TopLevel.Number.md) = 3 | constant for when Order Status is New |
| [ORDER_STATUS_OPEN](#order_status_open): [Number](TopLevel.Number.md) = 4 | constant for when Order Status is Open |
| [ORDER_STATUS_REPLACED](#order_status_replaced): [Number](TopLevel.Number.md) = 7 | constant for when Order Status is Replaced |
| [PAYMENT_STATUS_NOTPAID](#payment_status_notpaid): [Number](TopLevel.Number.md) = 0 | constant for when Payment Status is Not Paid |
| [PAYMENT_STATUS_PAID](#payment_status_paid): [Number](TopLevel.Number.md) = 2 | constant for when Payment Status is Paid |
| [PAYMENT_STATUS_PARTPAID](#payment_status_partpaid): [Number](TopLevel.Number.md) = 1 | constant for when Payment Status is Part Paid |
| [SHIPPING_STATUS_NOTSHIPPED](#shipping_status_notshipped): [Number](TopLevel.Number.md) = 0 | constant for when Shipping Status is Not shipped |
| [SHIPPING_STATUS_PARTSHIPPED](#shipping_status_partshipped): [Number](TopLevel.Number.md) = 1 | constant for when Shipping Status is Part Shipped |
| [SHIPPING_STATUS_SHIPPED](#shipping_status_shipped): [Number](TopLevel.Number.md) = 2 | constant for when Shipping Status is Shipped |

## Property Summary

| Property | Description |
| --- | --- |
| [affiliatePartnerID](#affiliatepartnerid): [String](TopLevel.String.md) | Returns the affiliate partner ID value, or null. |
| [affiliatePartnerName](#affiliatepartnername): [String](TopLevel.String.md) | Returns the affiliate partner name value, or null. |
| [appeasementItems](#appeasementitems): [FilteringCollection](dw.util.FilteringCollection.md) `(read-only)` | Returns the collection of [AppeasementItem](dw.order.AppeasementItem.md)s associated with this order. |
| [appeasements](#appeasements): [FilteringCollection](dw.util.FilteringCollection.md) `(read-only)` | Returns the collection of [Appeasement](dw.order.Appeasement.md)s associated with this order. |
| [cancelCode](#cancelcode): [EnumValue](dw.value.EnumValue.md) | If this order was cancelled, returns the value of the  cancel code or null. |
| [cancelDescription](#canceldescription): [String](TopLevel.String.md) | If this order was cancelled, returns the text describing why  the order was cancelled or null. |
| [capturedAmount](#capturedamount): [Money](dw.value.Money.md) `(read-only)` | Returns the sum of the captured amounts. |
| [confirmationStatus](#confirmationstatus): [EnumValue](dw.value.EnumValue.md) | Returns the confirmation status of the order.<br/>  Possible values are [CONFIRMATION_STATUS_NOTCONFIRMED](dw.order.Order.md#confirmation_status_notconfirmed) and  [CONFIRMATION_STATUS_CONFIRMED](dw.order.Order.md#confirmation_status_confirmed). |
| [createdBy](#createdby): [String](TopLevel.String.md) `(read-only)` | Returns the name of the user who has created the order. |
| [currentOrder](#currentorder): [Order](dw.order.Order.md) `(read-only)` | Returns the current order. |
| [currentOrderNo](#currentorderno): [String](TopLevel.String.md) `(read-only)` | Returns the order number of the current order. |
| [customerLocaleID](#customerlocaleid): [String](TopLevel.String.md) `(read-only)` | Returns the ID of the locale that was in effect when the order  was placed. |
| [customerOrderReference](#customerorderreference): [String](TopLevel.String.md) | Returns the customer-specific reference information for the order, or null. |
| [exportAfter](#exportafter): [Date](TopLevel.Date.md) | Returns a date after which an order can be exported. |
| [exportStatus](#exportstatus): [EnumValue](dw.value.EnumValue.md) | Returns the export status of the order.<br/>  Possible values are: [EXPORT_STATUS_NOTEXPORTED](dw.order.Order.md#export_status_notexported),  [EXPORT_STATUS_EXPORTED](dw.order.Order.md#export_status_exported), [EXPORT_STATUS_READY](dw.order.Order.md#export_status_ready),  and [EXPORT_STATUS_FAILED](dw.order.Order.md#export_status_failed). |
| [externalOrderNo](#externalorderno): [String](TopLevel.String.md) | Returns the value of an external order number associated  with this order, or null. |
| [externalOrderStatus](#externalorderstatus): [String](TopLevel.String.md) | Returns the status of an external order associated  with this order, or null. |
| [externalOrderText](#externalordertext): [String](TopLevel.String.md) | Returns the text describing the external order, or null. |
| [globalPartyID](#globalpartyid): [String](TopLevel.String.md) `(read-only)` | The Global Party ID reconciles customer identity across multiple systems. |
| [imported](#imported): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns `true`, if the order is imported and `false`  otherwise. |
| [invoiceItems](#invoiceitems): [FilteringCollection](dw.util.FilteringCollection.md) `(read-only)` | Returns the collection of [InvoiceItem](dw.order.InvoiceItem.md)s associated with this order. |
| [invoiceNo](#invoiceno): [String](TopLevel.String.md) | Returns the invoice number for this Order. |
| [invoices](#invoices): [FilteringCollection](dw.util.FilteringCollection.md) `(read-only)` | Returns the collection of [Invoice](dw.order.Invoice.md)s associated with this order. |
| [orderExportXML](#orderexportxml): [String](TopLevel.String.md) `(read-only)` | Returns the order export XML as String object. |
| [orderNo](#orderno): [String](TopLevel.String.md) `(read-only)` | Returns the order number for this order. |
| [orderToken](#ordertoken): [String](TopLevel.String.md) `(read-only)` | Returns the token for this order. |
| [originalOrder](#originalorder): [Order](dw.order.Order.md) `(read-only)` | Returns the original order associated with  this order. |
| [originalOrderNo](#originalorderno): [String](TopLevel.String.md) `(read-only)` | Returns the order number of the original order associated with  this order. |
| [paymentStatus](#paymentstatus): [EnumValue](dw.value.EnumValue.md) | Returns the order payment status value.<br/>  Possible values are [PAYMENT_STATUS_NOTPAID](dw.order.Order.md#payment_status_notpaid), [PAYMENT_STATUS_PARTPAID](dw.order.Order.md#payment_status_partpaid)  or [PAYMENT_STATUS_PAID](dw.order.Order.md#payment_status_paid). |
| ~~[paymentTransaction](#paymenttransaction): [PaymentTransaction](dw.order.PaymentTransaction.md)~~ `(read-only)` | Returns the payment transaction associated with this order. |
| [refundedAmount](#refundedamount): [Money](dw.value.Money.md) `(read-only)` | Returns the sum of the refunded amounts. |
| [remoteHost](#remotehost): [String](TopLevel.String.md) `(read-only)` | Returns the IP address of the remote host from which the order was created. |
| [replaceCode](#replacecode): [EnumValue](dw.value.EnumValue.md) | If this order was replaced by another order,  returns the value of the replace code. |
| [replaceDescription](#replacedescription): [String](TopLevel.String.md) | If this order was replaced by another order,  returns the value of the replace description. |
| [replacedOrder](#replacedorder): [Order](dw.order.Order.md) `(read-only)` | Returns the order that this order replaced or null. |
| [replacedOrderNo](#replacedorderno): [String](TopLevel.String.md) `(read-only)` | Returns the order number that this order replaced or null if this order  did not replace an order. |
| [replacementOrder](#replacementorder): [Order](dw.order.Order.md) `(read-only)` | Returns the order that replaced this order, or null. |
| [replacementOrderNo](#replacementorderno): [String](TopLevel.String.md) `(read-only)` | If this order was replaced by another order,  returns the order number that replaced this order. |
| [returnCaseItems](#returncaseitems): [FilteringCollection](dw.util.FilteringCollection.md) `(read-only)` | Returns the collection of [ReturnCaseItem](dw.order.ReturnCaseItem.md)s associated with this order. |
| [returnCases](#returncases): [FilteringCollection](dw.util.FilteringCollection.md) `(read-only)` | Returns the collection of [ReturnCase](dw.order.ReturnCase.md)s associated with this order. |
| [returnItems](#returnitems): [FilteringCollection](dw.util.FilteringCollection.md) `(read-only)` | Returns the collection of [ReturnItem](dw.order.ReturnItem.md)s associated with this order. |
| [returns](#returns): [FilteringCollection](dw.util.FilteringCollection.md) `(read-only)` | Returns the collection of [Return](dw.order.Return.md)s associated with this order. |
| [shippingOrderItems](#shippingorderitems): [FilteringCollection](dw.util.FilteringCollection.md) `(read-only)` | Returns the collection of [ShippingOrderItem](dw.order.ShippingOrderItem.md)s associated with this order. |
| [shippingOrders](#shippingorders): [FilteringCollection](dw.util.FilteringCollection.md) `(read-only)` | Returns the collection of [ShippingOrder](dw.order.ShippingOrder.md)s associated with this order. |
| [shippingStatus](#shippingstatus): [EnumValue](dw.value.EnumValue.md) | Returns the order shipping status.<br/>  Possible values are [SHIPPING_STATUS_NOTSHIPPED](dw.order.Order.md#shipping_status_notshipped),  [SHIPPING_STATUS_PARTSHIPPED](dw.order.Order.md#shipping_status_partshipped) or [SHIPPING_STATUS_SHIPPED](dw.order.Order.md#shipping_status_shipped). |
| [sourceCode](#sourcecode): [String](TopLevel.String.md) `(read-only)` | Returns the source code stored with the order or `null` if no source code is attached to the order. |
| [sourceCodeGroup](#sourcecodegroup): [SourceCodeGroup](dw.campaign.SourceCodeGroup.md) `(read-only)` | Returns the source code group attached to the order or `null` if no source code group is attached to  the order. |
| [sourceCodeGroupID](#sourcecodegroupid): [String](TopLevel.String.md) `(read-only)` | Returns the source code group id stored with the order or `null` if no source code group is attached  to the order. |
| [status](#status): [EnumValue](dw.value.EnumValue.md) | Returns the status of the order.<br/>  Possible values are:  <ul>  <li>[ORDER_STATUS_CREATED](dw.order.Order.md#order_status_created)</li>  <li>[ORDER_STATUS_NEW](dw.order.Order.md#order_status_new)</li>  <li>[ORDER_STATUS_OPEN](dw.order.Order.md#order_status_open)</li>  <li>[ORDER_STATUS_COMPLETED](dw.order.Order.md#order_status_completed)</li>  <li>[ORDER_STATUS_CANCELLED](dw.order.Order.md#order_status_cancelled)</li>  <li>[ORDER_STATUS_FAILED](dw.order.Order.md#order_status_failed)</li>  <li>[ORDER_STATUS_REPLACED](dw.order.Order.md#order_status_replaced)</li>  </ul> |
| [taxRoundedAtGroup](#taxroundedatgroup): [Boolean](TopLevel.Boolean.md) `(read-only)` | Use this method to check if the Order was created with grouped taxation calculation. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [createAppeasement](dw.order.Order.md#createappeasement)() | Creates a new [Appeasement](dw.order.Appeasement.md) associated with this order. |
| [createAppeasement](dw.order.Order.md#createappeasementstring)([String](TopLevel.String.md)) | Creates a new [Appeasement](dw.order.Appeasement.md) associated with this order. |
| [createReturnCase](dw.order.Order.md#createreturncaseboolean)([Boolean](TopLevel.Boolean.md)) | Creates a new [ReturnCase](dw.order.ReturnCase.md) associated with this order  specifying whether the ReturnCase is an RMA (return merchandise authorization). |
| [createReturnCase](dw.order.Order.md#createreturncasestring-boolean)([String](TopLevel.String.md), [Boolean](TopLevel.Boolean.md)) | Creates a new [ReturnCase](dw.order.ReturnCase.md) associated with this order  specifying whether the ReturnCase is an RMA (return merchandise authorization). |
| [createServiceItem](dw.order.Order.md#createserviceitemstring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Returns the [order item](dw.order.OrderItem.md) with the given status which wraps a new  [service item](dw.order.ShippingLineItem.md) which is created and added to the order. |
| [createShippingOrder](dw.order.Order.md#createshippingorder)() | Creates a new [ShippingOrder](dw.order.ShippingOrder.md) for this order. |
| [createShippingOrder](dw.order.Order.md#createshippingorderstring)([String](TopLevel.String.md)) | Creates a new [ShippingOrder](dw.order.ShippingOrder.md) for this order. |
| [getAffiliatePartnerID](dw.order.Order.md#getaffiliatepartnerid)() | Returns the affiliate partner ID value, or null. |
| [getAffiliatePartnerName](dw.order.Order.md#getaffiliatepartnername)() | Returns the affiliate partner name value, or null. |
| [getAppeasement](dw.order.Order.md#getappeasementstring)([String](TopLevel.String.md)) | Returns the [Appeasement](dw.order.Appeasement.md) associated with this order with the given appeasementNumber. |
| [getAppeasementItem](dw.order.Order.md#getappeasementitemstring)([String](TopLevel.String.md)) | Returns the [AppeasementItem](dw.order.AppeasementItem.md) associated with this Order with the given appeasementItemID. |
| [getAppeasementItems](dw.order.Order.md#getappeasementitems)() | Returns the collection of [AppeasementItem](dw.order.AppeasementItem.md)s associated with this order. |
| [getAppeasements](dw.order.Order.md#getappeasements)() | Returns the collection of [Appeasement](dw.order.Appeasement.md)s associated with this order. |
| [getCancelCode](dw.order.Order.md#getcancelcode)() | If this order was cancelled, returns the value of the  cancel code or null. |
| [getCancelDescription](dw.order.Order.md#getcanceldescription)() | If this order was cancelled, returns the text describing why  the order was cancelled or null. |
| [getCapturedAmount](dw.order.Order.md#getcapturedamount)() | Returns the sum of the captured amounts. |
| [getConfirmationStatus](dw.order.Order.md#getconfirmationstatus)() | Returns the confirmation status of the order.<br/>  Possible values are [CONFIRMATION_STATUS_NOTCONFIRMED](dw.order.Order.md#confirmation_status_notconfirmed) and  [CONFIRMATION_STATUS_CONFIRMED](dw.order.Order.md#confirmation_status_confirmed). |
| [getCreatedBy](dw.order.Order.md#getcreatedby)() | Returns the name of the user who has created the order. |
| [getCurrentOrder](dw.order.Order.md#getcurrentorder)() | Returns the current order. |
| [getCurrentOrderNo](dw.order.Order.md#getcurrentorderno)() | Returns the order number of the current order. |
| [getCustomerLocaleID](dw.order.Order.md#getcustomerlocaleid)() | Returns the ID of the locale that was in effect when the order  was placed. |
| [getCustomerOrderReference](dw.order.Order.md#getcustomerorderreference)() | Returns the customer-specific reference information for the order, or null. |
| [getExportAfter](dw.order.Order.md#getexportafter)() | Returns a date after which an order can be exported. |
| [getExportStatus](dw.order.Order.md#getexportstatus)() | Returns the export status of the order.<br/>  Possible values are: [EXPORT_STATUS_NOTEXPORTED](dw.order.Order.md#export_status_notexported),  [EXPORT_STATUS_EXPORTED](dw.order.Order.md#export_status_exported), [EXPORT_STATUS_READY](dw.order.Order.md#export_status_ready),  and [EXPORT_STATUS_FAILED](dw.order.Order.md#export_status_failed). |
| [getExternalOrderNo](dw.order.Order.md#getexternalorderno)() | Returns the value of an external order number associated  with this order, or null. |
| [getExternalOrderStatus](dw.order.Order.md#getexternalorderstatus)() | Returns the status of an external order associated  with this order, or null. |
| [getExternalOrderText](dw.order.Order.md#getexternalordertext)() | Returns the text describing the external order, or null. |
| [getGlobalPartyID](dw.order.Order.md#getglobalpartyid)() | The Global Party ID reconciles customer identity across multiple systems. |
| [getInvoice](dw.order.Order.md#getinvoicestring)([String](TopLevel.String.md)) | Returns the [Invoice](dw.order.Invoice.md) associated with this order with the given invoiceNumber. |
| [getInvoiceItem](dw.order.Order.md#getinvoiceitemstring)([String](TopLevel.String.md)) | Returns the [InvoiceItem](dw.order.InvoiceItem.md) associated with this order with the given ID. |
| [getInvoiceItems](dw.order.Order.md#getinvoiceitems)() | Returns the collection of [InvoiceItem](dw.order.InvoiceItem.md)s associated with this order. |
| [getInvoiceNo](dw.order.Order.md#getinvoiceno)() | Returns the invoice number for this Order. |
| [getInvoices](dw.order.Order.md#getinvoices)() | Returns the collection of [Invoice](dw.order.Invoice.md)s associated with this order. |
| [getOrderExportXML](dw.order.Order.md#getorderexportxml)() | Returns the order export XML as String object. |
| [getOrderExportXML](dw.order.Order.md#getorderexportxmlstring-string---variant-1)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Returns the order export XML as String object, with payment instrument data re-encrypted using the given  encryption algorithm and key. |
| ~~[getOrderExportXML](dw.order.Order.md#getorderexportxmlstring-string-boolean---variant-1)([String](TopLevel.String.md), [String](TopLevel.String.md), [Boolean](TopLevel.Boolean.md))~~ | Returns the order export XML as String object, with payment instrument data re-encrypted using the given  encryption algorithm and key. |
| [getOrderExportXML](dw.order.Order.md#getorderexportxmlstring-string---variant-2)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Returns the order export XML as String object, with payment instrument data re-encrypted using the given  encryption algorithm and key. |
| [getOrderItem](dw.order.Order.md#getorderitemstring)([String](TopLevel.String.md)) | Returns the [OrderItem](dw.order.OrderItem.md) for the itemID. |
| [getOrderNo](dw.order.Order.md#getorderno)() | Returns the order number for this order. |
| [getOrderToken](dw.order.Order.md#getordertoken)() | Returns the token for this order. |
| [getOriginalOrder](dw.order.Order.md#getoriginalorder)() | Returns the original order associated with  this order. |
| [getOriginalOrderNo](dw.order.Order.md#getoriginalorderno)() | Returns the order number of the original order associated with  this order. |
| [getPaymentStatus](dw.order.Order.md#getpaymentstatus)() | Returns the order payment status value.<br/>  Possible values are [PAYMENT_STATUS_NOTPAID](dw.order.Order.md#payment_status_notpaid), [PAYMENT_STATUS_PARTPAID](dw.order.Order.md#payment_status_partpaid)  or [PAYMENT_STATUS_PAID](dw.order.Order.md#payment_status_paid). |
| ~~[getPaymentTransaction](dw.order.Order.md#getpaymenttransaction)()~~ | Returns the payment transaction associated with this order. |
| [getRefundedAmount](dw.order.Order.md#getrefundedamount)() | Returns the sum of the refunded amounts. |
| [getRemoteHost](dw.order.Order.md#getremotehost)() | Returns the IP address of the remote host from which the order was created. |
| [getReplaceCode](dw.order.Order.md#getreplacecode)() | If this order was replaced by another order,  returns the value of the replace code. |
| [getReplaceDescription](dw.order.Order.md#getreplacedescription)() | If this order was replaced by another order,  returns the value of the replace description. |
| [getReplacedOrder](dw.order.Order.md#getreplacedorder)() | Returns the order that this order replaced or null. |
| [getReplacedOrderNo](dw.order.Order.md#getreplacedorderno)() | Returns the order number that this order replaced or null if this order  did not replace an order. |
| [getReplacementOrder](dw.order.Order.md#getreplacementorder)() | Returns the order that replaced this order, or null. |
| [getReplacementOrderNo](dw.order.Order.md#getreplacementorderno)() | If this order was replaced by another order,  returns the order number that replaced this order. |
| [getReturn](dw.order.Order.md#getreturnstring)([String](TopLevel.String.md)) | Returns the [Return](dw.order.Return.md) associated with this order with the given returnNumber. |
| [getReturnCase](dw.order.Order.md#getreturncasestring)([String](TopLevel.String.md)) | Returns the [ReturnCase](dw.order.ReturnCase.md) associated with this order with the given returnCaseNumber. |
| [getReturnCaseItem](dw.order.Order.md#getreturncaseitemstring)([String](TopLevel.String.md)) | Returns the [ReturnCaseItem](dw.order.ReturnCaseItem.md) associated with this order with the given returnCaseItemID. |
| [getReturnCaseItems](dw.order.Order.md#getreturncaseitems)() | Returns the collection of [ReturnCaseItem](dw.order.ReturnCaseItem.md)s associated with this order. |
| [getReturnCases](dw.order.Order.md#getreturncases)() | Returns the collection of [ReturnCase](dw.order.ReturnCase.md)s associated with this order. |
| [getReturnItem](dw.order.Order.md#getreturnitemstring)([String](TopLevel.String.md)) | Returns the [ReturnItem](dw.order.ReturnItem.md) associated with this order with the given ID. |
| [getReturnItems](dw.order.Order.md#getreturnitems)() | Returns the collection of [ReturnItem](dw.order.ReturnItem.md)s associated with this order. |
| [getReturns](dw.order.Order.md#getreturns)() | Returns the collection of [Return](dw.order.Return.md)s associated with this order. |
| [getShippingOrder](dw.order.Order.md#getshippingorderstring)([String](TopLevel.String.md)) | Returns the [ShippingOrder](dw.order.ShippingOrder.md) associated with this order with the given shippingOrderNumber. |
| [getShippingOrderItem](dw.order.Order.md#getshippingorderitemstring)([String](TopLevel.String.md)) | Returns the [ShippingOrderItem](dw.order.ShippingOrderItem.md) associated with this order with the given shippingOrderItemID. |
| [getShippingOrderItems](dw.order.Order.md#getshippingorderitems)() | Returns the collection of [ShippingOrderItem](dw.order.ShippingOrderItem.md)s associated with this order. |
| [getShippingOrders](dw.order.Order.md#getshippingorders)() | Returns the collection of [ShippingOrder](dw.order.ShippingOrder.md)s associated with this order. |
| [getShippingStatus](dw.order.Order.md#getshippingstatus)() | Returns the order shipping status.<br/>  Possible values are [SHIPPING_STATUS_NOTSHIPPED](dw.order.Order.md#shipping_status_notshipped),  [SHIPPING_STATUS_PARTSHIPPED](dw.order.Order.md#shipping_status_partshipped) or [SHIPPING_STATUS_SHIPPED](dw.order.Order.md#shipping_status_shipped). |
| [getSourceCode](dw.order.Order.md#getsourcecode)() | Returns the source code stored with the order or `null` if no source code is attached to the order. |
| [getSourceCodeGroup](dw.order.Order.md#getsourcecodegroup)() | Returns the source code group attached to the order or `null` if no source code group is attached to  the order. |
| [getSourceCodeGroupID](dw.order.Order.md#getsourcecodegroupid)() | Returns the source code group id stored with the order or `null` if no source code group is attached  to the order. |
| [getStatus](dw.order.Order.md#getstatus)() | Returns the status of the order.<br/>  Possible values are:  <ul>  <li>[ORDER_STATUS_CREATED](dw.order.Order.md#order_status_created)</li>  <li>[ORDER_STATUS_NEW](dw.order.Order.md#order_status_new)</li>  <li>[ORDER_STATUS_OPEN](dw.order.Order.md#order_status_open)</li>  <li>[ORDER_STATUS_COMPLETED](dw.order.Order.md#order_status_completed)</li>  <li>[ORDER_STATUS_CANCELLED](dw.order.Order.md#order_status_cancelled)</li>  <li>[ORDER_STATUS_FAILED](dw.order.Order.md#order_status_failed)</li>  <li>[ORDER_STATUS_REPLACED](dw.order.Order.md#order_status_replaced)</li>  </ul> |
| [isImported](dw.order.Order.md#isimported)() | Returns `true`, if the order is imported and `false`  otherwise. |
| [isTaxRoundedAtGroup](dw.order.Order.md#istaxroundedatgroup)() | Use this method to check if the Order was created with grouped taxation calculation. |
| [reauthorize](dw.order.Order.md#reauthorize)() | Ensures that the order is authorized. |
| [removeRemoteHost](dw.order.Order.md#removeremotehost)() | Removes the IP address of the remote host if stored. |
| [setAffiliatePartnerID](dw.order.Order.md#setaffiliatepartneridstring)([String](TopLevel.String.md)) | Sets the affiliate partner ID value. |
| [setAffiliatePartnerName](dw.order.Order.md#setaffiliatepartnernamestring)([String](TopLevel.String.md)) | Sets the affiliate partner name value. |
| [setCancelCode](dw.order.Order.md#setcancelcodestring)([String](TopLevel.String.md)) | Sets the cancel code value. |
| [setCancelDescription](dw.order.Order.md#setcanceldescriptionstring)([String](TopLevel.String.md)) | Sets the description as to why the order was cancelled. |
| [setConfirmationStatus](dw.order.Order.md#setconfirmationstatusnumber)([Number](TopLevel.Number.md)) | Sets the confirmation status value.<br/>  Possible values are [CONFIRMATION_STATUS_NOTCONFIRMED](dw.order.Order.md#confirmation_status_notconfirmed) or  [CONFIRMATION_STATUS_CONFIRMED](dw.order.Order.md#confirmation_status_confirmed). |
| [setCustomer](dw.order.Order.md#setcustomercustomer)([Customer](dw.customer.Customer.md)) | This method is used to associate the order object with the specified customer object. |
| [setCustomerNo](dw.order.Order.md#setcustomernostring)([String](TopLevel.String.md)) | Sets the customer number associated with this order. |
| [setCustomerOrderReference](dw.order.Order.md#setcustomerorderreferencestring)([String](TopLevel.String.md)) | Sets the customer-specific reference information for the order. |
| [setExportAfter](dw.order.Order.md#setexportafterdate)([Date](TopLevel.Date.md)) | Sets the date after which an order can be exported. |
| [setExportStatus](dw.order.Order.md#setexportstatusnumber)([Number](TopLevel.Number.md)) | Sets the export status of the order.<br/>  Possible values are: [EXPORT_STATUS_NOTEXPORTED](dw.order.Order.md#export_status_notexported), [EXPORT_STATUS_EXPORTED](dw.order.Order.md#export_status_exported),  [EXPORT_STATUS_READY](dw.order.Order.md#export_status_ready), and [EXPORT_STATUS_FAILED](dw.order.Order.md#export_status_failed). |
| [setExternalOrderNo](dw.order.Order.md#setexternalordernostring)([String](TopLevel.String.md)) | Sets the value of an external order number associated  with this order |
| [setExternalOrderStatus](dw.order.Order.md#setexternalorderstatusstring)([String](TopLevel.String.md)) | Sets the status of an external order associated  with this order |
| [setExternalOrderText](dw.order.Order.md#setexternalordertextstring)([String](TopLevel.String.md)) | Sets the text describing the external order. |
| [setInvoiceNo](dw.order.Order.md#setinvoicenostring)([String](TopLevel.String.md)) | Sets the invoice number for this Order. |
| ~~[setOrderStatus](dw.order.Order.md#setorderstatusnumber)([Number](TopLevel.Number.md))~~ | Sets the order status. |
| [setPaymentStatus](dw.order.Order.md#setpaymentstatusnumber)([Number](TopLevel.Number.md)) | Sets the order payment status.<br/>  Possible values are [PAYMENT_STATUS_NOTPAID](dw.order.Order.md#payment_status_notpaid), [PAYMENT_STATUS_PARTPAID](dw.order.Order.md#payment_status_partpaid)  or [PAYMENT_STATUS_PAID](dw.order.Order.md#payment_status_paid). |
| [setReplaceCode](dw.order.Order.md#setreplacecodestring)([String](TopLevel.String.md)) | Sets the value of the replace code. |
| [setReplaceDescription](dw.order.Order.md#setreplacedescriptionstring)([String](TopLevel.String.md)) | Sets the value of the replace description. |
| [setShippingStatus](dw.order.Order.md#setshippingstatusnumber)([Number](TopLevel.Number.md)) | Sets the order shipping status value.<br/>  Possible values are [SHIPPING_STATUS_NOTSHIPPED](dw.order.Order.md#shipping_status_notshipped),  [SHIPPING_STATUS_PARTSHIPPED](dw.order.Order.md#shipping_status_partshipped) or [SHIPPING_STATUS_SHIPPED](dw.order.Order.md#shipping_status_shipped). |
| [setStatus](dw.order.Order.md#setstatusnumber)([Number](TopLevel.Number.md)) | Sets the status of the order. |
| [trackOrderChange](dw.order.Order.md#trackorderchangestring)([String](TopLevel.String.md)) | Tracks an order change. |

### Methods inherited from class LineItemCtnr

[addNote](dw.order.LineItemCtnr.md#addnotestring-string), [createBillingAddress](dw.order.LineItemCtnr.md#createbillingaddress), [createBonusProductLineItem](dw.order.LineItemCtnr.md#createbonusproductlineitembonusdiscountlineitem-product-productoptionmodel-shipment), [createCouponLineItem](dw.order.LineItemCtnr.md#createcouponlineitemstring), [createCouponLineItem](dw.order.LineItemCtnr.md#createcouponlineitemstring-boolean), [createGiftCertificateLineItem](dw.order.LineItemCtnr.md#creategiftcertificatelineitemnumber-string), [createGiftCertificatePaymentInstrument](dw.order.LineItemCtnr.md#creategiftcertificatepaymentinstrumentstring-money), [createPaymentInstrument](dw.order.LineItemCtnr.md#createpaymentinstrumentstring-money), [createPaymentInstrumentFromWallet](dw.order.LineItemCtnr.md#createpaymentinstrumentfromwalletcustomerpaymentinstrument-money), [createPriceAdjustment](dw.order.LineItemCtnr.md#createpriceadjustmentstring), [createPriceAdjustment](dw.order.LineItemCtnr.md#createpriceadjustmentstring-discount), [createProductLineItem](dw.order.LineItemCtnr.md#createproductlineitemproduct-productoptionmodel-shipment), [createProductLineItem](dw.order.LineItemCtnr.md#createproductlineitemproductlistitem-shipment), [createProductLineItem](dw.order.LineItemCtnr.md#createproductlineitemstring-shipment), [createProductLineItem](dw.order.LineItemCtnr.md#createproductlineitemstring-quantity-shipment), [createShipment](dw.order.LineItemCtnr.md#createshipmentstring), [createShippingPriceAdjustment](dw.order.LineItemCtnr.md#createshippingpriceadjustmentstring), [getAdjustedMerchandizeTotalGrossPrice](dw.order.LineItemCtnr.md#getadjustedmerchandizetotalgrossprice), [getAdjustedMerchandizeTotalNetPrice](dw.order.LineItemCtnr.md#getadjustedmerchandizetotalnetprice), [getAdjustedMerchandizeTotalPrice](dw.order.LineItemCtnr.md#getadjustedmerchandizetotalprice), [getAdjustedMerchandizeTotalPrice](dw.order.LineItemCtnr.md#getadjustedmerchandizetotalpriceboolean), [getAdjustedMerchandizeTotalTax](dw.order.LineItemCtnr.md#getadjustedmerchandizetotaltax), [getAdjustedShippingTotalGrossPrice](dw.order.LineItemCtnr.md#getadjustedshippingtotalgrossprice), [getAdjustedShippingTotalNetPrice](dw.order.LineItemCtnr.md#getadjustedshippingtotalnetprice), [getAdjustedShippingTotalPrice](dw.order.LineItemCtnr.md#getadjustedshippingtotalprice), [getAdjustedShippingTotalTax](dw.order.LineItemCtnr.md#getadjustedshippingtotaltax), [getAllGiftCertificateLineItems](dw.order.LineItemCtnr.md#getallgiftcertificatelineitems), [getAllLineItems](dw.order.LineItemCtnr.md#getalllineitems), [getAllProductLineItems](dw.order.LineItemCtnr.md#getallproductlineitems), [getAllProductLineItems](dw.order.LineItemCtnr.md#getallproductlineitemsstring), [getAllProductQuantities](dw.order.LineItemCtnr.md#getallproductquantities), [getAllShippingPriceAdjustments](dw.order.LineItemCtnr.md#getallshippingpriceadjustments), [getBillingAddress](dw.order.LineItemCtnr.md#getbillingaddress), [getBonusDiscountLineItems](dw.order.LineItemCtnr.md#getbonusdiscountlineitems), [getBonusLineItems](dw.order.LineItemCtnr.md#getbonuslineitems), [getBusinessType](dw.order.LineItemCtnr.md#getbusinesstype), [getChannelType](dw.order.LineItemCtnr.md#getchanneltype), [getCouponLineItem](dw.order.LineItemCtnr.md#getcouponlineitemstring), [getCouponLineItems](dw.order.LineItemCtnr.md#getcouponlineitems), [getCurrencyCode](dw.order.LineItemCtnr.md#getcurrencycode), [getCustomer](dw.order.LineItemCtnr.md#getcustomer), [getCustomerEmail](dw.order.LineItemCtnr.md#getcustomeremail), [getCustomerName](dw.order.LineItemCtnr.md#getcustomername), [getCustomerNo](dw.order.LineItemCtnr.md#getcustomerno), [getDefaultShipment](dw.order.LineItemCtnr.md#getdefaultshipment), [getEtag](dw.order.LineItemCtnr.md#getetag), [getGiftCertificateLineItems](dw.order.LineItemCtnr.md#getgiftcertificatelineitems), [getGiftCertificateLineItems](dw.order.LineItemCtnr.md#getgiftcertificatelineitemsstring), [getGiftCertificatePaymentInstruments](dw.order.LineItemCtnr.md#getgiftcertificatepaymentinstruments), [getGiftCertificatePaymentInstruments](dw.order.LineItemCtnr.md#getgiftcertificatepaymentinstrumentsstring), [getGiftCertificateTotalGrossPrice](dw.order.LineItemCtnr.md#getgiftcertificatetotalgrossprice), [getGiftCertificateTotalNetPrice](dw.order.LineItemCtnr.md#getgiftcertificatetotalnetprice), [getGiftCertificateTotalPrice](dw.order.LineItemCtnr.md#getgiftcertificatetotalprice), [getGiftCertificateTotalTax](dw.order.LineItemCtnr.md#getgiftcertificatetotaltax), [getMerchandizeTotalGrossPrice](dw.order.LineItemCtnr.md#getmerchandizetotalgrossprice), [getMerchandizeTotalNetPrice](dw.order.LineItemCtnr.md#getmerchandizetotalnetprice), [getMerchandizeTotalPrice](dw.order.LineItemCtnr.md#getmerchandizetotalprice), [getMerchandizeTotalTax](dw.order.LineItemCtnr.md#getmerchandizetotaltax), [getNotes](dw.order.LineItemCtnr.md#getnotes), [getPaymentInstrument](dw.order.LineItemCtnr.md#getpaymentinstrument), [getPaymentInstruments](dw.order.LineItemCtnr.md#getpaymentinstruments), [getPaymentInstruments](dw.order.LineItemCtnr.md#getpaymentinstrumentsstring), [getPriceAdjustmentByPromotionID](dw.order.LineItemCtnr.md#getpriceadjustmentbypromotionidstring), [getPriceAdjustments](dw.order.LineItemCtnr.md#getpriceadjustments), [getProductLineItems](dw.order.LineItemCtnr.md#getproductlineitems), [getProductLineItems](dw.order.LineItemCtnr.md#getproductlineitemsstring), [getProductQuantities](dw.order.LineItemCtnr.md#getproductquantities), [getProductQuantities](dw.order.LineItemCtnr.md#getproductquantitiesboolean), [getProductQuantityTotal](dw.order.LineItemCtnr.md#getproductquantitytotal), [getShipment](dw.order.LineItemCtnr.md#getshipmentstring), [getShipments](dw.order.LineItemCtnr.md#getshipments), [getShippingPriceAdjustmentByPromotionID](dw.order.LineItemCtnr.md#getshippingpriceadjustmentbypromotionidstring), [getShippingPriceAdjustments](dw.order.LineItemCtnr.md#getshippingpriceadjustments), [getShippingTotalGrossPrice](dw.order.LineItemCtnr.md#getshippingtotalgrossprice), [getShippingTotalNetPrice](dw.order.LineItemCtnr.md#getshippingtotalnetprice), [getShippingTotalPrice](dw.order.LineItemCtnr.md#getshippingtotalprice), [getShippingTotalTax](dw.order.LineItemCtnr.md#getshippingtotaltax), [getTaxTotalsPerTaxRate](dw.order.LineItemCtnr.md#gettaxtotalspertaxrate), [getTotalGrossPrice](dw.order.LineItemCtnr.md#gettotalgrossprice), [getTotalNetPrice](dw.order.LineItemCtnr.md#gettotalnetprice), [getTotalTax](dw.order.LineItemCtnr.md#gettotaltax), [isExternallyTaxed](dw.order.LineItemCtnr.md#isexternallytaxed), [isTaxRoundedAtGroup](dw.order.LineItemCtnr.md#istaxroundedatgroup), [removeAllPaymentInstruments](dw.order.LineItemCtnr.md#removeallpaymentinstruments), [removeBonusDiscountLineItem](dw.order.LineItemCtnr.md#removebonusdiscountlineitembonusdiscountlineitem), [removeCouponLineItem](dw.order.LineItemCtnr.md#removecouponlineitemcouponlineitem), [removeGiftCertificateLineItem](dw.order.LineItemCtnr.md#removegiftcertificatelineitemgiftcertificatelineitem), [removeNote](dw.order.LineItemCtnr.md#removenotenote), [removePaymentInstrument](dw.order.LineItemCtnr.md#removepaymentinstrumentpaymentinstrument), [removePriceAdjustment](dw.order.LineItemCtnr.md#removepriceadjustmentpriceadjustment), [removeProductLineItem](dw.order.LineItemCtnr.md#removeproductlineitemproductlineitem), [removeShipment](dw.order.LineItemCtnr.md#removeshipmentshipment), [removeShippingPriceAdjustment](dw.order.LineItemCtnr.md#removeshippingpriceadjustmentpriceadjustment), [setCustomerEmail](dw.order.LineItemCtnr.md#setcustomeremailstring), [setCustomerName](dw.order.LineItemCtnr.md#setcustomernamestring), [updateOrderLevelPriceAdjustmentTax](dw.order.LineItemCtnr.md#updateorderlevelpriceadjustmenttax), [updateTotals](dw.order.LineItemCtnr.md#updatetotals), [verifyPriceAdjustmentLimits](dw.order.LineItemCtnr.md#verifypriceadjustmentlimits)
### Methods inherited from class ExtensibleObject

[describe](dw.object.ExtensibleObject.md#describe), [getCustom](dw.object.ExtensibleObject.md#getcustom)
### Methods inherited from class PersistentObject

[getCreationDate](dw.object.PersistentObject.md#getcreationdate), [getLastModified](dw.object.PersistentObject.md#getlastmodified), [getUUID](dw.object.PersistentObject.md#getuuid)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### CONFIRMATION_STATUS_CONFIRMED

- CONFIRMATION_STATUS_CONFIRMED: [Number](TopLevel.Number.md) = 2
  - : constant for when Confirmation Status is Confirmed


---

### CONFIRMATION_STATUS_NOTCONFIRMED

- CONFIRMATION_STATUS_NOTCONFIRMED: [Number](TopLevel.Number.md) = 0
  - : constant for when Confirmation Status is Not Confirmed


---

### ENCRYPTION_ALGORITHM_RSA_ECB_OAEPWITHSHA_256ANDMGF1PADDING

- ENCRYPTION_ALGORITHM_RSA_ECB_OAEPWITHSHA_256ANDMGF1PADDING: [String](TopLevel.String.md) = "RSA/ECB/OAEPWithSHA-256AndMGF1Padding"
  - : The encryption algorithm "RSA/ECB/OAEPWithSHA-256AndMGF1Padding".


---

### ENCRYPTION_ALGORITHM_RSA_ECB_PKCS1PADDING

- ~~ENCRYPTION_ALGORITHM_RSA_ECB_PKCS1PADDING: [String](TopLevel.String.md) = "RSA/ECB/PKCS1Padding"~~
  - : The outdated encryption algorithm "RSA/ECB/PKCS1Padding". Please do not use anymore!

    **Deprecated:**
:::warning
Support for this algorithm will be removed in a future release. Please use
            [ENCRYPTION_ALGORITHM_RSA_ECB_OAEPWITHSHA_256ANDMGF1PADDING](dw.order.Order.md#encryption_algorithm_rsa_ecb_oaepwithsha_256andmgf1padding) instead.

:::

---

### EXPORT_STATUS_EXPORTED

- EXPORT_STATUS_EXPORTED: [Number](TopLevel.Number.md) = 1
  - : constant for when Export Status is Exported


---

### EXPORT_STATUS_FAILED

- EXPORT_STATUS_FAILED: [Number](TopLevel.Number.md) = 3
  - : constant for when Export Status is Failed


---

### EXPORT_STATUS_NOTEXPORTED

- EXPORT_STATUS_NOTEXPORTED: [Number](TopLevel.Number.md) = 0
  - : constant for when Export Status is Not Exported


---

### EXPORT_STATUS_READY

- EXPORT_STATUS_READY: [Number](TopLevel.Number.md) = 2
  - : constant for when Export Status is ready to be exported.


---

### ORDER_STATUS_CANCELLED

- ORDER_STATUS_CANCELLED: [Number](TopLevel.Number.md) = 6
  - : constant for when Order Status is Cancelled


---

### ORDER_STATUS_COMPLETED

- ORDER_STATUS_COMPLETED: [Number](TopLevel.Number.md) = 5
  - : constant for when Order Status is Completed


---

### ORDER_STATUS_CREATED

- ORDER_STATUS_CREATED: [Number](TopLevel.Number.md) = 0
  - : constant for when Order Status is Created


---

### ORDER_STATUS_FAILED

- ORDER_STATUS_FAILED: [Number](TopLevel.Number.md) = 8
  - : constant for when Order Status is Failed


---

### ORDER_STATUS_NEW

- ORDER_STATUS_NEW: [Number](TopLevel.Number.md) = 3
  - : constant for when Order Status is New


---

### ORDER_STATUS_OPEN

- ORDER_STATUS_OPEN: [Number](TopLevel.Number.md) = 4
  - : constant for when Order Status is Open


---

### ORDER_STATUS_REPLACED

- ORDER_STATUS_REPLACED: [Number](TopLevel.Number.md) = 7
  - : constant for when Order Status is Replaced


---

### PAYMENT_STATUS_NOTPAID

- PAYMENT_STATUS_NOTPAID: [Number](TopLevel.Number.md) = 0
  - : constant for when Payment Status is Not Paid


---

### PAYMENT_STATUS_PAID

- PAYMENT_STATUS_PAID: [Number](TopLevel.Number.md) = 2
  - : constant for when Payment Status is Paid


---

### PAYMENT_STATUS_PARTPAID

- PAYMENT_STATUS_PARTPAID: [Number](TopLevel.Number.md) = 1
  - : constant for when Payment Status is Part Paid


---

### SHIPPING_STATUS_NOTSHIPPED

- SHIPPING_STATUS_NOTSHIPPED: [Number](TopLevel.Number.md) = 0
  - : constant for when Shipping Status is Not shipped


---

### SHIPPING_STATUS_PARTSHIPPED

- SHIPPING_STATUS_PARTSHIPPED: [Number](TopLevel.Number.md) = 1
  - : constant for when Shipping Status is Part Shipped


---

### SHIPPING_STATUS_SHIPPED

- SHIPPING_STATUS_SHIPPED: [Number](TopLevel.Number.md) = 2
  - : constant for when Shipping Status is Shipped


---

## Property Details

### affiliatePartnerID
- affiliatePartnerID: [String](TopLevel.String.md)
  - : Returns the affiliate partner ID value, or null.


---

### affiliatePartnerName
- affiliatePartnerName: [String](TopLevel.String.md)
  - : Returns the affiliate partner name value, or null.


---

### appeasementItems
- appeasementItems: [FilteringCollection](dw.util.FilteringCollection.md) `(read-only)`
  - : Returns the collection of [AppeasementItem](dw.order.AppeasementItem.md)s associated with this order.


---

### appeasements
- appeasements: [FilteringCollection](dw.util.FilteringCollection.md) `(read-only)`
  - : Returns the collection of [Appeasement](dw.order.Appeasement.md)s associated with this order.


---

### cancelCode
- cancelCode: [EnumValue](dw.value.EnumValue.md)
  - : If this order was cancelled, returns the value of the
      cancel code or null.



---

### cancelDescription
- cancelDescription: [String](TopLevel.String.md)
  - : If this order was cancelled, returns the text describing why
      the order was cancelled or null.



---

### capturedAmount
- capturedAmount: [Money](dw.value.Money.md) `(read-only)`
  - : Returns the sum of the captured amounts. The captured amounts
      are calculated on the fly. Associate a payment capture for an [PaymentInstrument](dw.order.PaymentInstrument.md) with an [Invoice](dw.order.Invoice.md)
      using [Invoice.addCaptureTransaction(OrderPaymentInstrument, Money)](dw.order.Invoice.md#addcapturetransactionorderpaymentinstrument-money).



---

### confirmationStatus
- confirmationStatus: [EnumValue](dw.value.EnumValue.md)
  - : Returns the confirmation status of the order.
      
      Possible values are [CONFIRMATION_STATUS_NOTCONFIRMED](dw.order.Order.md#confirmation_status_notconfirmed) and
      [CONFIRMATION_STATUS_CONFIRMED](dw.order.Order.md#confirmation_status_confirmed).



---

### createdBy
- createdBy: [String](TopLevel.String.md) `(read-only)`
  - : Returns the name of the user who has created the order.
      If an agent user has created the order, the agent user's name
      is returned. Otherwise "Customer" is returned.



---

### currentOrder
- currentOrder: [Order](dw.order.Order.md) `(read-only)`
  - : Returns the current order. The current order
      represents the most recent order in a chain of orders.
      For example, if Order1 was replaced by Order2, Order2 is the current
      representation of the order and Order1 is the original representation
      of the order. If you replace Order2 with Order3, Order 3 is now the
      current order and Order1 is still the original representation of the
      order. If this order has not been replaced, this method returns this
      order because this order is the current order.


    **See Also:**
    - [getOriginalOrderNo()](dw.order.Order.md#getoriginalorderno)
    - [getOriginalOrder()](dw.order.Order.md#getoriginalorder)
    - [getReplacedOrderNo()](dw.order.Order.md#getreplacedorderno)
    - [getReplacedOrder()](dw.order.Order.md#getreplacedorder)
    - [getReplacementOrderNo()](dw.order.Order.md#getreplacementorderno)
    - [getReplacementOrder()](dw.order.Order.md#getreplacementorder)


---

### currentOrderNo
- currentOrderNo: [String](TopLevel.String.md) `(read-only)`
  - : Returns the order number of the current order. The current order
      represents the most recent order in a chain of orders.
      For example, if Order1 was replaced by Order2, Order2 is the current
      representation of the order and Order1 is the original representation
      of the order. If you replace Order2 with Order3, Order 3 is now the
      current order and Order1 is still the original representation of the
      order. If this order has not been replaced, calling this method returns the
      same value as the [getOrderNo()](dw.order.Order.md#getorderno) method because this order is the
      current order.


    **See Also:**
    - [getOriginalOrderNo()](dw.order.Order.md#getoriginalorderno)
    - [getOriginalOrder()](dw.order.Order.md#getoriginalorder)
    - [getReplacedOrderNo()](dw.order.Order.md#getreplacedorderno)
    - [getReplacedOrder()](dw.order.Order.md#getreplacedorder)
    - [getReplacementOrderNo()](dw.order.Order.md#getreplacementorderno)
    - [getReplacementOrder()](dw.order.Order.md#getreplacementorder)


---

### customerLocaleID
- customerLocaleID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the ID of the locale that was in effect when the order
      was placed. This is the customer's locale.



---

### customerOrderReference
- customerOrderReference: [String](TopLevel.String.md)
  - : Returns the customer-specific reference information for the order, or null.


---

### exportAfter
- exportAfter: [Date](TopLevel.Date.md)
  - : Returns a date after which an order can be exported.


---

### exportStatus
- exportStatus: [EnumValue](dw.value.EnumValue.md)
  - : Returns the export status of the order.
      
      Possible values are: [EXPORT_STATUS_NOTEXPORTED](dw.order.Order.md#export_status_notexported),
      [EXPORT_STATUS_EXPORTED](dw.order.Order.md#export_status_exported), [EXPORT_STATUS_READY](dw.order.Order.md#export_status_ready),
      and [EXPORT_STATUS_FAILED](dw.order.Order.md#export_status_failed).



---

### externalOrderNo
- externalOrderNo: [String](TopLevel.String.md)
  - : Returns the value of an external order number associated
      with this order, or null.



---

### externalOrderStatus
- externalOrderStatus: [String](TopLevel.String.md)
  - : Returns the status of an external order associated
      with this order, or null.



---

### externalOrderText
- externalOrderText: [String](TopLevel.String.md)
  - : Returns the text describing the external order, or null.


---

### globalPartyID
- globalPartyID: [String](TopLevel.String.md) `(read-only)`
  - : The Global Party ID reconciles customer identity across multiple systems. For example, as part of the Service for
      Commerce experience, service agents can find information for customers who have never called into the call
      center, but have created a profile on the website. Service agents can find guest order data from B2C Commerce and
      easily create accounts for customers. Customer 360 Data Manager matches records from multiple data sources to
      determine all the records associated with a specific customer.



---

### imported
- imported: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns `true`, if the order is imported and `false`
      otherwise.



---

### invoiceItems
- invoiceItems: [FilteringCollection](dw.util.FilteringCollection.md) `(read-only)`
  - : Returns the collection of [InvoiceItem](dw.order.InvoiceItem.md)s associated with this order.
      
      
      Order post-processing APIs (gillian) are now inactive by default and will throw
      an exception if accessed. Activation needs preliminary approval by Product Management.
      Please contact support in this case. Existing customers using these APIs are not
      affected by this change and can use the APIs until further notice.



---

### invoiceNo
- invoiceNo: [String](TopLevel.String.md)
  - : Returns the invoice number for this Order.
      
      
      When an order is placed (e.g. with [OrderMgr.placeOrder(Order)](dw.order.OrderMgr.md#placeorderorder)) invoice number will be filled
      using a sequence. Before order was placed `null` will be returned unless it was set with
      [setInvoiceNo(String)](dw.order.Order.md#setinvoicenostring).



---

### invoices
- invoices: [FilteringCollection](dw.util.FilteringCollection.md) `(read-only)`
  - : Returns the collection of [Invoice](dw.order.Invoice.md)s associated with this order.
      
      
      Order post-processing APIs (gillian) are now inactive by default and will throw
      an exception if accessed. Activation needs preliminary approval by Product Management.
      Please contact support in this case. Existing customers using these APIs are not
      affected by this change and can use the APIs until further notice.



---

### orderExportXML
- orderExportXML: [String](TopLevel.String.md) `(read-only)`
  - : Returns the order export XML as String object.
      
      
      NOTE: This method will return payment instrument data masked. If payment instrument re-encryption is needed
      please use [getOrderExportXML(String, String)](dw.order.Order.md#getorderexportxmlstring-string---variant-2) instead.
      
      
      Example:
      
      
      ```
      var orderXMLAsString : String = order.getOrderExportXML();
      var orderXML : XML = new XML(orderXMLAsString);
      ```



---

### orderNo
- orderNo: [String](TopLevel.String.md) `(read-only)`
  - : Returns the order number for this order.


---

### orderToken
- orderToken: [String](TopLevel.String.md) `(read-only)`
  - : Returns the token for this order. The order token is a string (length 32 bytes) associated
      with this one order. The order token is random. It reduces the capability of malicious
      users to access an order through guessing. Order token can be used to **further** validate order
      ownership, but should never be used to solely validate ownership. In addition, the storefront
      should ensure authentication and authorization. See the [Security Best Practices for Developers](https://help.salesforce.com/s/articleView?id=cc.b2c\_developer\_authentication\_and\_authorization.htm) for details.



---

### originalOrder
- originalOrder: [Order](dw.order.Order.md) `(read-only)`
  - : Returns the original order associated with
      this order. The original order represents an order that was the
      first ancestor in a chain of orders.
      For example, if Order1 was replaced by Order2, Order2 is the current
      representation of the order and Order1 is the original representation
      of the order. If you replace Order2 with Order3, Order1 is still the
      original representation of the order. If this order is the first
      ancestor, this method returns this order.


    **See Also:**
    - [getCurrentOrderNo()](dw.order.Order.md#getcurrentorderno)
    - [getCurrentOrder()](dw.order.Order.md#getcurrentorder)
    - [getReplacedOrderNo()](dw.order.Order.md#getreplacedorderno)
    - [getReplacedOrder()](dw.order.Order.md#getreplacedorder)
    - [getReplacementOrderNo()](dw.order.Order.md#getreplacementorderno)
    - [getReplacementOrder()](dw.order.Order.md#getreplacementorder)


---

### originalOrderNo
- originalOrderNo: [String](TopLevel.String.md) `(read-only)`
  - : Returns the order number of the original order associated with
      this order. The original order represents an order that was the
      first ancestor in a chain of orders.
      For example, if Order1 was replaced by Order2, Order2 is the current
      representation of the order and Order1 is the original representation
      of the order. If you replace Order2 with Order3, Order1 is still the
      original representation of the order. If this order is the first
      ancestor, this method returns the value of getOrderNo().


    **See Also:**
    - [getCurrentOrderNo()](dw.order.Order.md#getcurrentorderno)
    - [getCurrentOrder()](dw.order.Order.md#getcurrentorder)
    - [getReplacedOrderNo()](dw.order.Order.md#getreplacedorderno)
    - [getReplacedOrder()](dw.order.Order.md#getreplacedorder)
    - [getReplacementOrderNo()](dw.order.Order.md#getreplacementorderno)
    - [getReplacementOrder()](dw.order.Order.md#getreplacementorder)


---

### paymentStatus
- paymentStatus: [EnumValue](dw.value.EnumValue.md)
  - : Returns the order payment status value.
      
      Possible values are [PAYMENT_STATUS_NOTPAID](dw.order.Order.md#payment_status_notpaid), [PAYMENT_STATUS_PARTPAID](dw.order.Order.md#payment_status_partpaid)
      or [PAYMENT_STATUS_PAID](dw.order.Order.md#payment_status_paid).



---

### paymentTransaction
- ~~paymentTransaction: [PaymentTransaction](dw.order.PaymentTransaction.md)~~ `(read-only)`
  - : Returns the payment transaction associated with this order.
      It is possible that there are multiple payment transactions
      associated with the order.  In this case, this method returns
      the transaction associated with the first PaymentInstrument
      returned by `getPaymentInstruments()`.


    **Deprecated:**
:::warning
Use [LineItemCtnr.getPaymentInstruments()](dw.order.LineItemCtnr.md#getpaymentinstruments)
to get the list of PaymentInstrument instances and then use
getPaymentTransaction() method on each PaymentInstrument to access
the individual transactions.

:::

---

### refundedAmount
- refundedAmount: [Money](dw.value.Money.md) `(read-only)`
  - : Returns the sum of the refunded amounts. The refunded amounts are
      calculated on the fly. Associate a payment refund for an [PaymentInstrument](dw.order.PaymentInstrument.md) with an [Invoice](dw.order.Invoice.md)
      using [Invoice.addRefundTransaction(OrderPaymentInstrument, Money)](dw.order.Invoice.md#addrefundtransactionorderpaymentinstrument-money).



---

### remoteHost
- remoteHost: [String](TopLevel.String.md) `(read-only)`
  - : Returns the IP address of the remote host from which the order was created.
      
      
      If the IP address was not captured for the order because order IP logging
      was disabled at the time the order was created, null will be returned.



---

### replaceCode
- replaceCode: [EnumValue](dw.value.EnumValue.md)
  - : If this order was replaced by another order,
      returns the value of the replace code. Otherwise.
      returns null.



---

### replaceDescription
- replaceDescription: [String](TopLevel.String.md)
  - : If this order was replaced by another order,
      returns the value of the replace description. Otherwise
      returns null.



---

### replacedOrder
- replacedOrder: [Order](dw.order.Order.md) `(read-only)`
  - : Returns the order that this order replaced or null. For example, if you
      have three orders where Order1 was replaced by Order2 and Order2 was
      replaced by Order3, calling this method on Order3 will return Order2.
      Similarly, calling this method on Order1 will return null as Order1 was
      the original order.


    **See Also:**
    - [getCurrentOrderNo()](dw.order.Order.md#getcurrentorderno)
    - [getCurrentOrder()](dw.order.Order.md#getcurrentorder)
    - [getOriginalOrderNo()](dw.order.Order.md#getoriginalorderno)
    - [getOriginalOrder()](dw.order.Order.md#getoriginalorder)
    - [getReplacementOrderNo()](dw.order.Order.md#getreplacementorderno)
    - [getReplacementOrder()](dw.order.Order.md#getreplacementorder)


---

### replacedOrderNo
- replacedOrderNo: [String](TopLevel.String.md) `(read-only)`
  - : Returns the order number that this order replaced or null if this order
      did not replace an order. For example, if you have three orders
      where Order1 was replaced by Order2 and Order2 was replaced by Order3,
      calling this method on Order3 will return the order number for
      Order2. Similarly, calling this method on Order1 will return null as
      Order1 was the original order.


    **See Also:**
    - [getCurrentOrderNo()](dw.order.Order.md#getcurrentorderno)
    - [getCurrentOrder()](dw.order.Order.md#getcurrentorder)
    - [getOriginalOrderNo()](dw.order.Order.md#getoriginalorderno)
    - [getOriginalOrder()](dw.order.Order.md#getoriginalorder)
    - [getReplacementOrderNo()](dw.order.Order.md#getreplacementorderno)
    - [getReplacementOrder()](dw.order.Order.md#getreplacementorder)


---

### replacementOrder
- replacementOrder: [Order](dw.order.Order.md) `(read-only)`
  - : Returns the order that replaced this order, or null.

    **See Also:**
    - [getCurrentOrderNo()](dw.order.Order.md#getcurrentorderno)
    - [getCurrentOrder()](dw.order.Order.md#getcurrentorder)
    - [getOriginalOrderNo()](dw.order.Order.md#getoriginalorderno)
    - [getOriginalOrder()](dw.order.Order.md#getoriginalorder)
    - [getReplacedOrderNo()](dw.order.Order.md#getreplacedorderno)
    - [getReplacedOrder()](dw.order.Order.md#getreplacedorder)


---

### replacementOrderNo
- replacementOrderNo: [String](TopLevel.String.md) `(read-only)`
  - : If this order was replaced by another order,
      returns the order number that replaced this order. Otherwise
      returns null.


    **See Also:**
    - [getCurrentOrderNo()](dw.order.Order.md#getcurrentorderno)
    - [getCurrentOrder()](dw.order.Order.md#getcurrentorder)
    - [getOriginalOrderNo()](dw.order.Order.md#getoriginalorderno)
    - [getOriginalOrder()](dw.order.Order.md#getoriginalorder)
    - [getReplacedOrderNo()](dw.order.Order.md#getreplacedorderno)
    - [getReplacedOrder()](dw.order.Order.md#getreplacedorder)


---

### returnCaseItems
- returnCaseItems: [FilteringCollection](dw.util.FilteringCollection.md) `(read-only)`
  - : Returns the collection of [ReturnCaseItem](dw.order.ReturnCaseItem.md)s associated with this order.
      
      
      Order post-processing APIs (gillian) are now inactive by default and will throw
      an exception if accessed. Activation needs preliminary approval by Product Management.
      Please contact support in this case. Existing customers using these APIs are not
      affected by this change and can use the APIs until further notice.



---

### returnCases
- returnCases: [FilteringCollection](dw.util.FilteringCollection.md) `(read-only)`
  - : Returns the collection of [ReturnCase](dw.order.ReturnCase.md)s associated with this order.
      
      
      Order post-processing APIs (gillian) are now inactive by default and will throw
      an exception if accessed. Activation needs preliminary approval by Product Management.
      Please contact support in this case. Existing customers using these APIs are not
      affected by this change and can use the APIs until further notice.



---

### returnItems
- returnItems: [FilteringCollection](dw.util.FilteringCollection.md) `(read-only)`
  - : Returns the collection of [ReturnItem](dw.order.ReturnItem.md)s associated with this order.
      
      
      Order post-processing APIs (gillian) are now inactive by default and will throw
      an exception if accessed. Activation needs preliminary approval by Product Management.
      Please contact support in this case. Existing customers using these APIs are not
      affected by this change and can use the APIs until further notice.



---

### returns
- returns: [FilteringCollection](dw.util.FilteringCollection.md) `(read-only)`
  - : Returns the collection of [Return](dw.order.Return.md)s associated with this order.
      
      
      Order post-processing APIs (gillian) are now inactive by default and will throw
      an exception if accessed. Activation needs preliminary approval by Product Management.
      Please contact support in this case. Existing customers using these APIs are not
      affected by this change and can use the APIs until further notice.



---

### shippingOrderItems
- shippingOrderItems: [FilteringCollection](dw.util.FilteringCollection.md) `(read-only)`
  - : Returns the collection of [ShippingOrderItem](dw.order.ShippingOrderItem.md)s associated with this order.
      
      
      Order post-processing APIs (gillian) are now inactive by default and will throw
      an exception if accessed. Activation needs preliminary approval by Product Management.
      Please contact support in this case. Existing customers using these APIs are not
      affected by this change and can use the APIs until further notice.



---

### shippingOrders
- shippingOrders: [FilteringCollection](dw.util.FilteringCollection.md) `(read-only)`
  - : Returns the collection of [ShippingOrder](dw.order.ShippingOrder.md)s associated with this order.
      
      
      Order post-processing APIs (gillian) are now inactive by default and will throw
      an exception if accessed. Activation needs preliminary approval by Product Management.
      Please contact support in this case. Existing customers using these APIs are not
      affected by this change and can use the APIs until further notice.



---

### shippingStatus
- shippingStatus: [EnumValue](dw.value.EnumValue.md)
  - : Returns the order shipping status.
      
      Possible values are [SHIPPING_STATUS_NOTSHIPPED](dw.order.Order.md#shipping_status_notshipped),
      [SHIPPING_STATUS_PARTSHIPPED](dw.order.Order.md#shipping_status_partshipped) or [SHIPPING_STATUS_SHIPPED](dw.order.Order.md#shipping_status_shipped).



---

### sourceCode
- sourceCode: [String](TopLevel.String.md) `(read-only)`
  - : Returns the source code stored with the order or `null` if no source code is attached to the order.


---

### sourceCodeGroup
- sourceCodeGroup: [SourceCodeGroup](dw.campaign.SourceCodeGroup.md) `(read-only)`
  - : Returns the source code group attached to the order or `null` if no source code group is attached to
      the order.



---

### sourceCodeGroupID
- sourceCodeGroupID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the source code group id stored with the order or `null` if no source code group is attached
      to the order.



---

### status
- status: [EnumValue](dw.value.EnumValue.md)
  - : Returns the status of the order.
      
      Possible values are:
      
      - [ORDER_STATUS_CREATED](dw.order.Order.md#order_status_created)
      - [ORDER_STATUS_NEW](dw.order.Order.md#order_status_new)
      - [ORDER_STATUS_OPEN](dw.order.Order.md#order_status_open)
      - [ORDER_STATUS_COMPLETED](dw.order.Order.md#order_status_completed)
      - [ORDER_STATUS_CANCELLED](dw.order.Order.md#order_status_cancelled)
      - [ORDER_STATUS_FAILED](dw.order.Order.md#order_status_failed)
      - [ORDER_STATUS_REPLACED](dw.order.Order.md#order_status_replaced)
      
      
      
      The order status usually changes when a process action is initiated. Most status changes have an action which
      needs to executed in order to end having the order in a specific order status. When an order is created with e.g.
      [OrderMgr.createOrder(Basket)](dw.order.OrderMgr.md#createorderbasket) the order status will be [ORDER_STATUS_CREATED](dw.order.Order.md#order_status_created). The usual
      flow is that payment authorization will be added to the order. Once the order is considered as valid (payed,
      fraud checked, ...) the order gets placed. This can be done by calling
      [OrderMgr.placeOrder(Order)](dw.order.OrderMgr.md#placeorderorder). The result of placing an order will be status
      [ORDER_STATUS_OPEN](dw.order.Order.md#order_status_open) (from a process standpoint [ORDER_STATUS_NEW](dw.order.Order.md#order_status_new) which has the same meaning).
      Status [ORDER_STATUS_REPLACED](dw.order.Order.md#order_status_replaced) is related to functionality
      [BasketMgr.createBasketFromOrder(Order)](dw.order.BasketMgr.md#createbasketfromorderorder). [ORDER_STATUS_COMPLETED](dw.order.Order.md#order_status_completed) has no meaning by
      default but can be used by custom implementations but is a synonym for NEW/OPEN. Below you will find the most important status changes:
      
      
      
      | Status before | Action | Status after | Business meaning |
      | --- |--- |--- |--- |
      | - | [OrderMgr.createOrder(Basket)](dw.order.OrderMgr.md#createorderbasket) | CREATED | Order was created from a basket. |
      | CREATED | [OrderMgr.placeOrder(Order)](dw.order.OrderMgr.md#placeorderorder) | OPEN/NEW | Order was considered as valid. Order can now be exported to 3rd party systems. |
      | CREATED | [OrderMgr.failOrder(Order)](dw.order.OrderMgr.md#failorderorder) | FAILED | Order was considered not valid. E.g. payment authorization was wrong or fraud check was not successful. |
      | OPEN/NEW | [OrderMgr.cancelOrder(Order)](dw.order.OrderMgr.md#cancelorderorder) | CANCELLED | Order was cancelled. |
      | CANCELLED | [OrderMgr.undoCancelOrder(Order)](dw.order.OrderMgr.md#undocancelorderorder) | OPEN/NEW | Order was cancelled by mistake and this needs to be undone. |
      | FAILED | [OrderMgr.undoFailOrder(Order)](dw.order.OrderMgr.md#undofailorderorder) | CREATED | Order was failed by mistake and this needs to be undone. |
      
      
      Every status change will trigger a change in the order journal which is the base for GMV calculations.


    **See Also:**
    - [LineItemCtnr](dw.order.LineItemCtnr.md)


---

### taxRoundedAtGroup
- taxRoundedAtGroup: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Use this method to check if the Order was created with grouped taxation calculation.
      
      
      If the tax is rounded on group level, the tax is applied to the summed-up tax basis for each tax rate.



---

## Method Details

### createAppeasement()
- createAppeasement(): [Appeasement](dw.order.Appeasement.md)
  - : Creates a new [Appeasement](dw.order.Appeasement.md) associated with this order.
      
      The new Appeasement
      will have an appeasementNumber based on the [getOrderNo()](dw.order.Order.md#getorderno).
      
      
      Order post-processing APIs (gillian) are now inactive by default and will throw
      an exception if accessed. Activation needs preliminary approval by Product Management.
      Please contact support in this case. Existing customers using these APIs are not
      affected by this change and can use the APIs until further notice.


    **Returns:**
    - the created appeasement


---

### createAppeasement(String)
- createAppeasement(appeasementNumber: [String](TopLevel.String.md)): [Appeasement](dw.order.Appeasement.md)
  - : Creates a new [Appeasement](dw.order.Appeasement.md) associated with this order.
      
      
      An appeasementNumber must be specified.
      
      
      If an Appeasement already exists for the appeasementNumber, the method fails with an
      exception.
      
      
      Order post-processing APIs (gillian) are now inactive by default and will throw
      an exception if accessed. Activation needs preliminary approval by Product Management.
      Please contact support in this case. Existing customers using these APIs are not
      affected by this change and can use the APIs until further notice.


    **Parameters:**
    - appeasementNumber - the appeasementNumber to be assigned to the newly created appeasement

    **Returns:**
    - the created appeasement

    **Throws:**
    - IllegalArgumentException - if an Appeasement already exists with the number.


---

### createReturnCase(Boolean)
- createReturnCase(isRMA: [Boolean](TopLevel.Boolean.md)): [ReturnCase](dw.order.ReturnCase.md)
  - : Creates a new [ReturnCase](dw.order.ReturnCase.md) associated with this order
      specifying whether the ReturnCase is an RMA (return merchandise authorization).
      
      
      The new ReturnCase
      will have a returnCaseNumber based on the [getOrderNo()](dw.order.Order.md#getorderno), e.g. for an order-no 1234 the
      return cases will have the numbers 1234\#RC1, 1234\#RC2, 1234\#RC3...
      
      
      Order post-processing APIs (gillian) are now inactive by default and will throw
      an exception if accessed. Activation needs preliminary approval by Product Management.
      Please contact support in this case. Existing customers using these APIs are not
      affected by this change and can use the APIs until further notice.


    **Parameters:**
    - isRMA - whether the new ReturnCase is an RMA (return merchandise authorization)

    **Returns:**
    - the created ReturnCase


---

### createReturnCase(String, Boolean)
- createReturnCase(returnCaseNumber: [String](TopLevel.String.md), isRMA: [Boolean](TopLevel.Boolean.md)): [ReturnCase](dw.order.ReturnCase.md)
  - : Creates a new [ReturnCase](dw.order.ReturnCase.md) associated with this order
      specifying whether the ReturnCase is an RMA (return merchandise authorization).
      
      
      A returnCaseNumber must be specified.
      
      
      If a ReturnCase already exists for the returnCaseNumber, the method fails with an
      exception.
      
      
      Order post-processing APIs (gillian) are now inactive by default and will throw
      an exception if accessed. Activation needs preliminary approval by Product Management.
      Please contact support in this case. Existing customers using these APIs are not
      affected by this change and can use the APIs until further notice.


    **Parameters:**
    - returnCaseNumber - returnCaseNumber to use
    - isRMA - whether the new ReturnCase is an RMA (return merchandise authorization)

    **Returns:**
    - null or the ReturnCase associated with the given returnCaseNumber

    **Throws:**
    - IllegalArgumentException - if a ReturnCase already exists with the number.


---

### createServiceItem(String, String)
- createServiceItem(ID: [String](TopLevel.String.md), status: [String](TopLevel.String.md)): [OrderItem](dw.order.OrderItem.md)
  - : Returns the [order item](dw.order.OrderItem.md) with the given status which wraps a new
      [service item](dw.order.ShippingLineItem.md) which is created and added to the order.


    **Parameters:**
    - ID - the ID of the new service item.             This ID will be returned when [ShippingLineItem.getID()](dw.order.ShippingLineItem.md#getid)             is called.
    - status - the status of the order item, use one of   <li>[OrderItem.STATUS_NEW](dw.order.OrderItem.md#status_new)</li>  <li>[OrderItem.STATUS_OPEN](dw.order.OrderItem.md#status_open)</li>  <li>[OrderItem.STATUS_SHIPPED](dw.order.OrderItem.md#status_shipped)</li>  </ul>    Order post-processing APIs (gillian) are now inactive by default and will throw  an exception if accessed. Activation needs preliminary approval by Product Management.  Please contact support in this case. Existing customers using these APIs are not  affected by this change and can use the APIs until further notice.

    **Returns:**
    - the created order item


---

### createShippingOrder()
- createShippingOrder(): [ShippingOrder](dw.order.ShippingOrder.md)
  - : Creates a new [ShippingOrder](dw.order.ShippingOrder.md) for this order.
      
      
      Generates a default shipping order number. Use
      [createShippingOrder(String)](dw.order.Order.md#createshippingorderstring) for a defined shipping order number.
      
      
      Order post-processing APIs (gillian) are now inactive by default and will throw
      an exception if accessed. Activation needs preliminary approval by Product Management.
      Please contact support in this case. Existing customers using these APIs are not
      affected by this change and can use the APIs until further notice.


    **Returns:**
    - the created shipping order

    **See Also:**
    - [ShippingOrder](dw.order.ShippingOrder.md)


---

### createShippingOrder(String)
- createShippingOrder(shippingOrderNumber: [String](TopLevel.String.md)): [ShippingOrder](dw.order.ShippingOrder.md)
  - : Creates a new [ShippingOrder](dw.order.ShippingOrder.md) for this order.
      
      
      Order post-processing APIs (gillian) are now inactive by default and will throw
      an exception if accessed. Activation needs preliminary approval by Product Management.
      Please contact support in this case. Existing customers using these APIs are not
      affected by this change and can use the APIs until further notice.


    **Parameters:**
    - shippingOrderNumber - the document number to be used

    **Returns:**
    - the created shipping order

    **See Also:**
    - [ShippingOrder](dw.order.ShippingOrder.md)


---

### getAffiliatePartnerID()
- getAffiliatePartnerID(): [String](TopLevel.String.md)
  - : Returns the affiliate partner ID value, or null.

    **Returns:**
    - the affiliate partner ID value, or null.


---

### getAffiliatePartnerName()
- getAffiliatePartnerName(): [String](TopLevel.String.md)
  - : Returns the affiliate partner name value, or null.

    **Returns:**
    - the affiliate partner name value, or null.


---

### getAppeasement(String)
- getAppeasement(appeasementNumber: [String](TopLevel.String.md)): [Appeasement](dw.order.Appeasement.md)
  - : Returns the [Appeasement](dw.order.Appeasement.md) associated with this order with the given appeasementNumber.
      The method returns `null` if no instance can be found.


    **Parameters:**
    - appeasementNumber - the appeasement number

    **Returns:**
    - the Appeasement associated with the given appeasementNumber


---

### getAppeasementItem(String)
- getAppeasementItem(appeasementItemID: [String](TopLevel.String.md)): [AppeasementItem](dw.order.AppeasementItem.md)
  - : Returns the [AppeasementItem](dw.order.AppeasementItem.md) associated with this Order with the given appeasementItemID.
      The method returns `null` if no instance can be found.


    **Parameters:**
    - appeasementItemID - the ID

    **Returns:**
    - the AppeasementItem associated with the given appeasementItemID.


---

### getAppeasementItems()
- getAppeasementItems(): [FilteringCollection](dw.util.FilteringCollection.md)
  - : Returns the collection of [AppeasementItem](dw.order.AppeasementItem.md)s associated with this order.

    **Returns:**
    - the appeasement items belonging to this order


---

### getAppeasements()
- getAppeasements(): [FilteringCollection](dw.util.FilteringCollection.md)
  - : Returns the collection of [Appeasement](dw.order.Appeasement.md)s associated with this order.

    **Returns:**
    - the appeasements associated with this order


---

### getCancelCode()
- getCancelCode(): [EnumValue](dw.value.EnumValue.md)
  - : If this order was cancelled, returns the value of the
      cancel code or null.


    **Returns:**
    - the value of the cancel code.


---

### getCancelDescription()
- getCancelDescription(): [String](TopLevel.String.md)
  - : If this order was cancelled, returns the text describing why
      the order was cancelled or null.


    **Returns:**
    - the description as to why the order was cancelled or null.


---

### getCapturedAmount()
- getCapturedAmount(): [Money](dw.value.Money.md)
  - : Returns the sum of the captured amounts. The captured amounts
      are calculated on the fly. Associate a payment capture for an [PaymentInstrument](dw.order.PaymentInstrument.md) with an [Invoice](dw.order.Invoice.md)
      using [Invoice.addCaptureTransaction(OrderPaymentInstrument, Money)](dw.order.Invoice.md#addcapturetransactionorderpaymentinstrument-money).


    **Returns:**
    - sum of captured amounts


---

### getConfirmationStatus()
- getConfirmationStatus(): [EnumValue](dw.value.EnumValue.md)
  - : Returns the confirmation status of the order.
      
      Possible values are [CONFIRMATION_STATUS_NOTCONFIRMED](dw.order.Order.md#confirmation_status_notconfirmed) and
      [CONFIRMATION_STATUS_CONFIRMED](dw.order.Order.md#confirmation_status_confirmed).


    **Returns:**
    - Order confirmation status


---

### getCreatedBy()
- getCreatedBy(): [String](TopLevel.String.md)
  - : Returns the name of the user who has created the order.
      If an agent user has created the order, the agent user's name
      is returned. Otherwise "Customer" is returned.


    **Returns:**
    - the name of the user who created the order.


---

### getCurrentOrder()
- getCurrentOrder(): [Order](dw.order.Order.md)
  - : Returns the current order. The current order
      represents the most recent order in a chain of orders.
      For example, if Order1 was replaced by Order2, Order2 is the current
      representation of the order and Order1 is the original representation
      of the order. If you replace Order2 with Order3, Order 3 is now the
      current order and Order1 is still the original representation of the
      order. If this order has not been replaced, this method returns this
      order because this order is the current order.


    **Returns:**
    - the current order.

    **See Also:**
    - [getOriginalOrderNo()](dw.order.Order.md#getoriginalorderno)
    - [getOriginalOrder()](dw.order.Order.md#getoriginalorder)
    - [getReplacedOrderNo()](dw.order.Order.md#getreplacedorderno)
    - [getReplacedOrder()](dw.order.Order.md#getreplacedorder)
    - [getReplacementOrderNo()](dw.order.Order.md#getreplacementorderno)
    - [getReplacementOrder()](dw.order.Order.md#getreplacementorder)


---

### getCurrentOrderNo()
- getCurrentOrderNo(): [String](TopLevel.String.md)
  - : Returns the order number of the current order. The current order
      represents the most recent order in a chain of orders.
      For example, if Order1 was replaced by Order2, Order2 is the current
      representation of the order and Order1 is the original representation
      of the order. If you replace Order2 with Order3, Order 3 is now the
      current order and Order1 is still the original representation of the
      order. If this order has not been replaced, calling this method returns the
      same value as the [getOrderNo()](dw.order.Order.md#getorderno) method because this order is the
      current order.


    **Returns:**
    - the order number of the current order

    **See Also:**
    - [getOriginalOrderNo()](dw.order.Order.md#getoriginalorderno)
    - [getOriginalOrder()](dw.order.Order.md#getoriginalorder)
    - [getReplacedOrderNo()](dw.order.Order.md#getreplacedorderno)
    - [getReplacedOrder()](dw.order.Order.md#getreplacedorder)
    - [getReplacementOrderNo()](dw.order.Order.md#getreplacementorderno)
    - [getReplacementOrder()](dw.order.Order.md#getreplacementorder)


---

### getCustomerLocaleID()
- getCustomerLocaleID(): [String](TopLevel.String.md)
  - : Returns the ID of the locale that was in effect when the order
      was placed. This is the customer's locale.


    **Returns:**
    - the ID of the locale associated with this order, or null.


---

### getCustomerOrderReference()
- getCustomerOrderReference(): [String](TopLevel.String.md)
  - : Returns the customer-specific reference information for the order, or null.

    **Returns:**
    - the customer-specific reference information for the order, or null.


---

### getExportAfter()
- getExportAfter(): [Date](TopLevel.Date.md)
  - : Returns a date after which an order can be exported.

    **Returns:**
    - a date after which an order can be exported.


---

### getExportStatus()
- getExportStatus(): [EnumValue](dw.value.EnumValue.md)
  - : Returns the export status of the order.
      
      Possible values are: [EXPORT_STATUS_NOTEXPORTED](dw.order.Order.md#export_status_notexported),
      [EXPORT_STATUS_EXPORTED](dw.order.Order.md#export_status_exported), [EXPORT_STATUS_READY](dw.order.Order.md#export_status_ready),
      and [EXPORT_STATUS_FAILED](dw.order.Order.md#export_status_failed).


    **Returns:**
    - Order export status


---

### getExternalOrderNo()
- getExternalOrderNo(): [String](TopLevel.String.md)
  - : Returns the value of an external order number associated
      with this order, or null.


    **Returns:**
    - the value of an external order number associated
      with this order, or null.



---

### getExternalOrderStatus()
- getExternalOrderStatus(): [String](TopLevel.String.md)
  - : Returns the status of an external order associated
      with this order, or null.


    **Returns:**
    - the status of an external order associated
      with this order, or null.



---

### getExternalOrderText()
- getExternalOrderText(): [String](TopLevel.String.md)
  - : Returns the text describing the external order, or null.

    **Returns:**
    - the text describing the external order, or null.


---

### getGlobalPartyID()
- getGlobalPartyID(): [String](TopLevel.String.md)
  - : The Global Party ID reconciles customer identity across multiple systems. For example, as part of the Service for
      Commerce experience, service agents can find information for customers who have never called into the call
      center, but have created a profile on the website. Service agents can find guest order data from B2C Commerce and
      easily create accounts for customers. Customer 360 Data Manager matches records from multiple data sources to
      determine all the records associated with a specific customer.


    **Returns:**
    - the Global Party ID associated with this order, or null.


---

### getInvoice(String)
- getInvoice(invoiceNumber: [String](TopLevel.String.md)): [Invoice](dw.order.Invoice.md)
  - : Returns the [Invoice](dw.order.Invoice.md) associated with this order with the given invoiceNumber.
      The method returns `null` if no instance can be found.
      
      
      Order post-processing APIs (gillian) are now inactive by default and will throw
      an exception if accessed. Activation needs preliminary approval by Product Management.
      Please contact support in this case. Existing customers using these APIs are not
      affected by this change and can use the APIs until further notice.


    **Parameters:**
    - invoiceNumber - the invoice number

    **Returns:**
    - the invoice associated with the given invoiceNumber


---

### getInvoiceItem(String)
- getInvoiceItem(invoiceItemID: [String](TopLevel.String.md)): [InvoiceItem](dw.order.InvoiceItem.md)
  - : Returns the [InvoiceItem](dw.order.InvoiceItem.md) associated with this order with the given ID.
      The method returns `null` if no instance can be found.
      
      
      Order post-processing APIs (gillian) are now inactive by default and will throw
      an exception if accessed. Activation needs preliminary approval by Product Management.
      Please contact support in this case. Existing customers using these APIs are not
      affected by this change and can use the APIs until further notice.


    **Parameters:**
    - invoiceItemID - the item ID

    **Returns:**
    - the invoice item associated with the given ID


---

### getInvoiceItems()
- getInvoiceItems(): [FilteringCollection](dw.util.FilteringCollection.md)
  - : Returns the collection of [InvoiceItem](dw.order.InvoiceItem.md)s associated with this order.
      
      
      Order post-processing APIs (gillian) are now inactive by default and will throw
      an exception if accessed. Activation needs preliminary approval by Product Management.
      Please contact support in this case. Existing customers using these APIs are not
      affected by this change and can use the APIs until further notice.


    **Returns:**
    - invoice items belonging to this order


---

### getInvoiceNo()
- getInvoiceNo(): [String](TopLevel.String.md)
  - : Returns the invoice number for this Order.
      
      
      When an order is placed (e.g. with [OrderMgr.placeOrder(Order)](dw.order.OrderMgr.md#placeorderorder)) invoice number will be filled
      using a sequence. Before order was placed `null` will be returned unless it was set with
      [setInvoiceNo(String)](dw.order.Order.md#setinvoicenostring).


    **Returns:**
    - the invoice number for this Order.


---

### getInvoices()
- getInvoices(): [FilteringCollection](dw.util.FilteringCollection.md)
  - : Returns the collection of [Invoice](dw.order.Invoice.md)s associated with this order.
      
      
      Order post-processing APIs (gillian) are now inactive by default and will throw
      an exception if accessed. Activation needs preliminary approval by Product Management.
      Please contact support in this case. Existing customers using these APIs are not
      affected by this change and can use the APIs until further notice.


    **Returns:**
    - invoices belonging to this order


---

### getOrderExportXML()
- getOrderExportXML(): [String](TopLevel.String.md)
  - : Returns the order export XML as String object.
      
      
      NOTE: This method will return payment instrument data masked. If payment instrument re-encryption is needed
      please use [getOrderExportXML(String, String)](dw.order.Order.md#getorderexportxmlstring-string---variant-2) instead.
      
      
      Example:
      
      
      ```
      var orderXMLAsString : String = order.getOrderExportXML();
      var orderXML : XML = new XML(orderXMLAsString);
      ```


    **Returns:**
    - the order export XML

    **Throws:**
    - IllegalStateException - If the method is called in a transaction with changes.
    - IllegalStateException - If the order is not placed. This method can be called for placed orders only.
    - IllegalStateException - If the order export XML could not be generated.


---

### getOrderExportXML(String, String) - Variant 1
- getOrderExportXML(encryptionAlgorithm: [String](TopLevel.String.md), encryptionKey: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : Returns the order export XML as String object, with payment instrument data re-encrypted using the given
      encryption algorithm and key.
      
      
      NOTE: If no encryption is needed or desired please always use [getOrderExportXML()](dw.order.Order.md#getorderexportxml) instead, which returns
      the payment instrument data masked. Do **not** pass in any null arguments!
      
      
      Example:
      
      
      ```
      var orderXMLAsString : String = order.getOrderExportXML( "RSA/ECB/PKCS1Padding", "[key]" );
      var orderXML : XML = new XML( orderXMLAsString );
      ```


    **Parameters:**
    - encryptionAlgorithm - The encryption algorithm to be used for the re-encryption of the payment instrument             data (credit card number, bank account number, bank account driver's license number). Must be a valid,             non-null algorithm. Currently, only [ENCRYPTION_ALGORITHM_RSA_ECB_PKCS1PADDING](dw.order.Order.md#encryption_algorithm_rsa_ecb_pkcs1padding) is supported,             but this will be fixed and support for             [ENCRYPTION_ALGORITHM_RSA_ECB_OAEPWITHSHA_256ANDMGF1PADDING](dw.order.Order.md#encryption_algorithm_rsa_ecb_oaepwithsha_256andmgf1padding) will be added soon.
    - encryptionKey - The Base64 encoded form of the public key to be used for the re-encryption of the payment             instrument data. Must be a valid, non-blank key.

    **Returns:**
    - the order export XML

    **Throws:**
    - IllegalStateException - If the method is called in a transaction with changes.
    - IllegalStateException - If the order is not placed. This method can be called for placed orders only.
    - IllegalStateException - If the order export XML could not be generated.

    **API Version:**
:::note
No longer available as of version 22.7.
undefined behaviour for invalid arguments (e.g. null)
:::

---

### getOrderExportXML(String, String, Boolean) - Variant 1
- ~~getOrderExportXML(encryptionAlgorithm: [String](TopLevel.String.md), encryptionKey: [String](TopLevel.String.md), encryptUsingEKID: [Boolean](TopLevel.Boolean.md)): [String](TopLevel.String.md)~~
  - : Returns the order export XML as String object, with payment instrument data re-encrypted using the given
      encryption algorithm and key.
      
      
      NOTE: If no encryption is needed or desired please always use [getOrderExportXML()](dw.order.Order.md#getorderexportxml) instead, which returns
      the payment instrument data masked. Do **not** pass in any null arguments!
      
      
      Example:
      
      
      ```
      var orderXMLAsString : String = order.getOrderExportXML( "RSA/ECB/PKCS1Padding", "[key]", false );
      var orderXML : XML = new XML( orderXMLAsString );
      ```


    **Parameters:**
    - encryptionAlgorithm - The encryption algorithm to be used for the re-encryption of the payment instrument             data (credit card number, bank account number, bank account driver's license number). Must be a valid,             non-null algorithm. Currently, only [ENCRYPTION_ALGORITHM_RSA_ECB_PKCS1PADDING](dw.order.Order.md#encryption_algorithm_rsa_ecb_pkcs1padding) is supported,             but this will be fixed and support for             [ENCRYPTION_ALGORITHM_RSA_ECB_OAEPWITHSHA_256ANDMGF1PADDING](dw.order.Order.md#encryption_algorithm_rsa_ecb_oaepwithsha_256andmgf1padding) will be added soon.
    - encryptionKey - The Base64 encoded form of the public key to be used for the re-encryption of the payment             instrument data. Must be a valid, non-blank key.
    - encryptUsingEKID - ignored

    **Returns:**
    - the order export XML

    **Throws:**
    - IllegalStateException - If the method is called in a transaction with changes.
    - IllegalStateException - If the order is not placed. This method can be called for placed orders only.
    - IllegalStateException - If the order export XML could not be generated.

    **Deprecated:**
:::warning
This method will be removed soon. Please use the following methods instead:
            
- [getOrderExportXML()](dw.order.Order.md#getorderexportxml)– if payment instrument data should be masked                - [getOrderExportXML(String, String)](dw.order.Order.md#getorderexportxmlstring-string---variant-1)– if payment instrument data should be re-encrypted                

:::
    **API Version:**
:::note
No longer available as of version 22.7.
undefined behaviour for invalid arguments (e.g. null)
:::

---

### getOrderExportXML(String, String) - Variant 2
- getOrderExportXML(encryptionAlgorithm: [String](TopLevel.String.md), encryptionKey: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : Returns the order export XML as String object, with payment instrument data re-encrypted using the given
      encryption algorithm and key.
      
      
      NOTE: If no encryption is needed or desired please always use [getOrderExportXML()](dw.order.Order.md#getorderexportxml) instead, which returns
      the payment instrument data masked.
      
      
      Example:
      
      
      ```
      var orderXMLAsString : String = order.getOrderExportXML( "RSA/ECB/PKCS1Padding", "[key]" );
      var orderXML : XML = new XML( orderXMLAsString );
      ```


    **Parameters:**
    - encryptionAlgorithm - The encryption algorithm used for the re-encryption of the payment instrument data             (credit card number, bank account number, bank account driver's license number). Must be one of the             following:                          <li>[ENCRYPTION_ALGORITHM_RSA_ECB_OAEPWITHSHA_256ANDMGF1PADDING](dw.order.Order.md#encryption_algorithm_rsa_ecb_oaepwithsha_256andmgf1padding) – The current and preferred             algorithm.             <li>[ENCRYPTION_ALGORITHM_RSA_ECB_PKCS1PADDING](dw.order.Order.md#encryption_algorithm_rsa_ecb_pkcs1padding) – This algorithm is outdated/deprecated and             will be removed in a future release. Please do **not** use anymore.             </ul>
    - encryptionKey - The Base64 encoded form of the public key used for the re-encryption of the payment             instrument data. Must be a valid, non-blank key.

    **Returns:**
    - the order export XML

    **Throws:**
    - IllegalArgumentException - If `encryptionAlgorithm` is not a valid known algorithm.
    - IllegalArgumentException - If `encryptionKey` is a blank string.
    - IllegalStateException - If the method is called in a transaction with changes.
    - IllegalStateException - If the order is not placed. This method can be called for placed orders only.
    - IllegalStateException - If the order export XML could not be generated.

    **API Version:**
:::note
Available from version 22.7.
strict encryption argument checks; no null or otherwise invalid values allowed
:::

---

### getOrderItem(String)
- getOrderItem(itemID: [String](TopLevel.String.md)): [OrderItem](dw.order.OrderItem.md)
  - : Returns the [OrderItem](dw.order.OrderItem.md) for the itemID.
      An OrderItem will only exist for [ProductLineItem](dw.order.ProductLineItem.md)s or
      [ShippingLineItem](dw.order.ShippingLineItem.md)s which belong to the order.
      The method fails with an exception if no instance can be found.


    **Parameters:**
    - itemID - the itemID

    **Returns:**
    - the order item for itemID

    **Throws:**
    - IllegalArgumentException - if no instance is found

    **See Also:**
    - [ProductLineItem.getOrderItem()](dw.order.ProductLineItem.md#getorderitem)
    - [ShippingLineItem.getOrderItem()](dw.order.ShippingLineItem.md#getorderitem)


---

### getOrderNo()
- getOrderNo(): [String](TopLevel.String.md)
  - : Returns the order number for this order.

    **Returns:**
    - the order number for this order.


---

### getOrderToken()
- getOrderToken(): [String](TopLevel.String.md)
  - : Returns the token for this order. The order token is a string (length 32 bytes) associated
      with this one order. The order token is random. It reduces the capability of malicious
      users to access an order through guessing. Order token can be used to **further** validate order
      ownership, but should never be used to solely validate ownership. In addition, the storefront
      should ensure authentication and authorization. See the [Security Best Practices for Developers](https://help.salesforce.com/s/articleView?id=cc.b2c\_developer\_authentication\_and\_authorization.htm) for details.


    **Returns:**
    - the token for this order.


---

### getOriginalOrder()
- getOriginalOrder(): [Order](dw.order.Order.md)
  - : Returns the original order associated with
      this order. The original order represents an order that was the
      first ancestor in a chain of orders.
      For example, if Order1 was replaced by Order2, Order2 is the current
      representation of the order and Order1 is the original representation
      of the order. If you replace Order2 with Order3, Order1 is still the
      original representation of the order. If this order is the first
      ancestor, this method returns this order.


    **Returns:**
    - the order number of the original order associated with
      this order.


    **See Also:**
    - [getCurrentOrderNo()](dw.order.Order.md#getcurrentorderno)
    - [getCurrentOrder()](dw.order.Order.md#getcurrentorder)
    - [getReplacedOrderNo()](dw.order.Order.md#getreplacedorderno)
    - [getReplacedOrder()](dw.order.Order.md#getreplacedorder)
    - [getReplacementOrderNo()](dw.order.Order.md#getreplacementorderno)
    - [getReplacementOrder()](dw.order.Order.md#getreplacementorder)


---

### getOriginalOrderNo()
- getOriginalOrderNo(): [String](TopLevel.String.md)
  - : Returns the order number of the original order associated with
      this order. The original order represents an order that was the
      first ancestor in a chain of orders.
      For example, if Order1 was replaced by Order2, Order2 is the current
      representation of the order and Order1 is the original representation
      of the order. If you replace Order2 with Order3, Order1 is still the
      original representation of the order. If this order is the first
      ancestor, this method returns the value of getOrderNo().


    **Returns:**
    - the order number of the original order associated with
      this order.


    **See Also:**
    - [getCurrentOrderNo()](dw.order.Order.md#getcurrentorderno)
    - [getCurrentOrder()](dw.order.Order.md#getcurrentorder)
    - [getReplacedOrderNo()](dw.order.Order.md#getreplacedorderno)
    - [getReplacedOrder()](dw.order.Order.md#getreplacedorder)
    - [getReplacementOrderNo()](dw.order.Order.md#getreplacementorderno)
    - [getReplacementOrder()](dw.order.Order.md#getreplacementorder)


---

### getPaymentStatus()
- getPaymentStatus(): [EnumValue](dw.value.EnumValue.md)
  - : Returns the order payment status value.
      
      Possible values are [PAYMENT_STATUS_NOTPAID](dw.order.Order.md#payment_status_notpaid), [PAYMENT_STATUS_PARTPAID](dw.order.Order.md#payment_status_partpaid)
      or [PAYMENT_STATUS_PAID](dw.order.Order.md#payment_status_paid).


    **Returns:**
    - Order payment status


---

### getPaymentTransaction()
- ~~getPaymentTransaction(): [PaymentTransaction](dw.order.PaymentTransaction.md)~~
  - : Returns the payment transaction associated with this order.
      It is possible that there are multiple payment transactions
      associated with the order.  In this case, this method returns
      the transaction associated with the first PaymentInstrument
      returned by `getPaymentInstruments()`.


    **Returns:**
    - the payment transaction or null if there is no transaction.

    **Deprecated:**
:::warning
Use [LineItemCtnr.getPaymentInstruments()](dw.order.LineItemCtnr.md#getpaymentinstruments)
to get the list of PaymentInstrument instances and then use
getPaymentTransaction() method on each PaymentInstrument to access
the individual transactions.

:::

---

### getRefundedAmount()
- getRefundedAmount(): [Money](dw.value.Money.md)
  - : Returns the sum of the refunded amounts. The refunded amounts are
      calculated on the fly. Associate a payment refund for an [PaymentInstrument](dw.order.PaymentInstrument.md) with an [Invoice](dw.order.Invoice.md)
      using [Invoice.addRefundTransaction(OrderPaymentInstrument, Money)](dw.order.Invoice.md#addrefundtransactionorderpaymentinstrument-money).


    **Returns:**
    - sum of refunded amounts


---

### getRemoteHost()
- getRemoteHost(): [String](TopLevel.String.md)
  - : Returns the IP address of the remote host from which the order was created.
      
      
      If the IP address was not captured for the order because order IP logging
      was disabled at the time the order was created, null will be returned.


    **Returns:**
    - The IP address of the remote host captured for the order or null


---

### getReplaceCode()
- getReplaceCode(): [EnumValue](dw.value.EnumValue.md)
  - : If this order was replaced by another order,
      returns the value of the replace code. Otherwise.
      returns null.


    **Returns:**
    - the replace code


---

### getReplaceDescription()
- getReplaceDescription(): [String](TopLevel.String.md)
  - : If this order was replaced by another order,
      returns the value of the replace description. Otherwise
      returns null.


    **Returns:**
    - the value of the replace code or null.


---

### getReplacedOrder()
- getReplacedOrder(): [Order](dw.order.Order.md)
  - : Returns the order that this order replaced or null. For example, if you
      have three orders where Order1 was replaced by Order2 and Order2 was
      replaced by Order3, calling this method on Order3 will return Order2.
      Similarly, calling this method on Order1 will return null as Order1 was
      the original order.


    **Returns:**
    - the order that replaced this order, or null.

    **See Also:**
    - [getCurrentOrderNo()](dw.order.Order.md#getcurrentorderno)
    - [getCurrentOrder()](dw.order.Order.md#getcurrentorder)
    - [getOriginalOrderNo()](dw.order.Order.md#getoriginalorderno)
    - [getOriginalOrder()](dw.order.Order.md#getoriginalorder)
    - [getReplacementOrderNo()](dw.order.Order.md#getreplacementorderno)
    - [getReplacementOrder()](dw.order.Order.md#getreplacementorder)


---

### getReplacedOrderNo()
- getReplacedOrderNo(): [String](TopLevel.String.md)
  - : Returns the order number that this order replaced or null if this order
      did not replace an order. For example, if you have three orders
      where Order1 was replaced by Order2 and Order2 was replaced by Order3,
      calling this method on Order3 will return the order number for
      Order2. Similarly, calling this method on Order1 will return null as
      Order1 was the original order.


    **Returns:**
    - the order number of the order that this order replaced or null.

    **See Also:**
    - [getCurrentOrderNo()](dw.order.Order.md#getcurrentorderno)
    - [getCurrentOrder()](dw.order.Order.md#getcurrentorder)
    - [getOriginalOrderNo()](dw.order.Order.md#getoriginalorderno)
    - [getOriginalOrder()](dw.order.Order.md#getoriginalorder)
    - [getReplacementOrderNo()](dw.order.Order.md#getreplacementorderno)
    - [getReplacementOrder()](dw.order.Order.md#getreplacementorder)


---

### getReplacementOrder()
- getReplacementOrder(): [Order](dw.order.Order.md)
  - : Returns the order that replaced this order, or null.

    **Returns:**
    - the order that replaced this order, or null.

    **See Also:**
    - [getCurrentOrderNo()](dw.order.Order.md#getcurrentorderno)
    - [getCurrentOrder()](dw.order.Order.md#getcurrentorder)
    - [getOriginalOrderNo()](dw.order.Order.md#getoriginalorderno)
    - [getOriginalOrder()](dw.order.Order.md#getoriginalorder)
    - [getReplacedOrderNo()](dw.order.Order.md#getreplacedorderno)
    - [getReplacedOrder()](dw.order.Order.md#getreplacedorder)


---

### getReplacementOrderNo()
- getReplacementOrderNo(): [String](TopLevel.String.md)
  - : If this order was replaced by another order,
      returns the order number that replaced this order. Otherwise
      returns null.


    **Returns:**
    - the order that replaced this order, or null.

    **See Also:**
    - [getCurrentOrderNo()](dw.order.Order.md#getcurrentorderno)
    - [getCurrentOrder()](dw.order.Order.md#getcurrentorder)
    - [getOriginalOrderNo()](dw.order.Order.md#getoriginalorderno)
    - [getOriginalOrder()](dw.order.Order.md#getoriginalorder)
    - [getReplacedOrderNo()](dw.order.Order.md#getreplacedorderno)
    - [getReplacedOrder()](dw.order.Order.md#getreplacedorder)


---

### getReturn(String)
- getReturn(returnNumber: [String](TopLevel.String.md)): [Return](dw.order.Return.md)
  - : Returns the [Return](dw.order.Return.md) associated with this order with the given returnNumber.
      The method returns `null` if no instance can be found.
      
      
      Order post-processing APIs (gillian) are now inactive by default and will throw
      an exception if accessed. Activation needs preliminary approval by Product Management.
      Please contact support in this case. Existing customers using these APIs are not
      affected by this change and can use the APIs until further notice.


    **Parameters:**
    - returnNumber - the return number

    **Returns:**
    - the return associated with the given returnNumber


---

### getReturnCase(String)
- getReturnCase(returnCaseNumber: [String](TopLevel.String.md)): [ReturnCase](dw.order.ReturnCase.md)
  - : Returns the [ReturnCase](dw.order.ReturnCase.md) associated with this order with the given returnCaseNumber.
      The method returns `null` if no instance can be found.
      
      
      Order post-processing APIs (gillian) are now inactive by default and will throw
      an exception if accessed. Activation needs preliminary approval by Product Management.
      Please contact support in this case. Existing customers using these APIs are not
      affected by this change and can use the APIs until further notice.


    **Parameters:**
    - returnCaseNumber - the return case number

    **Returns:**
    - the return case associated with the given returnCaseNumber


---

### getReturnCaseItem(String)
- getReturnCaseItem(returnCaseItemID: [String](TopLevel.String.md)): [ReturnCaseItem](dw.order.ReturnCaseItem.md)
  - : Returns the [ReturnCaseItem](dw.order.ReturnCaseItem.md) associated with this order with the given returnCaseItemID.
      The method returns `null` if no instance can be found.
      
      
      Order post-processing APIs (gillian) are now inactive by default and will throw
      an exception if accessed. Activation needs preliminary approval by Product Management.
      Please contact support in this case. Existing customers using these APIs are not
      affected by this change and can use the APIs until further notice.


    **Parameters:**
    - returnCaseItemID - the ID

    **Returns:**
    - the return case item associated with the given returnCaseItemID


---

### getReturnCaseItems()
- getReturnCaseItems(): [FilteringCollection](dw.util.FilteringCollection.md)
  - : Returns the collection of [ReturnCaseItem](dw.order.ReturnCaseItem.md)s associated with this order.
      
      
      Order post-processing APIs (gillian) are now inactive by default and will throw
      an exception if accessed. Activation needs preliminary approval by Product Management.
      Please contact support in this case. Existing customers using these APIs are not
      affected by this change and can use the APIs until further notice.


    **Returns:**
    - return case items belonging to this order


---

### getReturnCases()
- getReturnCases(): [FilteringCollection](dw.util.FilteringCollection.md)
  - : Returns the collection of [ReturnCase](dw.order.ReturnCase.md)s associated with this order.
      
      
      Order post-processing APIs (gillian) are now inactive by default and will throw
      an exception if accessed. Activation needs preliminary approval by Product Management.
      Please contact support in this case. Existing customers using these APIs are not
      affected by this change and can use the APIs until further notice.


    **Returns:**
    - return cases belonging to this order


---

### getReturnItem(String)
- getReturnItem(returnItemID: [String](TopLevel.String.md)): [ReturnItem](dw.order.ReturnItem.md)
  - : Returns the [ReturnItem](dw.order.ReturnItem.md) associated with this order with the given ID.
      The method returns `null` if no instance can be found.
      
      
      Order post-processing APIs (gillian) are now inactive by default and will throw
      an exception if accessed. Activation needs preliminary approval by Product Management.
      Please contact support in this case. Existing customers using these APIs are not
      affected by this change and can use the APIs until further notice.


    **Parameters:**
    - returnItemID - the ID

    **Returns:**
    - the return item associated with the given returnItemID


---

### getReturnItems()
- getReturnItems(): [FilteringCollection](dw.util.FilteringCollection.md)
  - : Returns the collection of [ReturnItem](dw.order.ReturnItem.md)s associated with this order.
      
      
      Order post-processing APIs (gillian) are now inactive by default and will throw
      an exception if accessed. Activation needs preliminary approval by Product Management.
      Please contact support in this case. Existing customers using these APIs are not
      affected by this change and can use the APIs until further notice.


    **Returns:**
    - return items belonging to this order


---

### getReturns()
- getReturns(): [FilteringCollection](dw.util.FilteringCollection.md)
  - : Returns the collection of [Return](dw.order.Return.md)s associated with this order.
      
      
      Order post-processing APIs (gillian) are now inactive by default and will throw
      an exception if accessed. Activation needs preliminary approval by Product Management.
      Please contact support in this case. Existing customers using these APIs are not
      affected by this change and can use the APIs until further notice.


    **Returns:**
    - returns belonging to this order


---

### getShippingOrder(String)
- getShippingOrder(shippingOrderNumber: [String](TopLevel.String.md)): [ShippingOrder](dw.order.ShippingOrder.md)
  - : Returns the [ShippingOrder](dw.order.ShippingOrder.md) associated with this order with the given shippingOrderNumber.
      The method returns `null` if no instance can be found.
      
      
      Order post-processing APIs (gillian) are now inactive by default and will throw
      an exception if accessed. Activation needs preliminary approval by Product Management.
      Please contact support in this case. Existing customers using these APIs are not
      affected by this change and can use the APIs until further notice.


    **Parameters:**
    - shippingOrderNumber - the shipping order number

    **Returns:**
    - the shipping order associated with the given shippingOrderNumber


---

### getShippingOrderItem(String)
- getShippingOrderItem(shippingOrderItemID: [String](TopLevel.String.md)): [ShippingOrderItem](dw.order.ShippingOrderItem.md)
  - : Returns the [ShippingOrderItem](dw.order.ShippingOrderItem.md) associated with this order with the given shippingOrderItemID.
      The method returns `null` if no instance can be found.
      
      
      Order post-processing APIs (gillian) are now inactive by default and will throw
      an exception if accessed. Activation needs preliminary approval by Product Management.
      Please contact support in this case. Existing customers using these APIs are not
      affected by this change and can use the APIs until further notice.


    **Parameters:**
    - shippingOrderItemID - the ID

    **Returns:**
    - the shipping order item associated with the given shippingOrderItemID


---

### getShippingOrderItems()
- getShippingOrderItems(): [FilteringCollection](dw.util.FilteringCollection.md)
  - : Returns the collection of [ShippingOrderItem](dw.order.ShippingOrderItem.md)s associated with this order.
      
      
      Order post-processing APIs (gillian) are now inactive by default and will throw
      an exception if accessed. Activation needs preliminary approval by Product Management.
      Please contact support in this case. Existing customers using these APIs are not
      affected by this change and can use the APIs until further notice.


    **Returns:**
    - shipping order items belonging to this order


---

### getShippingOrders()
- getShippingOrders(): [FilteringCollection](dw.util.FilteringCollection.md)
  - : Returns the collection of [ShippingOrder](dw.order.ShippingOrder.md)s associated with this order.
      
      
      Order post-processing APIs (gillian) are now inactive by default and will throw
      an exception if accessed. Activation needs preliminary approval by Product Management.
      Please contact support in this case. Existing customers using these APIs are not
      affected by this change and can use the APIs until further notice.


    **Returns:**
    - shipping orders belonging to this order


---

### getShippingStatus()
- getShippingStatus(): [EnumValue](dw.value.EnumValue.md)
  - : Returns the order shipping status.
      
      Possible values are [SHIPPING_STATUS_NOTSHIPPED](dw.order.Order.md#shipping_status_notshipped),
      [SHIPPING_STATUS_PARTSHIPPED](dw.order.Order.md#shipping_status_partshipped) or [SHIPPING_STATUS_SHIPPED](dw.order.Order.md#shipping_status_shipped).


    **Returns:**
    - Order shipping status


---

### getSourceCode()
- getSourceCode(): [String](TopLevel.String.md)
  - : Returns the source code stored with the order or `null` if no source code is attached to the order.

    **Returns:**
    - the source code stored with the order or `null` if no source code is attached to the order.


---

### getSourceCodeGroup()
- getSourceCodeGroup(): [SourceCodeGroup](dw.campaign.SourceCodeGroup.md)
  - : Returns the source code group attached to the order or `null` if no source code group is attached to
      the order.


    **Returns:**
    - the source code group attached to the order or `null` if no source code group is attached to
              the order.



---

### getSourceCodeGroupID()
- getSourceCodeGroupID(): [String](TopLevel.String.md)
  - : Returns the source code group id stored with the order or `null` if no source code group is attached
      to the order.


    **Returns:**
    - the source code group id stored with the order or `null` if no source code group is attached
              to the order.



---

### getStatus()
- getStatus(): [EnumValue](dw.value.EnumValue.md)
  - : Returns the status of the order.
      
      Possible values are:
      
      - [ORDER_STATUS_CREATED](dw.order.Order.md#order_status_created)
      - [ORDER_STATUS_NEW](dw.order.Order.md#order_status_new)
      - [ORDER_STATUS_OPEN](dw.order.Order.md#order_status_open)
      - [ORDER_STATUS_COMPLETED](dw.order.Order.md#order_status_completed)
      - [ORDER_STATUS_CANCELLED](dw.order.Order.md#order_status_cancelled)
      - [ORDER_STATUS_FAILED](dw.order.Order.md#order_status_failed)
      - [ORDER_STATUS_REPLACED](dw.order.Order.md#order_status_replaced)
      
      
      
      The order status usually changes when a process action is initiated. Most status changes have an action which
      needs to executed in order to end having the order in a specific order status. When an order is created with e.g.
      [OrderMgr.createOrder(Basket)](dw.order.OrderMgr.md#createorderbasket) the order status will be [ORDER_STATUS_CREATED](dw.order.Order.md#order_status_created). The usual
      flow is that payment authorization will be added to the order. Once the order is considered as valid (payed,
      fraud checked, ...) the order gets placed. This can be done by calling
      [OrderMgr.placeOrder(Order)](dw.order.OrderMgr.md#placeorderorder). The result of placing an order will be status
      [ORDER_STATUS_OPEN](dw.order.Order.md#order_status_open) (from a process standpoint [ORDER_STATUS_NEW](dw.order.Order.md#order_status_new) which has the same meaning).
      Status [ORDER_STATUS_REPLACED](dw.order.Order.md#order_status_replaced) is related to functionality
      [BasketMgr.createBasketFromOrder(Order)](dw.order.BasketMgr.md#createbasketfromorderorder). [ORDER_STATUS_COMPLETED](dw.order.Order.md#order_status_completed) has no meaning by
      default but can be used by custom implementations but is a synonym for NEW/OPEN. Below you will find the most important status changes:
      
      
      
      | Status before | Action | Status after | Business meaning |
      | --- |--- |--- |--- |
      | - | [OrderMgr.createOrder(Basket)](dw.order.OrderMgr.md#createorderbasket) | CREATED | Order was created from a basket. |
      | CREATED | [OrderMgr.placeOrder(Order)](dw.order.OrderMgr.md#placeorderorder) | OPEN/NEW | Order was considered as valid. Order can now be exported to 3rd party systems. |
      | CREATED | [OrderMgr.failOrder(Order)](dw.order.OrderMgr.md#failorderorder) | FAILED | Order was considered not valid. E.g. payment authorization was wrong or fraud check was not successful. |
      | OPEN/NEW | [OrderMgr.cancelOrder(Order)](dw.order.OrderMgr.md#cancelorderorder) | CANCELLED | Order was cancelled. |
      | CANCELLED | [OrderMgr.undoCancelOrder(Order)](dw.order.OrderMgr.md#undocancelorderorder) | OPEN/NEW | Order was cancelled by mistake and this needs to be undone. |
      | FAILED | [OrderMgr.undoFailOrder(Order)](dw.order.OrderMgr.md#undofailorderorder) | CREATED | Order was failed by mistake and this needs to be undone. |
      
      
      Every status change will trigger a change in the order journal which is the base for GMV calculations.


    **Returns:**
    - Status of the order.

    **See Also:**
    - [LineItemCtnr](dw.order.LineItemCtnr.md)


---

### isImported()
- isImported(): [Boolean](TopLevel.Boolean.md)
  - : Returns `true`, if the order is imported and `false`
      otherwise.


    **Returns:**
    - true, if the order was imported, false otherwise.


---

### isTaxRoundedAtGroup()
- isTaxRoundedAtGroup(): [Boolean](TopLevel.Boolean.md)
  - : Use this method to check if the Order was created with grouped taxation calculation.
      
      
      If the tax is rounded on group level, the tax is applied to the summed-up tax basis for each tax rate.


    **Returns:**
    - `true` if the Order was created with grouped taxation


---

### reauthorize()
- reauthorize(): [Status](dw.system.Status.md)
  - : Ensures that the order is authorized.
      
      
      Checks if the order is authorized by calling the hook
      [PaymentHooks.validateAuthorization(Order)](dw.order.hooks.PaymentHooks.md#validateauthorizationorder). If the authorization
      is not valid it reauthorizes the order by calling the
      [PaymentHooks.reauthorize(Order)](dw.order.hooks.PaymentHooks.md#reauthorizeorder).


    **Returns:**
    - the status of the operation, will be Status.OK if the order is
              authorized after this call



---

### removeRemoteHost()
- removeRemoteHost(): void
  - : Removes the IP address of the remote host if stored.
      
      
      If IP logging was enabled during order creation the IP address of the customer will be stored and can be
      retrieved using [getRemoteHost()](dw.order.Order.md#getremotehost).


    **See Also:**
    - [getRemoteHost()](dw.order.Order.md#getremotehost)


---

### setAffiliatePartnerID(String)
- setAffiliatePartnerID(affiliatePartnerID: [String](TopLevel.String.md)): void
  - : Sets the affiliate partner ID value.

    **Parameters:**
    - affiliatePartnerID - the affiliate partner ID value.


---

### setAffiliatePartnerName(String)
- setAffiliatePartnerName(affiliatePartnerName: [String](TopLevel.String.md)): void
  - : Sets the affiliate partner name value.

    **Parameters:**
    - affiliatePartnerName - the affiliate partner name value.


---

### setCancelCode(String)
- setCancelCode(cancelCode: [String](TopLevel.String.md)): void
  - : Sets the cancel code value.

    **Parameters:**
    - cancelCode - the cancel code value.


---

### setCancelDescription(String)
- setCancelDescription(cancelDescription: [String](TopLevel.String.md)): void
  - : Sets the description as to why the order was cancelled.

    **Parameters:**
    - cancelDescription - the description for why the order was cancelled.


---

### setConfirmationStatus(Number)
- setConfirmationStatus(status: [Number](TopLevel.Number.md)): void
  - : Sets the confirmation status value.
      
      Possible values are [CONFIRMATION_STATUS_NOTCONFIRMED](dw.order.Order.md#confirmation_status_notconfirmed) or
      [CONFIRMATION_STATUS_CONFIRMED](dw.order.Order.md#confirmation_status_confirmed).


    **Parameters:**
    - status - Order confirmation status


---

### setCustomer(Customer)
- setCustomer(customer: [Customer](dw.customer.Customer.md)): void
  - : This method is used to associate the order object with the specified customer object.
      
      
      If the customer object represents a registered customer, the order will be assigned
      to this registered customer and the order's customer number
      ([LineItemCtnr.getCustomerNo()](dw.order.LineItemCtnr.md#getcustomerno)) will be updated.
      
      
      If the customer object represents an unregistered (anonymous) customer, the
      order will become an anonymous order and the order's customer number
      will be set to null.


    **Parameters:**
    - customer - The customer to be associated with the order.

    **Throws:**
    - NullArgumentException - If specified customer is null.


---

### setCustomerNo(String)
- setCustomerNo(customerNo: [String](TopLevel.String.md)): void
  - : Sets the customer number associated with this order.
      
      
      Note it is recommended to use ([setCustomer(Customer)](dw.order.Order.md#setcustomercustomer)) instead of this method. This method
      only sets the customer number and should be used with care as it does _not re-link the order with a customer
       profile</> object which can lead to an inconsistency! Ensure that the customer number used is not already taken
       by a different customer profile.


    **Parameters:**
    - customerNo - the customer number associated with this order.


---

### setCustomerOrderReference(String)
- setCustomerOrderReference(reference: [String](TopLevel.String.md)): void
  - : Sets the customer-specific reference information for the order.

    **Parameters:**
    - reference - the customer-specific reference information for the order.


---

### setExportAfter(Date)
- setExportAfter(date: [Date](TopLevel.Date.md)): void
  - : Sets the date after which an order can be exported.

    **Parameters:**
    - date - the date after which an order can be exported.


---

### setExportStatus(Number)
- setExportStatus(status: [Number](TopLevel.Number.md)): void
  - : Sets the export status of the order.
      
      Possible values are: [EXPORT_STATUS_NOTEXPORTED](dw.order.Order.md#export_status_notexported), [EXPORT_STATUS_EXPORTED](dw.order.Order.md#export_status_exported),
      [EXPORT_STATUS_READY](dw.order.Order.md#export_status_ready), and [EXPORT_STATUS_FAILED](dw.order.Order.md#export_status_failed).
      
      
      Setting the status to [EXPORT_STATUS_EXPORTED](dw.order.Order.md#export_status_exported) will also trigger the finalization of on order inventory
      transactions for this order meaning that all inventory transactions with type on order will be moved into final
      inventory transactions. This is only relevant when On Order Inventory is turned on for the inventory list ordered
      products are in.
      
      
      
      
      In case of an exception the current transaction is marked as rollback only.


    **Parameters:**
    - status - Order export status


---

### setExternalOrderNo(String)
- setExternalOrderNo(externalOrderNo: [String](TopLevel.String.md)): void
  - : Sets the value of an external order number associated
      with this order


    **Parameters:**
    - externalOrderNo - the value of an external order number associated  with this order.


---

### setExternalOrderStatus(String)
- setExternalOrderStatus(status: [String](TopLevel.String.md)): void
  - : Sets the status of an external order associated
      with this order


    **Parameters:**
    - status - the status of the external order.


---

### setExternalOrderText(String)
- setExternalOrderText(text: [String](TopLevel.String.md)): void
  - : Sets the text describing the external order.

    **Parameters:**
    - text - the text describing the external order.


---

### setInvoiceNo(String)
- setInvoiceNo(invoiceNumber: [String](TopLevel.String.md)): void
  - : Sets the invoice number for this Order.
      
      
      Notice that this value might be overwritten during order placement (e.g. with [OrderMgr.placeOrder(Order)](dw.order.OrderMgr.md#placeorderorder)).


    **Parameters:**
    - invoiceNumber - the invoice number for this Order.

    **See Also:**
    - [getInvoiceNo()](dw.order.Order.md#getinvoiceno)


---

### setOrderStatus(Number)
- ~~setOrderStatus(status: [Number](TopLevel.Number.md)): void~~
  - : Sets the order status.
      
      
      Use this method when using Order Post Processing such as the creation of [shipping  orders](dw.order.ShippingOrder.md). The only supported values are [ORDER_STATUS_OPEN](dw.order.Order.md#order_status_open), [ORDER_STATUS_CANCELLED](dw.order.Order.md#order_status_cancelled). Setting the
      status will adjust the order item status when applicable (item status not SHIPPED or CANCELLED). Note that the
      order status and the status of the items are directly related and dependent on one another.
      
      
      See [OrderItem.setStatus(String)](dw.order.OrderItem.md#setstatusstring) for more information about possible status transitions.
      
      
      Warning: This method will _not_ undo coupon redemptions upon cancellation of an order. Re-opening such an
      order later with [OrderMgr.undoCancelOrder(Order)](dw.order.OrderMgr.md#undocancelorderorder) or [OrderItem.setStatus(String)](dw.order.OrderItem.md#setstatusstring)
      with [ORDER_STATUS_OPEN](dw.order.Order.md#order_status_open) will result in an additional application of the same coupon code which in turn
      might fail.
      
      
      Order post-processing APIs (gillian) are now inactive by default and will throw
      an exception if accessed. Activation needs preliminary approval by Product Management.
      Please contact support in this case. Existing customers using these APIs are not
      affected by this change and can use the APIs until further notice.


    **Parameters:**
    - status - the status to be set, use one of:                          <li>[ORDER_STATUS_OPEN](dw.order.Order.md#order_status_open)</li>             <li>[ORDER_STATUS_CANCELLED](dw.order.Order.md#order_status_cancelled)</li>             </ul>

    **Throws:**
    - IllegalArgumentException - on attempt to set an unsupported status value

    **Deprecated:**
:::warning
use [setStatus(Number)](dw.order.Order.md#setstatusnumber) instead
:::

---

### setPaymentStatus(Number)
- setPaymentStatus(status: [Number](TopLevel.Number.md)): void
  - : Sets the order payment status.
      
      Possible values are [PAYMENT_STATUS_NOTPAID](dw.order.Order.md#payment_status_notpaid), [PAYMENT_STATUS_PARTPAID](dw.order.Order.md#payment_status_partpaid)
      or [PAYMENT_STATUS_PAID](dw.order.Order.md#payment_status_paid).


    **Parameters:**
    - status - Order payment status


---

### setReplaceCode(String)
- setReplaceCode(replaceCode: [String](TopLevel.String.md)): void
  - : Sets the value of the replace code.

    **Parameters:**
    - replaceCode - the value of the replace code.


---

### setReplaceDescription(String)
- setReplaceDescription(replaceDescription: [String](TopLevel.String.md)): void
  - : Sets the value of the replace description.

    **Parameters:**
    - replaceDescription - the value of the replace description.


---

### setShippingStatus(Number)
- setShippingStatus(status: [Number](TopLevel.Number.md)): void
  - : Sets the order shipping status value.
      
      Possible values are [SHIPPING_STATUS_NOTSHIPPED](dw.order.Order.md#shipping_status_notshipped),
      [SHIPPING_STATUS_PARTSHIPPED](dw.order.Order.md#shipping_status_partshipped) or [SHIPPING_STATUS_SHIPPED](dw.order.Order.md#shipping_status_shipped).


    **Parameters:**
    - status - Order shipping status


---

### setStatus(Number)
- setStatus(status: [Number](TopLevel.Number.md)): void
  - : Sets the status of the order.
      
      
      Possible values are:
      
      - [ORDER_STATUS_NEW](dw.order.Order.md#order_status_new)
      - [ORDER_STATUS_OPEN](dw.order.Order.md#order_status_open)
      - [ORDER_STATUS_COMPLETED](dw.order.Order.md#order_status_completed)
      - [ORDER_STATUS_CANCELLED](dw.order.Order.md#order_status_cancelled)
      - [ORDER_STATUS_REPLACED](dw.order.Order.md#order_status_replaced)
      
      This method does not support order statuses [ORDER_STATUS_CREATED](dw.order.Order.md#order_status_created) or [ORDER_STATUS_FAILED](dw.order.Order.md#order_status_failed). Please
      use [OrderMgr.placeOrder(Order)](dw.order.OrderMgr.md#placeorderorder) or [OrderMgr.failOrder(Order)](dw.order.OrderMgr.md#failorderorder).
      
      
      Setting the order status to [ORDER_STATUS_CANCELLED](dw.order.Order.md#order_status_cancelled) will have the same effect as calling
      [OrderMgr.cancelOrder(Order)](dw.order.OrderMgr.md#cancelorderorder). Setting a canceled order to [ORDER_STATUS_NEW](dw.order.Order.md#order_status_new),
      [ORDER_STATUS_OPEN](dw.order.Order.md#order_status_open) or [ORDER_STATUS_COMPLETED](dw.order.Order.md#order_status_completed) will have the same effect as calling
      [OrderMgr.undoCancelOrder(Order)](dw.order.OrderMgr.md#undocancelorderorder). It is recommended to use the methods in
      [OrderMgr](dw.order.OrderMgr.md) directly to be able to do error processing with the return code.


    **Parameters:**
    - status - Order status

    **Throws:**
    - IllegalArgumentException - on attempt to set status CREATED or FAILED, or status transition while cancel              order or undo cancel order returns with an error code.


---

### trackOrderChange(String)
- trackOrderChange(text: [String](TopLevel.String.md)): [Note](dw.object.Note.md)
  - : Tracks an order change.
      
      
      This adds a history entry to the order. Focus of history entries are changes through business logic, both custom
      and internal logic. Tracked order changes are read-only and can be accessed in the Business Manager order
      history. The following attributes of the created [history entry](dw.object.Note.md) are initialized:
      
      - [Note.getCreatedBy()](dw.object.Note.md#getcreatedby)gets the current user assigned
      - [Note.getCreationDate()](dw.object.Note.md#getcreationdate)gets the current date assigned
      
      
      
      
      
      This feature is intended to track important changes in custom order flow which should become visible in Business
      Manager's history tab. It is NOT intended as auditing feature for every change to an order. A warning will be
      produced after 600 notes are added to an order. The warning can be reviewed in Business Manager's Quota Status
      screen. Attempting to add a note to an order which already has 1000 notes results in an exception. Please bear in
      mind that internal changes, such as order status changes, also track changes. Avoid using this feature in
      recurring jobs which may re-process orders multiple times as the limit needs to be considered each time a change
      is tracked. The same limit on the number of notes added also applies when using method
      [LineItemCtnr.addNote(String, String)](dw.order.LineItemCtnr.md#addnotestring-string) to add notes.


    **Parameters:**
    - text - the text of the history entry

    **Returns:**
    - the created history entry


---

<!-- prettier-ignore-end -->
