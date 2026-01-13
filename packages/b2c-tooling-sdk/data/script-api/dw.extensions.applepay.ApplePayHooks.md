<!-- prettier-ignore-start -->
# Class ApplePayHooks

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.extensions.applepay.ApplePayHooks](dw.extensions.applepay.ApplePayHooks.md)

ApplePayHooks interface containing extension points for customizing Apple Pay.


These hooks are executed in a transaction.


The extension points (hook names), and the functions that are called by each extension point. A function must be
defined inside a JavaScript source and must be exported. The script with the exported hook function must be located
inside a site cartridge. Inside the site cartridge a 'package.json' file with a 'hooks' entry must exist.




```
"hooks": "./hooks.json"
```


The hooks entry links to a json file, relative to the 'package.json' file. This file lists all registered hooks
inside the hooks property:




```
"hooks": [
     {"name": "dw.extensions.applepay.getRequest", "script": "./applepay.ds"}
     {"name": "dw.extensions.applepay.shippingContactSelected", "script": "./applepay.ds"}
]
```



A hook entry has a 'name' and a 'script' property.

- The 'name' contains the extension point, the hook name.
- The 'script' contains the script relative to the hooks file, with the exported hook function.



## Constant Summary

| Constant | Description |
| --- | --- |
| [extensionPointCancel](#extensionpointcancel): [String](TopLevel.String.md) = "dw.extensions.applepay.cancel" | The extension point name dw.extensions.applepay.cancel. |
| [extensionPointGetRequest](#extensionpointgetrequest): [String](TopLevel.String.md) = "dw.extensions.applepay.getRequest" | The extension point name dw.extensions.applepay.getRequest. |
| [extensionPointPaymentAuthorizedAuthorizeOrderPayment](#extensionpointpaymentauthorizedauthorizeorderpayment): [String](TopLevel.String.md) = "dw.extensions.applepay.paymentAuthorized.authorizeOrderPayment" | The extension point name dw.extensions.applepay.paymentAuthorized.authorizeOrderPayment. |
| [extensionPointPaymentAuthorizedCreateOrder](#extensionpointpaymentauthorizedcreateorder): [String](TopLevel.String.md) = "dw.extensions.applepay.paymentAuthorized.createOrder" | The extension point name dw.extensions.applepay.paymentAuthorized.createOrder. |
| [extensionPointPaymentAuthorizedFailOrder](#extensionpointpaymentauthorizedfailorder): [String](TopLevel.String.md) = "dw.extensions.applepay.paymentAuthorized.failOrder" | The extension point name dw.extensions.applepay.paymentAuthorized.failOrder. |
| [extensionPointPaymentAuthorizedPlaceOrder](#extensionpointpaymentauthorizedplaceorder): [String](TopLevel.String.md) = "dw.extensions.applepay.paymentAuthorized.placeOrder" | The extension point name dw.extensions.applepay.paymentAuthorized.placeOrder. |
| [extensionPointPaymentMethodSelected](#extensionpointpaymentmethodselected): [String](TopLevel.String.md) = "dw.extensions.applepay.paymentMethodSelected" | The extension point name dw.extensions.applepay.paymentMethodSelected. |
| [extensionPointPrepareBasket](#extensionpointpreparebasket): [String](TopLevel.String.md) = "dw.extensions.applepay.prepareBasket" | The extension point name dw.extensions.applepay.prepareBasket. |
| [extensionPointShippingContactSelected](#extensionpointshippingcontactselected): [String](TopLevel.String.md) = "dw.extensions.applepay.shippingContactSelected" | The extension point name dw.extensions.applepay.shippingContactSelected. |
| [extensionPointShippingMethodSelected](#extensionpointshippingmethodselected): [String](TopLevel.String.md) = "dw.extensions.applepay.shippingMethodSelected" | The extension point name dw.extensions.applepay.shippingMethodSelected. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [authorizeOrderPayment](dw.extensions.applepay.ApplePayHooks.md#authorizeorderpaymentorder-object)([Order](dw.order.Order.md), [Object](TopLevel.Object.md)) | <p>  Called to authorize the Apple Pay payment for the order. |
| [cancel](dw.extensions.applepay.ApplePayHooks.md#cancelbasket)([Basket](dw.order.Basket.md)) | <p>  Called after the Apple Pay payment sheet was canceled. |
| [createOrder](dw.extensions.applepay.ApplePayHooks.md#createorderbasket-object)([Basket](dw.order.Basket.md), [Object](TopLevel.Object.md)) | <p>  Called after handling the given `ApplePayPaymentAuthorizedEvent` for the given basket. |
| [failOrder](dw.extensions.applepay.ApplePayHooks.md#failorderorder-status)([Order](dw.order.Order.md), [Status](dw.system.Status.md)) | <p>  Called after payment authorization is unsuccessful and the given Apple Pay order must be failed. |
| [getRequest](dw.extensions.applepay.ApplePayHooks.md#getrequestbasket-object)([Basket](dw.order.Basket.md), [Object](TopLevel.Object.md)) | <p>  Called to get the Apple Pay JS `PaymentRequest` for the given basket. |
| [paymentMethodSelected](dw.extensions.applepay.ApplePayHooks.md#paymentmethodselectedbasket-object-object)([Basket](dw.order.Basket.md), [Object](TopLevel.Object.md), [Object](TopLevel.Object.md)) | <p>  Called after handling the given `ApplePayPaymentMethodSelectedEvent` for the given basket. |
| [placeOrder](dw.extensions.applepay.ApplePayHooks.md#placeorderorder)([Order](dw.order.Order.md)) | <p>  Called after payment has been authorized and the given Apple Pay order is ready to be placed. |
| [prepareBasket](dw.extensions.applepay.ApplePayHooks.md#preparebasketbasket-object)([Basket](dw.order.Basket.md), [Object](TopLevel.Object.md)) | <p>  Called to prepare the given basket for an Apple Pay checkout. |
| [shippingContactSelected](dw.extensions.applepay.ApplePayHooks.md#shippingcontactselectedbasket-object-object)([Basket](dw.order.Basket.md), [Object](TopLevel.Object.md), [Object](TopLevel.Object.md)) | <p>  Called after handling the given `ApplePayShippingContactSelectedEvent` for the given basket. |
| [shippingMethodSelected](dw.extensions.applepay.ApplePayHooks.md#shippingmethodselectedbasket-shippingmethod-object-object)([Basket](dw.order.Basket.md), [ShippingMethod](dw.order.ShippingMethod.md), [Object](TopLevel.Object.md), [Object](TopLevel.Object.md)) | <p>  Called after handling the given `ApplePayShippingMethodSelectedEvent` for the given basket. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### extensionPointCancel

- extensionPointCancel: [String](TopLevel.String.md) = "dw.extensions.applepay.cancel"
  - : The extension point name dw.extensions.applepay.cancel.


---

### extensionPointGetRequest

- extensionPointGetRequest: [String](TopLevel.String.md) = "dw.extensions.applepay.getRequest"
  - : The extension point name dw.extensions.applepay.getRequest.


---

### extensionPointPaymentAuthorizedAuthorizeOrderPayment

- extensionPointPaymentAuthorizedAuthorizeOrderPayment: [String](TopLevel.String.md) = "dw.extensions.applepay.paymentAuthorized.authorizeOrderPayment"
  - : The extension point name dw.extensions.applepay.paymentAuthorized.authorizeOrderPayment.


---

### extensionPointPaymentAuthorizedCreateOrder

- extensionPointPaymentAuthorizedCreateOrder: [String](TopLevel.String.md) = "dw.extensions.applepay.paymentAuthorized.createOrder"
  - : The extension point name dw.extensions.applepay.paymentAuthorized.createOrder.


---

### extensionPointPaymentAuthorizedFailOrder

- extensionPointPaymentAuthorizedFailOrder: [String](TopLevel.String.md) = "dw.extensions.applepay.paymentAuthorized.failOrder"
  - : The extension point name dw.extensions.applepay.paymentAuthorized.failOrder.


---

### extensionPointPaymentAuthorizedPlaceOrder

- extensionPointPaymentAuthorizedPlaceOrder: [String](TopLevel.String.md) = "dw.extensions.applepay.paymentAuthorized.placeOrder"
  - : The extension point name dw.extensions.applepay.paymentAuthorized.placeOrder.


---

### extensionPointPaymentMethodSelected

- extensionPointPaymentMethodSelected: [String](TopLevel.String.md) = "dw.extensions.applepay.paymentMethodSelected"
  - : The extension point name dw.extensions.applepay.paymentMethodSelected.


---

### extensionPointPrepareBasket

- extensionPointPrepareBasket: [String](TopLevel.String.md) = "dw.extensions.applepay.prepareBasket"
  - : The extension point name dw.extensions.applepay.prepareBasket.


---

### extensionPointShippingContactSelected

- extensionPointShippingContactSelected: [String](TopLevel.String.md) = "dw.extensions.applepay.shippingContactSelected"
  - : The extension point name dw.extensions.applepay.shippingContactSelected.


---

### extensionPointShippingMethodSelected

- extensionPointShippingMethodSelected: [String](TopLevel.String.md) = "dw.extensions.applepay.shippingMethodSelected"
  - : The extension point name dw.extensions.applepay.shippingMethodSelected.


---

## Method Details

### authorizeOrderPayment(Order, Object)
- authorizeOrderPayment(order: [Order](dw.order.Order.md), event: [Object](TopLevel.Object.md)): [Status](dw.system.Status.md)
  - : 
      
      Called to authorize the Apple Pay payment for the order. The given order will have been created by the
      [extensionPointPaymentAuthorizedCreateOrder](dw.extensions.applepay.ApplePayHooks.md#extensionpointpaymentauthorizedcreateorder) hook, after the basket was populated with data from
      the `ApplePayPaymentAuthorizedEvent`.
      
      
      
      
      Return a non-error status if you have successfully authorized the payment with your payment service provider.
      Your hook implementation must set the necessary payment status and transaction identifier data on the order as
      returned by the provider.
      
      
      
      
      Return an error status to indicate a problem, including unsuccessful authorization. See
      [ApplePayHookResult](dw.extensions.applepay.ApplePayHookResult.md) for how to indicate error statuses with detail information to
      be provided to Apple Pay.
      
      
      
      
      See the [Apple Pay JS API Reference](https://developer.apple.com/reference/applepayjs) for more information.


    **Parameters:**
    - order - the order paid using Apple Pay
    - event - `ApplePayPaymentAuthorizedEvent` object

    **Returns:**
    - a non-null status ends the hook execution


---

### cancel(Basket)
- cancel(basket: [Basket](dw.order.Basket.md)): [ApplePayHookResult](dw.extensions.applepay.ApplePayHookResult.md)
  - : 
      
      Called after the Apple Pay payment sheet was canceled. There is no Apple Pay JS event object for this case. The
      given basket is the one that was passed to other hooks earlier in the Apple Pay checkout process.
      
      
      
      
      It is not guaranteed that this hook will be executed for all Apple Pay payment sheets canceled by shoppers or
      otherwise ended without a successful order. Calls to this hook are provided on a best-effort basis.
      
      
      
      
      If the returned result includes a redirect URL, the shopper browser will be navigated to that URL if possible. It
      is not guaranteed that the response with the hook result will be handled in the shopper browser in all cases.


    **Parameters:**
    - basket - the basket that was being checked out using Apple Pay

    **Returns:**
    - a non-null result ends the hook execution


---

### createOrder(Basket, Object)
- createOrder(basket: [Basket](dw.order.Basket.md), event: [Object](TopLevel.Object.md)): [Order](dw.order.Order.md)
  - : 
      
      Called after handling the given `ApplePayPaymentAuthorizedEvent` for the given basket. Customer
      information, billing address, and/or shipping address for the default shipment will have already been updated to
      reflect the available contact information provided by Apple Pay based on the Apple Pay configuration for your
      site. Any preexisting payment instruments on the basket will have been removed, and a single
      `DW_APPLE_PAY` payment instrument added for the total amount.
      
      
      
      
      The purpose of this hook is to populate the created order with any necessary information from the basket
      or the Apple Pay event. Do not use this hook for address verification, or any other validation. Instead
      use the [extensionPointPaymentAuthorizedAuthorizeOrderPayment](dw.extensions.applepay.ApplePayHooks.md#extensionpointpaymentauthorizedauthorizeorderpayment) hook which allows you to return
      an `ApplePayHookResult` with error status information.
      
      
      
      
      The default implementation of this hook simply calls `OrderMgr.createOrder` and returns the created
      order.
      
      
      
      
      Throw an error to indicate a problem creating the order.


    **Parameters:**
    - basket - the basket being checked out using Apple Pay
    - event - `ApplePayPaymentAuthorizedEvent` object

    **Returns:**
    - a non-null order ends the hook execution


---

### failOrder(Order, Status)
- failOrder(order: [Order](dw.order.Order.md), status: [Status](dw.system.Status.md)): [ApplePayHookResult](dw.extensions.applepay.ApplePayHookResult.md)
  - : 
      
      Called after payment authorization is unsuccessful and the given Apple Pay order must be failed. The purpose
      of this hook is to fail the order, or return a redirect URL that results in the order being failed when the shopper
      browser is navigated to it. The given status object is the result of calling the
      [extensionPointPaymentAuthorizedAuthorizeOrderPayment](dw.extensions.applepay.ApplePayHooks.md#extensionpointpaymentauthorizedauthorizeorderpayment) hook.
      
      
      
      
      The default implementation of this hook simply calls `OrderMgr.failOrder`, and returns a result
      with the given status and no redirect URL.
      
      
      
      
      Return a result with an error status to indicate a problem. See [ApplePayHookResult](dw.extensions.applepay.ApplePayHookResult.md)
      for how to indicate error statuses with detail information to be provided to Apple Pay. If the returned result includes
      a redirect URL, the shopper browser will be navigated to that URL if the Apple Pay payment sheet is canceled.


    **Parameters:**
    - order - the order created for a failed Apple Pay checkout
    - status - status code returned by the [extensionPointPaymentAuthorizedAuthorizeOrderPayment](dw.extensions.applepay.ApplePayHooks.md#extensionpointpaymentauthorizedauthorizeorderpayment) hook

    **Returns:**
    - ApplePayHookResult containing a status code to be provided to Apple Pay. A non-null result ends the hook execution


---

### getRequest(Basket, Object)
- getRequest(basket: [Basket](dw.order.Basket.md), request: [Object](TopLevel.Object.md)): [ApplePayHookResult](dw.extensions.applepay.ApplePayHookResult.md)
  - : 
      
      Called to get the Apple Pay JS `PaymentRequest` for the given basket. You can set properties in the
      given request object to extend or override default properties set automatically based on the Apple Pay
      configuration for your site.
      
      
      
      
      Return a result with an error status to indicate a problem. See [ApplePayHookResult](dw.extensions.applepay.ApplePayHookResult.md)
      for how to indicate error statuses with detail information to be provided to Apple Pay.
      
      
      
      
      If the returned result includes a redirect URL, the shopper browser will be navigated to that URL if the Apple
      Pay payment sheet is canceled.
      
      
      
      
      See the [Apple Pay JS API Reference](https://developer.apple.com/reference/applepayjs) for more information.


    **Parameters:**
    - basket - the basket for the Apple Pay request
    - request - the Apple Pay payment request object

    **Returns:**
    - a non-null result ends the hook execution


---

### paymentMethodSelected(Basket, Object, Object)
- paymentMethodSelected(basket: [Basket](dw.order.Basket.md), event: [Object](TopLevel.Object.md), response: [Object](TopLevel.Object.md)): [ApplePayHookResult](dw.extensions.applepay.ApplePayHookResult.md)
  - : 
      
      Called after handling the given `ApplePayPaymentMethodSelectedEvent` for the given basket. This Apple
      Pay event does not contain payment card or device information.
      
      
      
      
      The given response object will contain properties whose values are to be passed as parameters to the
      `ApplePaySession.completePaymentMethodSelection` event callback:
      
      
      
      - total - Updated total line item object
      - lineItems - Array of updated line item objects
      
      
      
      Return a result with an error status to indicate a problem. See [ApplePayHookResult](dw.extensions.applepay.ApplePayHookResult.md)
      for how to indicate error statuses with detail information to be provided to Apple Pay.
      
      
      
      
      If the returned result includes a redirect URL, the shopper browser will be navigated to that URL if the Apple
      Pay payment sheet is canceled.
      
      
      
      
      See the [Apple Pay JS API Reference](https://developer.apple.com/reference/applepayjs) for more information.


    **Parameters:**
    - basket - the basket being checked out using Apple Pay
    - event - `ApplePayPaymentMethodSelectedEvent` object
    - response - JS object containing Apple Pay event callback parameters

    **Returns:**
    - a non-null result ends the hook execution


---

### placeOrder(Order)
- placeOrder(order: [Order](dw.order.Order.md)): [ApplePayHookResult](dw.extensions.applepay.ApplePayHookResult.md)
  - : 
      
      Called after payment has been authorized and the given Apple Pay order is ready to be placed. The purpose of this
      hook is to place the order, or return a redirect URL that results in the order being placed when the shopper
      browser is navigated to it.
      
      
      
      
      The default implementation of this hook returns a redirect to `COPlaceOrder-Submit` with URL
      parameters `order_id` set to [Order.getOrderNo()](dw.order.Order.md#getorderno) and `order_token` set to
      [Order.getOrderToken()](dw.order.Order.md#getordertoken) which corresponds to SiteGenesis-based implementations. Your hook
      implementation should return a result with a different redirect URL as necessary to place the order and show an
      order confirmation.
      
      
      
      
      Alternatively, your hook implementation itself can place the order and return a result with a redirect URL to an
      order confirmation page that does not place the order. This is inconsistent with SiteGenesis-based
      implementations so is not the default.
      
      
      
      
      Return an error status to indicate a problem. See [ApplePayHookResult](dw.extensions.applepay.ApplePayHookResult.md) for how to
      indicate error statuses with detail information to be provided to Apple Pay. If the returned result includes a
      redirect URL, the shopper browser will be navigated to that URL if the Apple Pay payment sheet is canceled.


    **Parameters:**
    - order - the order paid using Apple Pay

    **Returns:**
    - a non-null result ends the hook execution


---

### prepareBasket(Basket, Object)
- prepareBasket(basket: [Basket](dw.order.Basket.md), parameters: [Object](TopLevel.Object.md)): [ApplePayHookResult](dw.extensions.applepay.ApplePayHookResult.md)
  - : 
      
      Called to prepare the given basket for an Apple Pay checkout. This hook will be executed after the user
      clicks the Apple Pay button.
      
      
      
      
      The default implementation of this hook calculates the basket. A custom hook implementation that returns a
      non-null result must calculate the basket.
      
      
      
      
      The given parameters object will contain properties whose values are passed from the
      `<isapplepay></isapplepay>` tag:
      
      
      
      - sku - SKU of product to checkout exclusively
      
      
      
      Return a result with an error status to indicate a problem. For this hook there is no opportunity to provide user
      feedback, so if any error status is returned, the Apple Pay payment sheet will be aborted.
      
      
      
      
      If the returned result includes a redirect URL, the shopper browser will be navigated to that URL after the Apple
      Pay payment sheet is aborted.


    **Parameters:**
    - basket - the basket for the Apple Pay request
    - parameters - parameters from the `<isapplepay></isapplepay>` tag

    **Returns:**
    - a non-null result ends the hook execution


---

### shippingContactSelected(Basket, Object, Object)
- shippingContactSelected(basket: [Basket](dw.order.Basket.md), event: [Object](TopLevel.Object.md), response: [Object](TopLevel.Object.md)): [ApplePayHookResult](dw.extensions.applepay.ApplePayHookResult.md)
  - : 
      
      Called after handling the given `ApplePayShippingContactSelectedEvent` for the given basket. Basket
      customer information and/or shipping address for the default shipment will have already been updated to reflect
      the available shipping contact information provided by Apple Pay based on the Apple Pay configuration for your
      site. The basket will have already been calculated before this hook is called.
      
      
      
      
      The given response object will contain properties whose values are to be passed as parameters to the
      `ApplePaySession.completeShippingContactSelection` event callback:
      
      
      
      - shippingMethods - Array of applicable shipping method JS objects
      - total - Updated total line item object
      - lineItems - Array of updated line item objects
      
      
      
      Return a result with an error status to indicate a problem. See [ApplePayHookResult](dw.extensions.applepay.ApplePayHookResult.md)
      for how to indicate error statuses with detail information to be provided to Apple Pay.
      
      
      
      
      If the returned result includes a redirect URL, the shopper browser will be navigated to that URL if the Apple
      Pay payment sheet is canceled.
      
      
      
      
      See the [Apple Pay JS API Reference](https://developer.apple.com/reference/applepayjs) for more information.


    **Parameters:**
    - basket - the basket being checked out using Apple Pay
    - event - `ApplePayShippingContactSelectedEvent` object
    - response - JS object containing Apple Pay event callback parameters

    **Returns:**
    - a non-null result ends the hook execution


---

### shippingMethodSelected(Basket, ShippingMethod, Object, Object)
- shippingMethodSelected(basket: [Basket](dw.order.Basket.md), shippingMethod: [ShippingMethod](dw.order.ShippingMethod.md), event: [Object](TopLevel.Object.md), response: [Object](TopLevel.Object.md)): [ApplePayHookResult](dw.extensions.applepay.ApplePayHookResult.md)
  - : 
      
      Called after handling the given `ApplePayShippingMethodSelectedEvent` for the given basket. The given
      shipping method will have already been set on the basket.  The basket will have already been calculated before
      this hook is called.
      
      
      
      
      The given response object will contain properties whose values are to be passed as parameters to the
      `ApplePaySession.completeShippingMethodSelection` event callback:
      
      
      
      - total - Updated total line item object
      - lineItems - Array of updated line item objects
      
      
      
      Return a result with an error status to indicate a problem. See [ApplePayHookResult](dw.extensions.applepay.ApplePayHookResult.md)
      for how to indicate error statuses with detail information to be provided to Apple Pay.
      
      
      
      
      If the returned result includes a redirect URL, the shopper browser will be navigated to that URL if the Apple
      Pay payment sheet is canceled.
      
      
      
      
      See the [Apple Pay JS API Reference](https://developer.apple.com/reference/applepayjs) for more information.


    **Parameters:**
    - basket - the basket being checked out using Apple Pay
    - shippingMethod - the shipping method that was selected
    - event - `ApplePayShippingMethodSelectedEvent` object
    - response - JS object containing Apple Pay event callback parameters

    **Returns:**
    - a non-null result ends the hook execution


---

<!-- prettier-ignore-end -->
