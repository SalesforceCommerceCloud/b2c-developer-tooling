<!-- prettier-ignore-start -->
# Class PaymentRequestHooks

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.extensions.paymentrequest.PaymentRequestHooks](dw.extensions.paymentrequest.PaymentRequestHooks.md)

PaymentRequestHooks interface containing extension points for customizing Payment Requests.


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
     {"name": "dw.extensions.paymentrequest.getPaymentRequest", "script": "./paymentrequest.ds"}
     {"name": "dw.extensions.paymentrequest.shippingAddressChange", "script": "./paymentrequest.ds"}
]
```



A hook entry has a 'name' and a 'script' property.

- The 'name' contains the extension point, the hook name.
- The 'script' contains the script relative to the hooks file, with the exported hook function.


**Deprecated:**
:::warning
Salesforce Payments includes support for Google Pay
:::

## Constant Summary

| Constant | Description |
| --- | --- |
| [extensionPointAbort](#extensionpointabort): [String](TopLevel.String.md) = "dw.extensions.paymentrequest.abort" | The extension point name dw.extensions.paymentrequest.abort. |
| [extensionPointGetPaymentRequest](#extensionpointgetpaymentrequest): [String](TopLevel.String.md) = "dw.extensions.paymentrequest.getPaymentRequest" | The extension point name dw.extensions.paymentrequest.getPaymentRequest. |
| [extensionPointPaymentAcceptedAuthorizeOrderPayment](#extensionpointpaymentacceptedauthorizeorderpayment): [String](TopLevel.String.md) = "dw.extensions.paymentrequest.paymentAccepted.authorizeOrderPayment" | The extension point name dw.extensions.paymentrequest.paymentAccepted.authorizeOrderPayment. |
| [extensionPointPaymentAcceptedPlaceOrder](#extensionpointpaymentacceptedplaceorder): [String](TopLevel.String.md) = "dw.extensions.paymentrequest.paymentAccepted.placeOrder" | The extension point name dw.extensions.paymentrequest.paymentAccepted.placeOrder. |
| [extensionPointShippingAddressChange](#extensionpointshippingaddresschange): [String](TopLevel.String.md) = "dw.extensions.paymentrequest.shippingAddressChange" | The extension point name dw.extensions.paymentrequest.shippingAddressChange. |
| [extensionPointShippingOptionChange](#extensionpointshippingoptionchange): [String](TopLevel.String.md) = "dw.extensions.paymentrequest.shippingOptionChange" | The extension point name dw.extensions.paymentrequest.shippingOptionChange. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [abort](dw.extensions.paymentrequest.PaymentRequestHooks.md#abortbasket)([Basket](dw.order.Basket.md)) | <p>  Called after the Payment Request user interface was canceled. |
| [authorizeOrderPayment](dw.extensions.paymentrequest.PaymentRequestHooks.md#authorizeorderpaymentorder-object)([Order](dw.order.Order.md), [Object](TopLevel.Object.md)) | <p>  Called after the shopper accepts the Payment Request payment for the given order. |
| [getPaymentRequest](dw.extensions.paymentrequest.PaymentRequestHooks.md#getpaymentrequestbasket-object)([Basket](dw.order.Basket.md), [Object](TopLevel.Object.md)) | <p>  Called to get the `PaymentRequest` constructor parameters for the given basket. |
| [placeOrder](dw.extensions.paymentrequest.PaymentRequestHooks.md#placeorderorder)([Order](dw.order.Order.md)) | <p>  Called after payment has been authorized and the given Payment Request order is ready to be placed. |
| [shippingAddressChange](dw.extensions.paymentrequest.PaymentRequestHooks.md#shippingaddresschangebasket-object)([Basket](dw.order.Basket.md), [Object](TopLevel.Object.md)) | <p>  Called after handling the Payment Request `shippingaddresschange` event for the given basket. |
| [shippingOptionChange](dw.extensions.paymentrequest.PaymentRequestHooks.md#shippingoptionchangebasket-shippingmethod-object)([Basket](dw.order.Basket.md), [ShippingMethod](dw.order.ShippingMethod.md), [Object](TopLevel.Object.md)) | <p>  Called after handling the Payment Request `shippingoptionchange` event for the given basket. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### extensionPointAbort

- extensionPointAbort: [String](TopLevel.String.md) = "dw.extensions.paymentrequest.abort"
  - : The extension point name dw.extensions.paymentrequest.abort.


---

### extensionPointGetPaymentRequest

- extensionPointGetPaymentRequest: [String](TopLevel.String.md) = "dw.extensions.paymentrequest.getPaymentRequest"
  - : The extension point name dw.extensions.paymentrequest.getPaymentRequest.


---

### extensionPointPaymentAcceptedAuthorizeOrderPayment

- extensionPointPaymentAcceptedAuthorizeOrderPayment: [String](TopLevel.String.md) = "dw.extensions.paymentrequest.paymentAccepted.authorizeOrderPayment"
  - : The extension point name dw.extensions.paymentrequest.paymentAccepted.authorizeOrderPayment.


---

### extensionPointPaymentAcceptedPlaceOrder

- extensionPointPaymentAcceptedPlaceOrder: [String](TopLevel.String.md) = "dw.extensions.paymentrequest.paymentAccepted.placeOrder"
  - : The extension point name dw.extensions.paymentrequest.paymentAccepted.placeOrder.


---

### extensionPointShippingAddressChange

- extensionPointShippingAddressChange: [String](TopLevel.String.md) = "dw.extensions.paymentrequest.shippingAddressChange"
  - : The extension point name dw.extensions.paymentrequest.shippingAddressChange.


---

### extensionPointShippingOptionChange

- extensionPointShippingOptionChange: [String](TopLevel.String.md) = "dw.extensions.paymentrequest.shippingOptionChange"
  - : The extension point name dw.extensions.paymentrequest.shippingOptionChange.


---

## Method Details

### abort(Basket)
- abort(basket: [Basket](dw.order.Basket.md)): [PaymentRequestHookResult](dw.extensions.paymentrequest.PaymentRequestHookResult.md)
  - : 
      
      Called after the Payment Request user interface was canceled. The given basket is the one that was passed to other
      hooks earlier in the Payment Request checkout process.
      
      
      
      
      It is not guaranteed that this hook will be executed for all Payment Request user interfaces canceled by shoppers or
      otherwise ended without a successful order. Calls to this hook are provided on a best-effort basis.
      
      
      
      
      If the returned result includes a redirect URL, the shopper browser will be navigated to that URL if possible. It
      is not guaranteed that the response with the hook result will be handled in the shopper browser in all cases.


    **Parameters:**
    - basket - the basket that was being checked out using Payment Request

    **Returns:**
    - a non-null result ends the hook execution


---

### authorizeOrderPayment(Order, Object)
- authorizeOrderPayment(order: [Order](dw.order.Order.md), response: [Object](TopLevel.Object.md)): [Status](dw.system.Status.md)
  - : 
      
      Called after the shopper accepts the Payment Request payment for the given order. Basket customer information,
      billing address, and/or shipping address for the default shipment will have already been updated to reflect the
      available contact information provided by Payment Request. Any preexisting payment instruments on the basket will
      have been removed, and a single `DW_ANDROID_PAY` payment instrument added for the total amount. The
      given order will have been created from this updated basket.
      
      
      
      
      The purpose of this hook is to authorize the Payment Request payment for the order. If a non-error status is returned
      that means that you have successfully authorized the payment with your payment service provider. Your hook
      implementation must set the necessary payment status and transaction identifier data on the order as returned by
      the provider.
      
      
      
      
      Return an error status to indicate a problem, including unsuccessful authorization.
      
      
      
      
      See the [Payment Request API](https://www.w3.org/TR/payment-request) for more information.


    **Parameters:**
    - order - the order paid using Payment Request
    - response - response to the accepted `PaymentRequest`

    **Returns:**
    - a non-null status ends the hook execution


---

### getPaymentRequest(Basket, Object)
- getPaymentRequest(basket: [Basket](dw.order.Basket.md), parameters: [Object](TopLevel.Object.md)): [PaymentRequestHookResult](dw.extensions.paymentrequest.PaymentRequestHookResult.md)
  - : 
      
      Called to get the `PaymentRequest` constructor parameters for the given basket. You can
      set properties in the given `parameters` object to extend or override default properties set
      automatically based on the Google Pay configuration for your site.
      
      
      
      
      The `parameters` object will contain the following properties by default:
      
      - `methodData`- array containing payment methods the web site accepts
      - `details`- information about the transaction that the user is being asked to complete
      - `options`- information about what options the web page wishes to use from the payment request system
      
      
      
      
      
      Return a result with an error status to indicate a problem.
      
      
      
      
      If the returned result includes a redirect URL, the shopper browser will be navigated to that URL if the Payment
      Request user interaction is canceled.
      
      
      
      
      See the [Payment Request API](https://www.w3.org/TR/payment-request) for more information.


    **Parameters:**
    - basket - the basket for the Payment Request request
    - parameters - object containing `PaymentRequest` constructor parameters

    **Returns:**
    - a non-null result ends the hook execution


---

### placeOrder(Order)
- placeOrder(order: [Order](dw.order.Order.md)): [PaymentRequestHookResult](dw.extensions.paymentrequest.PaymentRequestHookResult.md)
  - : 
      
      Called after payment has been authorized and the given Payment Request order is ready to be placed. The purpose of
      this hook is to place the order, or return a redirect URL that results in the order being placed when the shopper
      browser is navigated to it.
      
      
      
      
      The default implementation of this hook returns a redirect to `COPlaceOrder-Submit` with URL
      parameters `order_id` set to [Order.getOrderNo()](dw.order.Order.md#getorderno) and `order_token` set to
      [Order.getOrderToken()](dw.order.Order.md#getordertoken) which corresponds to SiteGenesis-based implementations. Your hook
      implementation should return a result with a different redirect URL as necessary to place the order and show an
      order confirmation.
      
      
      
      
      Alternatively, your hook implementation itself can place the order and return a result with a redirect URL to an
      order confirmation page that does not place the order. This is inconsistent with SiteGenesis-based
      implementations so is not the default.
      
      
      
      
      Return an error status to indicate a problem. If the returned result includes a redirect URL, the shopper browser
      will be navigated to that URL if the Payment Request user interface is canceled.


    **Parameters:**
    - order - the order paid using PaymentRequest

    **Returns:**
    - a non-null result ends the hook execution


---

### shippingAddressChange(Basket, Object)
- shippingAddressChange(basket: [Basket](dw.order.Basket.md), details: [Object](TopLevel.Object.md)): [PaymentRequestHookResult](dw.extensions.paymentrequest.PaymentRequestHookResult.md)
  - : 
      
      Called after handling the Payment Request `shippingaddresschange` event for the given basket. Basket
      customer information and/or shipping address for the default shipment will have already been updated to reflect
      the available shipping address information provided by Payment Request. The basket will have already been
      calculated before this hook is called.
      
      
      
      
      Return a result with an error status to indicate a problem.
      
      
      
      
      If the returned result includes a redirect URL, the shopper browser will be navigated to that URL if the Payment
      Request user interface is canceled.
      
      
      
      
      See the [Payment Request API](https://www.w3.org/TR/payment-request) for more information.


    **Parameters:**
    - basket - the basket being checked out using Payment Request
    - details - updated `PaymentRequest` object details

    **Returns:**
    - a non-null result ends the hook execution


---

### shippingOptionChange(Basket, ShippingMethod, Object)
- shippingOptionChange(basket: [Basket](dw.order.Basket.md), shippingMethod: [ShippingMethod](dw.order.ShippingMethod.md), details: [Object](TopLevel.Object.md)): [PaymentRequestHookResult](dw.extensions.paymentrequest.PaymentRequestHookResult.md)
  - : 
      
      Called after handling the Payment Request `shippingoptionchange` event for the given basket. The given
      shipping method will have already been set on the basket. The basket will have already been calculated before
      this hook is called.
      
      
      
      
      Return a result with an error status to indicate a problem.
      
      
      
      
      If the returned result includes a redirect URL, the shopper browser will be navigated to that URL if the
      Payment Request user interface is canceled.
      
      
      
      
      See the [Payment Request API](https://www.w3.org/TR/payment-request) for more information.


    **Parameters:**
    - basket - the basket being checked out using Payment Request
    - shippingMethod - the shipping method that was selected
    - details - updated `PaymentRequest` object details

    **Returns:**
    - a non-null result ends the hook execution


---

<!-- prettier-ignore-end -->
