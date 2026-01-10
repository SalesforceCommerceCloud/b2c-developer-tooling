<!-- prettier-ignore-start -->
# Class PaymentHooks

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.order.hooks.PaymentHooks](dw.order.hooks.PaymentHooks.md)

This interface represents all script hooks that can be registered to
customize the order center payment functionality. It contains the extension
points (hook names), and the functions that are called by each extension
point. A function must be defined inside a JavaScript source and must be
exported. The script with the exported hook function must be located inside a
site cartridge. Inside the site cartridge a 'package.json' file with a
'hooks' entry must exist.


"hooks": "./hooks.json"


The hooks entry links to a json file, relative to the 'package.json' file.
This file lists all registered hooks inside the hooks property:




```
"hooks": [
     {"name": "dw.order.payment.authorize", "script": "./authorize.js"},
     {"name": "dw.order.payment.validateAuthorization", "script": "./validateAuthorization.js"},
]
```




A hook entry has a 'name' and a 'script' property.

- The 'name' contains the extension point, the hook name.
- The 'script' contains the script relative to the hooks file, with the  exported hook function.



## Constant Summary

| Constant | Description |
| --- | --- |
| [extensionPointAuthorize](#extensionpointauthorize): [String](TopLevel.String.md) = "dw.order.payment.authorize" | The extension point name dw.order.payment.authorize. |
| [extensionPointAuthorizeCreditCard](#extensionpointauthorizecreditcard): [String](TopLevel.String.md) = "dw.order.payment.authorizeCreditCard" | The extension point name dw.order.payment.authorizeCreditCard. |
| [extensionPointCapture](#extensionpointcapture): [String](TopLevel.String.md) = "dw.order.payment.capture" | The extension point name dw.order.payment.capture. |
| [extensionPointReauthorize](#extensionpointreauthorize): [String](TopLevel.String.md) = "dw.order.payment.reauthorize" | The extension point name dw.order.payment.reauthorize. |
| [extensionPointRefund](#extensionpointrefund): [String](TopLevel.String.md) = "dw.order.payment.refund" | The extension point name dw.order.payment.refund. |
| [extensionPointReleaseAuthorization](#extensionpointreleaseauthorization): [String](TopLevel.String.md) = "dw.order.payment.releaseAuthorization" | The extension point name dw.order.payment.releaseAuthorization. |
| [extensionPointValidateAuthorization](#extensionpointvalidateauthorization): [String](TopLevel.String.md) = "dw.order.payment.validateAuthorization" | The extension point name dw.order.payment.validateAuthorization. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [authorize](dw.order.hooks.PaymentHooks.md#authorizeorder-orderpaymentinstrument)([Order](dw.order.Order.md), [OrderPaymentInstrument](dw.order.OrderPaymentInstrument.md)) | The function is called by extension point [extensionPointAuthorize](dw.order.hooks.PaymentHooks.md#extensionpointauthorize). |
| [authorizeCreditCard](dw.order.hooks.PaymentHooks.md#authorizecreditcardorder-orderpaymentinstrument-string)([Order](dw.order.Order.md), [OrderPaymentInstrument](dw.order.OrderPaymentInstrument.md), [String](TopLevel.String.md)) | The function is called by extension point  [extensionPointAuthorizeCreditCard](dw.order.hooks.PaymentHooks.md#extensionpointauthorizecreditcard). |
| [capture](dw.order.hooks.PaymentHooks.md#captureinvoice)([Invoice](dw.order.Invoice.md)) | The function is called by extension point [extensionPointCapture](dw.order.hooks.PaymentHooks.md#extensionpointcapture). |
| [reauthorize](dw.order.hooks.PaymentHooks.md#reauthorizeorder)([Order](dw.order.Order.md)) | The function is called by extension point [extensionPointReauthorize](dw.order.hooks.PaymentHooks.md#extensionpointreauthorize). |
| [refund](dw.order.hooks.PaymentHooks.md#refundinvoice)([Invoice](dw.order.Invoice.md)) | The function is called by extension point [extensionPointRefund](dw.order.hooks.PaymentHooks.md#extensionpointrefund). |
| [releaseAuthorization](dw.order.hooks.PaymentHooks.md#releaseauthorizationorder)([Order](dw.order.Order.md)) | The function is called by extension point [extensionPointReleaseAuthorization](dw.order.hooks.PaymentHooks.md#extensionpointreleaseauthorization). |
| [validateAuthorization](dw.order.hooks.PaymentHooks.md#validateauthorizationorder)([Order](dw.order.Order.md)) | The function is called by extension point [extensionPointValidateAuthorization](dw.order.hooks.PaymentHooks.md#extensionpointvalidateauthorization). |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### extensionPointAuthorize

- extensionPointAuthorize: [String](TopLevel.String.md) = "dw.order.payment.authorize"
  - : The extension point name dw.order.payment.authorize.
      
       This hook is optional.



---

### extensionPointAuthorizeCreditCard

- extensionPointAuthorizeCreditCard: [String](TopLevel.String.md) = "dw.order.payment.authorizeCreditCard"
  - : The extension point name dw.order.payment.authorizeCreditCard.
      
       This hook is optional.



---

### extensionPointCapture

- extensionPointCapture: [String](TopLevel.String.md) = "dw.order.payment.capture"
  - : The extension point name dw.order.payment.capture.


---

### extensionPointReauthorize

- extensionPointReauthorize: [String](TopLevel.String.md) = "dw.order.payment.reauthorize"
  - : The extension point name dw.order.payment.reauthorize.


---

### extensionPointRefund

- extensionPointRefund: [String](TopLevel.String.md) = "dw.order.payment.refund"
  - : The extension point name dw.order.payment.refund.


---

### extensionPointReleaseAuthorization

- extensionPointReleaseAuthorization: [String](TopLevel.String.md) = "dw.order.payment.releaseAuthorization"
  - : The extension point name dw.order.payment.releaseAuthorization.


---

### extensionPointValidateAuthorization

- extensionPointValidateAuthorization: [String](TopLevel.String.md) = "dw.order.payment.validateAuthorization"
  - : The extension point name dw.order.payment.validateAuthorization.


---

## Method Details

### authorize(Order, OrderPaymentInstrument)
- authorize(order: [Order](dw.order.Order.md), paymentDetails: [OrderPaymentInstrument](dw.order.OrderPaymentInstrument.md)): [Status](dw.system.Status.md)
  - : The function is called by extension point [extensionPointAuthorize](dw.order.hooks.PaymentHooks.md#extensionpointauthorize). Custom payment authorization - modify the
      order as needed.
      
      
      - Prerequisite: An order has been created using the data api or via the storefront.
      - Return Status.OK: Corresponding payment transaction is marked as authorized (usually a custom property is used for this).
      - Return Status.ERROR: Order is held, authorization needs to be repeated.


    **Parameters:**
    - order - the order
    - paymentDetails - specified payment details

    **Returns:**
    - 
      - Status.OK successful authorization.
      - Status.ERROR authorization failed.



---

### authorizeCreditCard(Order, OrderPaymentInstrument, String)
- authorizeCreditCard(order: [Order](dw.order.Order.md), paymentDetails: [OrderPaymentInstrument](dw.order.OrderPaymentInstrument.md), cvn: [String](TopLevel.String.md)): [Status](dw.system.Status.md)
  - : The function is called by extension point
      [extensionPointAuthorizeCreditCard](dw.order.hooks.PaymentHooks.md#extensionpointauthorizecreditcard). Custom payment authorization
      of a credit card - modify the order as needed.
      
      
      
      - Prerequisite: An order has been created using the data api or via the  storefront.
      - Return Status.OK: Corresponding payment transaction is marked as  authorized (usually a custom property is used for this).
      - Return Status.ERROR: Order is held, authorization needs to be  repeated.


    **Parameters:**
    - order - the order
    - paymentDetails - specified payment details
    - cvn - the credit card verification number

    **Returns:**
    - 
      - Status.OK successful authorization.
      - Status.ERROR          authorization failed.



---

### capture(Invoice)
- capture(invoice: [Invoice](dw.order.Invoice.md)): [Status](dw.system.Status.md)
  - : The function is called by extension point [extensionPointCapture](dw.order.hooks.PaymentHooks.md#extensionpointcapture). Custom payment capture - modify the order as needed.
      
      
      
      - Prerequisite:  
      \[ either \] As a result of shipping (or part-shipping) a shipping -order the warehouse updates the status of the shipping-order  resulting in the creation of an unpaid debit invoice (the creation of the invoice is usually handled in  [ShippingOrderHooks.changeStatus(ShippingOrder, ShippingOrderWO)](dw.order.hooks.ShippingOrderHooks.md#changestatusshippingorder-shippingorderwo)).  
      \[ or \] A unpaid debit invoice has been created using the data api. 
      - Context: An unpaid debit invoice is passed to the payment system for capture. The capture attempt can either succeed (complete  invoice amount captured) or fail. As a result the invoice status is updated by ordercenter for further processing. See [Invoice](dw.order.Invoice.md).
      - Hook responsibility: The hook should attempt to capture the amount located in invoice.grandTotal.grossPrice. When successful,  the capture hook should also update the invoice by calling  [Invoice.addCaptureTransaction(OrderPaymentInstrument, Money)](dw.order.Invoice.md#addcapturetransactionorderpaymentinstrument-money)which serves to record the capturedAmount and associate the invoice with the payment-transaction.
      - Return Status.OK: Indicates capture succeeded: Order Center sets the Invoice status to [Invoice.STATUS_PAID](dw.order.Invoice.md#status_paid).
      - Return Status.ERROR: Indicates capture failed: Order Center sets the Invoice status to [Invoice.STATUS_FAILED](dw.order.Invoice.md#status_failed)for  further processing.
      - Post processing:  When the capture hook returns with success, order center not only sets the relevant invoice status, but also  sets the relevant capturedAmount values on the invoice item. Returning success means the entire invoice total has been captured, so each item  within the invoice can also be marked as completely captured. Note the script implementing the hook can take responsibility for this if desired  order center will not overwrite existing values, but normally the standard implementation fits. As a result each invoice item and the related  order item can return a capturedAmount, useful for calculating possible refunds. 


    **Parameters:**
    - invoice - the invoice

    **Returns:**
    - 
      - Status.OK for successful capture of entire invoice amount.
      - Status.ERROR capture failed



---

### reauthorize(Order)
- reauthorize(order: [Order](dw.order.Order.md)): [Status](dw.system.Status.md)
  - : The function is called by extension point [extensionPointReauthorize](dw.order.hooks.PaymentHooks.md#extensionpointreauthorize). Custom payment authorization - modify the
      order as needed.
      
      
      - Prerequisite:  
      \[ either \] Based on a selected [Order](dw.order.Order.md), a [ShippingOrder](dw.order.ShippingOrder.md)(which represents the whole or part of the order which can be shipped)  is to be created ready for export to the warehouse system.  
      \[ or \] A [ShippingOrder](dw.order.ShippingOrder.md)is to be directly created using the data api.
      - Context: The related order is passed to the payment hook to check its authorization has not become invalid. Two hooks are called:  
      a. [validateAuthorization(Order)](dw.order.hooks.PaymentHooks.md#validateauthorizationorder)is used to check the orders authorization is still valid  
      b. [reauthorize(Order)](dw.order.hooks.PaymentHooks.md#reauthorizeorder)is called if step a. returns Error  
      - Return Status.OK: Corresponding payment transaction is marked as authorized (usually a custom property is used for this).  If the order had been previously authorized, the custom property values may be overwritten during reauthorization.
      - Return Status.ERROR: Order is held, authorization needs to be repeated.


    **Parameters:**
    - order - the order

    **Returns:**
    - 
      - Status.OK successful authorization.
      - Status.ERROR authorization failed



---

### refund(Invoice)
- refund(invoice: [Invoice](dw.order.Invoice.md)): [Status](dw.system.Status.md)
  - : The function is called by extension point [extensionPointRefund](dw.order.hooks.PaymentHooks.md#extensionpointrefund). Custom payment refund - modify the order as needed.
      
      
      
      - Prerequisite:  
      \[ either \] Goods returned by the customer result in the creation of one or more return documents, resulting in the creation of an  unpaid customer credit invoice (the creation of the invoice is usually handled in [ReturnHooks.changeStatus(Return, ReturnWO)](dw.order.hooks.ReturnHooks.md#changestatusreturn-returnwo)).  
      \[ or \] An unpaid customer credit invoice is created using the data api (perhaps as a result of the creation of a customer appeasement).
      - Context: An unpaid credit invoice is passed to the payment system for refund. The refund attempt can either succeed (complete  invoice amount refunded) or fail. As a result the invoice status is updated by ordercenter for further processing. See [Invoice](dw.order.Invoice.md).
      - Hook responsibility: The hook should attempt to refund the amount located in invoice.grandTotal.grossPrice. When successful,  the refund hook should also update the invoice by calling  [Invoice.addRefundTransaction(OrderPaymentInstrument, Money)](dw.order.Invoice.md#addrefundtransactionorderpaymentinstrument-money)which serves to record the refundedAmount and associate the invoice with the payment-transaction.
      - Return Status.OK: Indicates refund succeeded: Order Center sets the Invoice status to [Invoice.STATUS_PAID](dw.order.Invoice.md#status_paid).
      - Return Status.ERROR: Indicates refund failed: Order Center sets the Invoice status to [Invoice.STATUS_FAILED](dw.order.Invoice.md#status_failed)for  further processing.
      - Post processing:  When the refund hook returns with success, order center not only sets the relevant invoice status, but also  sets the relevant refundAmount values on the invoice item. Returning success means the entire invoice total has been refunded, so each item  within the invoice can also be marked as completely refunded. Note the script implementing the hook can take responsibility for this if desired  order center will not overwrite existing values, but normally the standard implementation fits. As a result each invoice item and the related  order item can return a refundedAmount, useful for calculating further possible refunds. 


    **Parameters:**
    - invoice - the invoice

    **Returns:**
    - 
      - Status.OK for successful refund of entire invoice amount.
      - Status.ERROR refund failed



---

### releaseAuthorization(Order)
- releaseAuthorization(order: [Order](dw.order.Order.md)): [Status](dw.system.Status.md)
  - : The function is called by extension point [extensionPointReleaseAuthorization](dw.order.hooks.PaymentHooks.md#extensionpointreleaseauthorization).
      Custom payment release authorization - modify the order as needed.
      
      
      
      - Prerequisite: an authorized order is updated resulting in a need to release the remaining authorization. This happens when:  
      - order is cancelled  
      - order is complete after remaining order items are cancelled.
      - Return Status.OK - successful release authorization 
      - Return Status.ERROR - failed release authorization 


    **Parameters:**
    - order - the order

    **Returns:**
    - 
      - Status.OK for successful release authorization.
      - Status.ERROR failed release authorization



---

### validateAuthorization(Order)
- validateAuthorization(order: [Order](dw.order.Order.md)): [Status](dw.system.Status.md)
  - : The function is called by extension point [extensionPointValidateAuthorization](dw.order.hooks.PaymentHooks.md#extensionpointvalidateauthorization). Custom payment authorization - modify the
      order as needed.
      
      
      - Context: This hook is called to validate whether a payment authorization exists for the order. It should usually check:  
      - Whether the authorize or reauthorize hook was previously successfully executed for the order, e.g. by checking whether custom property has been previously set.  
      - Whether an existing authorization has expired e.g. by comparing a timestamp set on authorization with the current time.
      - Return Status.OK: indicates the order has a valid payment authorization.
      - Return Status.ERROR: indicates [reauthorize(Order)](dw.order.hooks.PaymentHooks.md#reauthorizeorder)should be called.
      See [reauthorize(Order)](dw.order.hooks.PaymentHooks.md#reauthorizeorder) for more details.


    **Parameters:**
    - order - the order

    **Returns:**
    - 
      - Status.OK order has a valid payment authorization.
      - Status.ERROR order has no valid payment authorization, [reauthorize(Order)](dw.order.hooks.PaymentHooks.md#reauthorizeorder)should be called



---

<!-- prettier-ignore-end -->
