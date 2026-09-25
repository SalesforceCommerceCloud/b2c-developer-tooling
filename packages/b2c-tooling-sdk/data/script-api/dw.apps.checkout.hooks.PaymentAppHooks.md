<!-- prettier-ignore-start -->
# Class PaymentAppHooks

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.apps.checkout.hooks.PaymentAppHooks](dw.apps.checkout.hooks.PaymentAppHooks.md)

This interface defines Commerce App hook extension points for the payment domain.


These hooks provide integration points for payment Commerce Apps installed via the Commerce App framework. They are
called by the platform during SCAPI basket and order operations when a payment Commerce App is registered for the
relevant payment method.




**IMPORTANT:** These hooks should **only** be implemented and registered by Commerce Apps
(applications installed via the Commerce App framework with a CAP file). They are not intended for custom merchant
cartridges.




Hook Registration A function must be defined inside a JavaScript source and must be exported. The script
with the exported hook function must be located inside a site cartridge. Inside the site cartridge a
`package.json` file with a 'hooks' entry must exist:




```
"hooks": "./hooks.json"
```



The hooks entry links to a JSON file, relative to the `package.json` file:




```
"hooks": [
   {"name": "sfcc.app.payment.getClaimedPaymentMethods", "script": "./paymentHooks.js"},
   {"name": "sfcc.app.payment.afterCreateBasketPaymentInstrument", "script": "./paymentHooks.js"},
   {"name": "sfcc.app.payment.afterUpdateBasketPaymentInstrument", "script": "./paymentHooks.js"},
   {"name": "sfcc.app.payment.afterCreateOrderPaymentInstrument", "script": "./paymentHooks.js"},
   {"name": "sfcc.app.payment.afterUpdateOrderPaymentInstrument", "script": "./paymentHooks.js"},
   {"name": "sfcc.app.payment.onAttemptOrderTransition", "script": "./paymentHooks.js"},
   {"name": "sfcc.app.payment.reversePayment", "script": "./paymentHooks.js"},
   {"name": "sfcc.app.payment.authorizePayment", "script": "./paymentHooks.js"},
   {"name": "sfcc.app.payment.cancelAuthorization", "script": "./paymentHooks.js"},
   {"name": "sfcc.app.payment.capturePayment", "script": "./paymentHooks.js"},
   {"name": "sfcc.app.payment.refundCapture", "script": "./paymentHooks.js"}
]
```



A hook entry has a `name` and a `script` property:



- The `name`contains the extension point name (the hook name).
- The `script`contains the script path relative to the hooks file, with the exported hook function.



**Function Naming Convention:** The exported JavaScript function name must match the last segment of the
extension point name: `afterCreateBasketPaymentInstrument`.




Transaction Semantics All write hooks execute within the platform's transaction boundary. If a hook returns
`Status.ERROR`, the platform rolls back the current operation. If a hook throws an uncaught exception, the
platform treats it as an error and rolls back.




Hook Precedence



- When a Commerce App claims the payment method for a payment instrument, these hooks take precedence over  `dw.order.payment.\*`hooks.
- If no Commerce App claims the payment method, the platform falls back to the standard behavior.



## Constant Summary

| Constant | Description |
| --- | --- |
| [extensionPointAfterCreateBasketPaymentInstrument](#extensionpointaftercreatebasketpaymentinstrument): [String](TopLevel.String.md) = "sfcc.app.payment.afterCreateBasketPaymentInstrument" | The extension point name sfcc.app.payment.afterCreateBasketPaymentInstrument. |
| [extensionPointAfterCreateOrderPaymentInstrument](#extensionpointaftercreateorderpaymentinstrument): [String](TopLevel.String.md) = "sfcc.app.payment.afterCreateOrderPaymentInstrument" | The extension point name sfcc.app.payment.afterCreateOrderPaymentInstrument. |
| [extensionPointAfterUpdateBasketPaymentInstrument](#extensionpointafterupdatebasketpaymentinstrument): [String](TopLevel.String.md) = "sfcc.app.payment.afterUpdateBasketPaymentInstrument" | The extension point name sfcc.app.payment.afterUpdateBasketPaymentInstrument. |
| [extensionPointAfterUpdateOrderPaymentInstrument](#extensionpointafterupdateorderpaymentinstrument): [String](TopLevel.String.md) = "sfcc.app.payment.afterUpdateOrderPaymentInstrument" | The extension point name sfcc.app.payment.afterUpdateOrderPaymentInstrument. |
| [extensionPointAuthorizePayment](#extensionpointauthorizepayment): [String](TopLevel.String.md) = "sfcc.app.payment.authorizePayment" | The extension point name sfcc.app.payment.authorizePayment. |
| [extensionPointCancelAuthorization](#extensionpointcancelauthorization): [String](TopLevel.String.md) = "sfcc.app.payment.cancelAuthorization" | The extension point name sfcc.app.payment.cancelAuthorization. |
| [extensionPointCapturePayment](#extensionpointcapturepayment): [String](TopLevel.String.md) = "sfcc.app.payment.capturePayment" | The extension point name sfcc.app.payment.capturePayment. |
| [extensionPointGetClaimedPaymentMethods](#extensionpointgetclaimedpaymentmethods): [String](TopLevel.String.md) = "sfcc.app.payment.getClaimedPaymentMethods" | The extension point name sfcc.app.payment.getClaimedPaymentMethods. |
| [extensionPointOnAttemptOrderTransition](#extensionpointonattemptordertransition): [String](TopLevel.String.md) = "sfcc.app.payment.onAttemptOrderTransition" | The extension point name sfcc.app.payment.onAttemptOrderTransition. |
| [extensionPointRefundCapture](#extensionpointrefundcapture): [String](TopLevel.String.md) = "sfcc.app.payment.refundCapture" | The extension point name sfcc.app.payment.refundCapture. |
| [extensionPointReversePayment](#extensionpointreversepayment): [String](TopLevel.String.md) = "sfcc.app.payment.reversePayment" | The extension point name sfcc.app.payment.reversePayment. |

## Property Summary

| Property | Description |
| --- | --- |
| [claimedPaymentMethods](#claimedpaymentmethods): [String\[\]](TopLevel.String.md) `(read-only)` | Called to retrieve the list of payment method IDs that this payment Commerce App claims. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [afterCreateBasketPaymentInstrument](dw.apps.checkout.hooks.PaymentAppHooks.md#aftercreatebasketpaymentinstrumentbasket-orderpaymentinstrument-basketpaymentinstrumentrequestwo)([Basket](dw.order.Basket.md), [OrderPaymentInstrument](dw.order.OrderPaymentInstrument.md), BasketPaymentInstrumentRequestWO) | Called after a new claimed payment instrument is created on a basket. |
| [afterCreateOrderPaymentInstrument](dw.apps.checkout.hooks.PaymentAppHooks.md#aftercreateorderpaymentinstrumentorder-orderpaymentinstrument-orderpaymentinstrumentrequestwo)([Order](dw.order.Order.md), [OrderPaymentInstrument](dw.order.OrderPaymentInstrument.md), OrderPaymentInstrumentRequestWO) | Called after an order payment instrument is created for a claimed payment method directly on an existing order  via the SCAPI POST order-payment-instruments endpoint. |
| [afterUpdateBasketPaymentInstrument](dw.apps.checkout.hooks.PaymentAppHooks.md#afterupdatebasketpaymentinstrumentbasket-orderpaymentinstrument-basketpaymentinstrumentrequestwo)([Basket](dw.order.Basket.md), [OrderPaymentInstrument](dw.order.OrderPaymentInstrument.md), BasketPaymentInstrumentRequestWO) | Called after a claimed payment instrument is updated on a basket. |
| [afterUpdateOrderPaymentInstrument](dw.apps.checkout.hooks.PaymentAppHooks.md#afterupdateorderpaymentinstrumentorder-orderpaymentinstrument-orderpaymentinstrumentrequestwo)([Order](dw.order.Order.md), [OrderPaymentInstrument](dw.order.OrderPaymentInstrument.md), OrderPaymentInstrumentRequestWO) | Called when a claimed payment instrument is updated on an order. |
| [authorizePayment](dw.apps.checkout.hooks.PaymentAppHooks.md#authorizepaymentorder-orderpaymentinstrument)([Order](dw.order.Order.md), [OrderPaymentInstrument](dw.order.OrderPaymentInstrument.md)) | <p>  Called to authorize payment for a payment instrument. |
| [cancelAuthorization](dw.apps.checkout.hooks.PaymentAppHooks.md#cancelauthorizationorder-orderpaymentinstrument)([Order](dw.order.Order.md), [OrderPaymentInstrument](dw.order.OrderPaymentInstrument.md)) | <p>  Called to void or cancel the authorization for a payment instrument. |
| [capturePayment](dw.apps.checkout.hooks.PaymentAppHooks.md#capturepaymentorder-orderpaymentinstrument)([Order](dw.order.Order.md), [OrderPaymentInstrument](dw.order.OrderPaymentInstrument.md)) | <p>  Called to capture a previous payment authorization. |
| [getClaimedPaymentMethods](dw.apps.checkout.hooks.PaymentAppHooks.md#getclaimedpaymentmethods)() | Called to retrieve the list of payment method IDs that this payment Commerce App claims. |
| [onAttemptOrderTransition](dw.apps.checkout.hooks.PaymentAppHooks.md#onattemptordertransitionorder-orderpaymentinstrument)([Order](dw.order.Order.md), [OrderPaymentInstrument](dw.order.OrderPaymentInstrument.md)) | Called for each claimed order payment instrument during an order-transition attempt. |
| [refundCapture](dw.apps.checkout.hooks.PaymentAppHooks.md#refundcaptureorder-orderpaymentinstrument)([Order](dw.order.Order.md), [OrderPaymentInstrument](dw.order.OrderPaymentInstrument.md)) | <p>  Called to refund a previously captured payment. |
| [reversePayment](dw.apps.checkout.hooks.PaymentAppHooks.md#reversepaymentorder-orderpaymentinstrument)([Order](dw.order.Order.md), [OrderPaymentInstrument](dw.order.OrderPaymentInstrument.md)) | Called to void or refund the payment for a claimed payment instrument. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### extensionPointAfterCreateBasketPaymentInstrument

- extensionPointAfterCreateBasketPaymentInstrument: [String](TopLevel.String.md) = "sfcc.app.payment.afterCreateBasketPaymentInstrument"
  - : The extension point name sfcc.app.payment.afterCreateBasketPaymentInstrument.


---

### extensionPointAfterCreateOrderPaymentInstrument

- extensionPointAfterCreateOrderPaymentInstrument: [String](TopLevel.String.md) = "sfcc.app.payment.afterCreateOrderPaymentInstrument"
  - : The extension point name sfcc.app.payment.afterCreateOrderPaymentInstrument.


---

### extensionPointAfterUpdateBasketPaymentInstrument

- extensionPointAfterUpdateBasketPaymentInstrument: [String](TopLevel.String.md) = "sfcc.app.payment.afterUpdateBasketPaymentInstrument"
  - : The extension point name sfcc.app.payment.afterUpdateBasketPaymentInstrument.


---

### extensionPointAfterUpdateOrderPaymentInstrument

- extensionPointAfterUpdateOrderPaymentInstrument: [String](TopLevel.String.md) = "sfcc.app.payment.afterUpdateOrderPaymentInstrument"
  - : The extension point name sfcc.app.payment.afterUpdateOrderPaymentInstrument.


---

### extensionPointAuthorizePayment

- extensionPointAuthorizePayment: [String](TopLevel.String.md) = "sfcc.app.payment.authorizePayment"
  - : The extension point name sfcc.app.payment.authorizePayment.


---

### extensionPointCancelAuthorization

- extensionPointCancelAuthorization: [String](TopLevel.String.md) = "sfcc.app.payment.cancelAuthorization"
  - : The extension point name sfcc.app.payment.cancelAuthorization.


---

### extensionPointCapturePayment

- extensionPointCapturePayment: [String](TopLevel.String.md) = "sfcc.app.payment.capturePayment"
  - : The extension point name sfcc.app.payment.capturePayment.


---

### extensionPointGetClaimedPaymentMethods

- extensionPointGetClaimedPaymentMethods: [String](TopLevel.String.md) = "sfcc.app.payment.getClaimedPaymentMethods"
  - : The extension point name sfcc.app.payment.getClaimedPaymentMethods.


---

### extensionPointOnAttemptOrderTransition

- extensionPointOnAttemptOrderTransition: [String](TopLevel.String.md) = "sfcc.app.payment.onAttemptOrderTransition"
  - : The extension point name sfcc.app.payment.onAttemptOrderTransition.


---

### extensionPointRefundCapture

- extensionPointRefundCapture: [String](TopLevel.String.md) = "sfcc.app.payment.refundCapture"
  - : The extension point name sfcc.app.payment.refundCapture.


---

### extensionPointReversePayment

- extensionPointReversePayment: [String](TopLevel.String.md) = "sfcc.app.payment.reversePayment"
  - : The extension point name sfcc.app.payment.reversePayment.


---

## Property Details

### claimedPaymentMethods
- claimedPaymentMethods: [String\[\]](TopLevel.String.md) `(read-only)`
  - : Called to retrieve the list of payment method IDs that this payment Commerce App claims. The hook implementation
      must return an array of payment method IDs (e.g. `\["CREDIT\_CARD", "BANK\_TRANSFER"\]`). When a payment
      instrument has a payment method that appears in the returned array, its payment lifecycle will be handled by the
      payment Commerce App.



---

## Method Details

### afterCreateBasketPaymentInstrument(Basket, OrderPaymentInstrument, BasketPaymentInstrumentRequestWO)
- afterCreateBasketPaymentInstrument(basket: [Basket](dw.order.Basket.md), paymentInstrument: [OrderPaymentInstrument](dw.order.OrderPaymentInstrument.md), request: BasketPaymentInstrumentRequestWO): [Status](dw.system.Status.md)
  - : Called after a new claimed payment instrument is created on a basket.

    **Parameters:**
    - basket - the basket containing the new payment instrument
    - paymentInstrument - the created payment instrument
    - request - body of the SCAPI request that triggered the creation

    **Returns:**
    - `Status.OK` to proceed or `Status.ERROR` to roll back


---

### afterCreateOrderPaymentInstrument(Order, OrderPaymentInstrument, OrderPaymentInstrumentRequestWO)
- afterCreateOrderPaymentInstrument(order: [Order](dw.order.Order.md), paymentInstrument: [OrderPaymentInstrument](dw.order.OrderPaymentInstrument.md), request: OrderPaymentInstrumentRequestWO): [Status](dw.system.Status.md)
  - : Called after an order payment instrument is created for a claimed payment method directly on an existing order
      via the SCAPI POST order-payment-instruments endpoint.


    **Parameters:**
    - order - the order that owns the payment instrument
    - paymentInstrument - the order payment instrument just created
    - request - body of the SCAPI request that triggered the creation

    **Returns:**
    - `Status.OK` to proceed or `Status.ERROR` to roll back


---

### afterUpdateBasketPaymentInstrument(Basket, OrderPaymentInstrument, BasketPaymentInstrumentRequestWO)
- afterUpdateBasketPaymentInstrument(basket: [Basket](dw.order.Basket.md), paymentInstrument: [OrderPaymentInstrument](dw.order.OrderPaymentInstrument.md), request: BasketPaymentInstrumentRequestWO): [Status](dw.system.Status.md)
  - : Called after a claimed payment instrument is updated on a basket.

    **Parameters:**
    - basket - the basket containing the updated payment instrument
    - paymentInstrument - the updated payment instrument
    - request - body of the SCAPI request that triggered the update

    **Returns:**
    - `Status.OK` to proceed or `Status.ERROR` to roll back


---

### afterUpdateOrderPaymentInstrument(Order, OrderPaymentInstrument, OrderPaymentInstrumentRequestWO)
- afterUpdateOrderPaymentInstrument(order: [Order](dw.order.Order.md), paymentInstrument: [OrderPaymentInstrument](dw.order.OrderPaymentInstrument.md), request: OrderPaymentInstrumentRequestWO): [Status](dw.system.Status.md)
  - : Called when a claimed payment instrument is updated on an order.

    **Parameters:**
    - order - the order containing the payment instrument
    - paymentInstrument - the updated payment instrument
    - request - body of the SCAPI request that triggered the update

    **Returns:**
    - `Status.OK` to proceed or `Status.ERROR` to roll back


---

### authorizePayment(Order, OrderPaymentInstrument)
- authorizePayment(order: [Order](dw.order.Order.md), paymentInstrument: [OrderPaymentInstrument](dw.order.OrderPaymentInstrument.md)): [Status](dw.system.Status.md)
  - : 
      
      Called to authorize payment for a payment instrument.
      
      
      
      
      **Note:** The platform does not call this hook directly, so there is no guarantee the given payment
      instrument is claimed by this payment Commerce App. Call this hook in your custom hook implementations to perform
      authorization. Implement this hook to support payment authorization outside of the defined platform extension
      points.


    **Parameters:**
    - order - the order whose payment to authorize
    - paymentInstrument - the payment instrument to authorize

    **Returns:**
    - `Status.OK` on successful authorization or `Status.ERROR` if authorization fails


---

### cancelAuthorization(Order, OrderPaymentInstrument)
- cancelAuthorization(order: [Order](dw.order.Order.md), paymentInstrument: [OrderPaymentInstrument](dw.order.OrderPaymentInstrument.md)): [Status](dw.system.Status.md)
  - : 
      
      Called to void or cancel the authorization for a payment instrument.
      
      
      
      
      **Note:** The platform does not call this hook directly, so there is no guarantee the given payment
      instrument is claimed by this payment Commerce App. Call this hook in your custom hook implementations to
      perform authorization reversal. Implement this hook to support authorization reversal outside of the defined
      platform extension points.


    **Parameters:**
    - order - the order whose authorization to void or cancel
    - paymentInstrument - the payment instrument whose authorization to void or cancel

    **Returns:**
    - `Status.OK` on successful reversal or `Status.ERROR` if reversal fails


---

### capturePayment(Order, OrderPaymentInstrument)
- capturePayment(order: [Order](dw.order.Order.md), paymentInstrument: [OrderPaymentInstrument](dw.order.OrderPaymentInstrument.md)): [Status](dw.system.Status.md)
  - : 
      
      Called to capture a previous payment authorization.
      
      
      
      
      **Note:** The platform does not call this hook directly, so there is no guarantee the given payment
      instrument is claimed by this payment Commerce App. Call this hook in your custom hook implementations to
      capture payment. Implement this hook to support capture outside of the defined platform extension points.


    **Parameters:**
    - order - the order whose payment to capture
    - paymentInstrument - the payment instrument whose payment to capture

    **Returns:**
    - `Status.OK` on successful capture or `Status.ERROR` if capture fails


---

### getClaimedPaymentMethods()
- getClaimedPaymentMethods(): [String\[\]](TopLevel.String.md)
  - : Called to retrieve the list of payment method IDs that this payment Commerce App claims. The hook implementation
      must return an array of payment method IDs (e.g. `\["CREDIT\_CARD", "BANK\_TRANSFER"\]`). When a payment
      instrument has a payment method that appears in the returned array, its payment lifecycle will be handled by the
      payment Commerce App.


    **Returns:**
    - an array of payment method IDs, or an empty array if no methods are claimed


---

### onAttemptOrderTransition(Order, OrderPaymentInstrument)
- onAttemptOrderTransition(order: [Order](dw.order.Order.md), paymentInstrument: [OrderPaymentInstrument](dw.order.OrderPaymentInstrument.md)): [Status](dw.system.Status.md)
  - : Called for each claimed order payment instrument during an order-transition attempt.

    **Parameters:**
    - order - the order that owns the payment instrument
    - paymentInstrument - the order payment instrument being processed

    **Returns:**
    - `Status.OK` to proceed or `Status.ERROR` to roll back


---

### refundCapture(Order, OrderPaymentInstrument)
- refundCapture(order: [Order](dw.order.Order.md), paymentInstrument: [OrderPaymentInstrument](dw.order.OrderPaymentInstrument.md)): [Status](dw.system.Status.md)
  - : 
      
      Called to refund a previously captured payment.
      
      
      
      
      **Note:** The platform does not call this hook directly, so there is no guarantee the given payment
      instrument is claimed by this payment Commerce App. Call this hook in your custom hook implementations to
      refund payment. Implement this hook to support refund outside of the defined platform extension points.


    **Parameters:**
    - order - the order containing the payment to refund
    - paymentInstrument - the payment instrument whose payment to refund

    **Returns:**
    - `Status.OK` on successful refund or `Status.ERROR` if refund fails


---

### reversePayment(Order, OrderPaymentInstrument)
- reversePayment(order: [Order](dw.order.Order.md), paymentInstrument: [OrderPaymentInstrument](dw.order.OrderPaymentInstrument.md)): [Status](dw.system.Status.md)
  - : Called to void or refund the payment for a claimed payment instrument.

    **Parameters:**
    - order - the order containing the payment instrument
    - paymentInstrument - the payment instrument to reverse

    **Returns:**
    - `Status.OK` on successful reversal or `Status.ERROR` if reversal fails


---

<!-- prettier-ignore-end -->
