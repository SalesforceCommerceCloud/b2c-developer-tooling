<!-- prettier-ignore-start -->
# Class SalesforcePaymentsMgr

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.extensions.payments.SalesforcePaymentsMgr](dw.extensions.payments.SalesforcePaymentsMgr.md)

Contains functionality for use with Salesforce Payments. See Salesforce Payments documentation for how to gain access
and configure it for use on your sites.



## Constant Summary

| Constant | Description |
| --- | --- |
| [CANCELLATION_REASON_ABANDONED](#cancellation_reason_abandoned): [String](TopLevel.String.md) = "abandoned" | Cancellation reason indicating customer abandoned payment. |
| [CANCELLATION_REASON_DUPLICATE](#cancellation_reason_duplicate): [String](TopLevel.String.md) = "duplicate" | Cancellation reason indicating payment intent was a duplicate. |
| [CANCELLATION_REASON_FRAUDULENT](#cancellation_reason_fraudulent): [String](TopLevel.String.md) = "fraudulent" | Cancellation reason indicating payment was fraudulent. |
| [CANCELLATION_REASON_REQUESTED_BY_CUSTOMER](#cancellation_reason_requested_by_customer): [String](TopLevel.String.md) = "requested_by_customer" | Cancellation reason indicating customer action or request. |
| [REFUND_REASON_DUPLICATE](#refund_reason_duplicate): [String](TopLevel.String.md) = "duplicate" | Refund reason indicating payment intent was a duplicate. |
| [REFUND_REASON_FRAUDULENT](#refund_reason_fraudulent): [String](TopLevel.String.md) = "fraudulent" | Refund reason indicating payment was fraudulent. |
| [REFUND_REASON_REQUESTED_BY_CUSTOMER](#refund_reason_requested_by_customer): [String](TopLevel.String.md) = "requested_by_customer" | Refund reason indicating customer action or request. |

## Property Summary

| Property | Description |
| --- | --- |
| [paymentsSiteConfig](#paymentssiteconfig): [SalesforcePaymentsSiteConfiguration](dw.extensions.payments.SalesforcePaymentsSiteConfiguration.md) `(read-only)` | Returns a payments site configuration object for the current site. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| ~~static [attachPaymentMethod](dw.extensions.payments.SalesforcePaymentsMgr.md#attachpaymentmethodsalesforcepaymentmethod-customer)([SalesforcePaymentMethod](dw.extensions.payments.SalesforcePaymentMethod.md), [Customer](dw.customer.Customer.md))~~ | Attaches the given payment method to the given customer. |
| static [authorizePayPalOrder](dw.extensions.payments.SalesforcePaymentsMgr.md#authorizepaypalordersalesforcepaypalorder)([SalesforcePayPalOrder](dw.extensions.payments.SalesforcePayPalOrder.md)) | Authorizes the given PayPal order. |
| static [cancelPaymentIntent](dw.extensions.payments.SalesforcePaymentsMgr.md#cancelpaymentintentsalesforcepaymentintent-object)([SalesforcePaymentIntent](dw.extensions.payments.SalesforcePaymentIntent.md), [Object](TopLevel.Object.md)) | Cancels the given payment intent. |
| static [captureAdyenPayment](dw.extensions.payments.SalesforcePaymentsMgr.md#captureadyenpaymentorderpaymentinstrument-money-object)([OrderPaymentInstrument](dw.order.OrderPaymentInstrument.md), [Money](dw.value.Money.md), [Object](TopLevel.Object.md)) | Captures funds for the given order payment instrument. |
| static [capturePayPalOrder](dw.extensions.payments.SalesforcePaymentsMgr.md#capturepaypalordersalesforcepaypalorder)([SalesforcePayPalOrder](dw.extensions.payments.SalesforcePayPalOrder.md)) | Captures funds for the given PayPal order. |
| static [capturePaymentIntent](dw.extensions.payments.SalesforcePaymentsMgr.md#capturepaymentintentsalesforcepaymentintent-money)([SalesforcePaymentIntent](dw.extensions.payments.SalesforcePaymentIntent.md), [Money](dw.value.Money.md)) | Captures funds for the given payment intent. |
| static [confirmPaymentIntent](dw.extensions.payments.SalesforcePaymentsMgr.md#confirmpaymentintentorder-salesforcepaymentmethod-object)([Order](dw.order.Order.md), [SalesforcePaymentMethod](dw.extensions.payments.SalesforcePaymentMethod.md), [Object](TopLevel.Object.md)) | <p>  Confirms a new payment intent using the given payment method, and associates it with the given order. |
| static [createAdyenPaymentIntent](dw.extensions.payments.SalesforcePaymentsMgr.md#createadyenpaymentintentorder-shipment-string-money-boolean-object-object)([Order](dw.order.Order.md), [Shipment](dw.order.Shipment.md), [String](TopLevel.String.md), [Money](dw.value.Money.md), [Boolean](TopLevel.Boolean.md), [Object](TopLevel.Object.md), [Object](TopLevel.Object.md)) | <p>  Creates an Adyen payment intent using the given information, and associates it with the given order. |
| static [createPayPalOrder](dw.extensions.payments.SalesforcePaymentsMgr.md#createpaypalorderbasket-shipment-string-money-object)([Basket](dw.order.Basket.md), [Shipment](dw.order.Shipment.md), [String](TopLevel.String.md), [Money](dw.value.Money.md), [Object](TopLevel.Object.md)) | <p>  Creates a PayPal order using the given information, and associates it with the given basket. |
| static [createPaymentIntent](dw.extensions.payments.SalesforcePaymentsMgr.md#createpaymentintentbasket-shipment-string-money-boolean-object)([Basket](dw.order.Basket.md), [Shipment](dw.order.Shipment.md), [String](TopLevel.String.md), [Money](dw.value.Money.md), [Boolean](TopLevel.Boolean.md), [Object](TopLevel.Object.md)) | <p>  Creates a payment intent using the given information, and associates it with the given basket. |
| ~~static [detachPaymentMethod](dw.extensions.payments.SalesforcePaymentsMgr.md#detachpaymentmethodsalesforcepaymentmethod)([SalesforcePaymentMethod](dw.extensions.payments.SalesforcePaymentMethod.md))~~ | Detaches the given payment method from its associated customer. |
| static [getAdyenSavedPaymentMethods](dw.extensions.payments.SalesforcePaymentsMgr.md#getadyensavedpaymentmethodscustomer)([Customer](dw.customer.Customer.md)) | Returns a collection containing the Adyen payment methods saved to be presented to the given customer for reuse  in checkouts. |
| ~~static [getAttachedPaymentMethods](dw.extensions.payments.SalesforcePaymentsMgr.md#getattachedpaymentmethodscustomer)([Customer](dw.customer.Customer.md))~~ | Returns a collection containing the payment methods attached to the given customer. |
| static [getOffSessionPaymentMethods](dw.extensions.payments.SalesforcePaymentsMgr.md#getoffsessionpaymentmethodscustomer)([Customer](dw.customer.Customer.md)) | Returns a collection containing the payment methods for the given customer set up for future off session reuse. |
| static [getPayPalOrder](dw.extensions.payments.SalesforcePaymentsMgr.md#getpaypalorderbasket)([Basket](dw.order.Basket.md)) | Returns the PayPal order for the given basket, or `null` if the given basket has none. |
| static [getPayPalOrder](dw.extensions.payments.SalesforcePaymentsMgr.md#getpaypalorderorder)([Order](dw.order.Order.md)) | Returns the PayPal order for the given order, or `null` if the given order has none. |
| static [getPaymentDetails](dw.extensions.payments.SalesforcePaymentsMgr.md#getpaymentdetailsorderpaymentinstrument)([OrderPaymentInstrument](dw.order.OrderPaymentInstrument.md)) | Returns the details to the Salesforce Payments payment associated with the given payment instrument, or  `null` if the given payment instrument has none. |
| static [getPaymentIntent](dw.extensions.payments.SalesforcePaymentsMgr.md#getpaymentintentbasket)([Basket](dw.order.Basket.md)) | Returns the payment intent for the given basket, or `null` if the given basket has none. |
| static [getPaymentIntent](dw.extensions.payments.SalesforcePaymentsMgr.md#getpaymentintentorder)([Order](dw.order.Order.md)) | Returns the payment intent for the given order, or `null` if the given order has none. |
| static [getPaymentsSiteConfig](dw.extensions.payments.SalesforcePaymentsMgr.md#getpaymentssiteconfig)() | Returns a payments site configuration object for the current site. |
| static [getPaymentsZone](dw.extensions.payments.SalesforcePaymentsMgr.md#getpaymentszonestring)([String](TopLevel.String.md)) | Returns a payments zone object for the passed in payments zone ID. |
| static [getSavedPaymentMethods](dw.extensions.payments.SalesforcePaymentsMgr.md#getsavedpaymentmethodscustomer)([Customer](dw.customer.Customer.md)) | Returns a collection containing the payment methods saved to be presented to the given customer for reuse in  checkouts. |
| static [handleAdyenAdditionalDetails](dw.extensions.payments.SalesforcePaymentsMgr.md#handleadyenadditionaldetailsorder-string-object)([Order](dw.order.Order.md), [String](TopLevel.String.md), [Object](TopLevel.Object.md)) | <p>  Handles the given additional Adyen payment details and associates the associated payment with the given order, if  applicable. |
| static [onCustomerRegistered](dw.extensions.payments.SalesforcePaymentsMgr.md#oncustomerregisteredorder)([Order](dw.order.Order.md)) | Handles the account registration of the shopper who placed the given order. |
| static [refundAdyenPayment](dw.extensions.payments.SalesforcePaymentsMgr.md#refundadyenpaymentorderpaymentinstrument-money-object)([OrderPaymentInstrument](dw.order.OrderPaymentInstrument.md), [Money](dw.value.Money.md), [Object](TopLevel.Object.md)) | Refunds previously captured funds for the given order payment instrument. |
| static [refundPaymentIntent](dw.extensions.payments.SalesforcePaymentsMgr.md#refundpaymentintentsalesforcepaymentintent-money-object)([SalesforcePaymentIntent](dw.extensions.payments.SalesforcePaymentIntent.md), [Money](dw.value.Money.md), [Object](TopLevel.Object.md)) | Refunds previously captured funds for the given payment intent. |
| static [removeAdyenSavedPaymentMethod](dw.extensions.payments.SalesforcePaymentsMgr.md#removeadyensavedpaymentmethodsalesforceadyensavedpaymentmethod)([SalesforceAdyenSavedPaymentMethod](dw.extensions.payments.SalesforceAdyenSavedPaymentMethod.md)) | Deletes an Adyen saved payment method. |
| static [removeSavedPaymentMethod](dw.extensions.payments.SalesforcePaymentsMgr.md#removesavedpaymentmethodsalesforcepaymentmethod)([SalesforcePaymentMethod](dw.extensions.payments.SalesforcePaymentMethod.md)) | Removes the given saved payment method so that it is no longer presented to the given customer for reuse in  checkouts. |
| static [resolvePaymentsZone](dw.extensions.payments.SalesforcePaymentsMgr.md#resolvepaymentszoneobject)([Object](TopLevel.Object.md)) | Resolves and returns the payments zone object for the passed in payments zone properties object. |
| static [reverseAdyenPayment](dw.extensions.payments.SalesforcePaymentsMgr.md#reverseadyenpaymentorderpaymentinstrument-object)([OrderPaymentInstrument](dw.order.OrderPaymentInstrument.md), [Object](TopLevel.Object.md)) | Reverses the authorisation for the given order payment instrument. |
| static [savePaymentMethod](dw.extensions.payments.SalesforcePaymentsMgr.md#savepaymentmethodcustomer-salesforcepaymentmethod)([Customer](dw.customer.Customer.md), [SalesforcePaymentMethod](dw.extensions.payments.SalesforcePaymentMethod.md)) | Saves the given payment method to be presented to the given customer for reuse in subsequent checkouts. |
| static [setPaymentDetails](dw.extensions.payments.SalesforcePaymentsMgr.md#setpaymentdetailsorderpaymentinstrument-salesforcepaymentdetails)([OrderPaymentInstrument](dw.order.OrderPaymentInstrument.md), [SalesforcePaymentDetails](dw.extensions.payments.SalesforcePaymentDetails.md)) | Sets the details to the Salesforce Payments payment associated with the given payment instrument. |
| static [updatePaymentIntent](dw.extensions.payments.SalesforcePaymentsMgr.md#updatepaymentintentsalesforcepaymentintent-shipment-money-string-object)([SalesforcePaymentIntent](dw.extensions.payments.SalesforcePaymentIntent.md), [Shipment](dw.order.Shipment.md), [Money](dw.value.Money.md), [String](TopLevel.String.md), [Object](TopLevel.Object.md)) | Updates the provided information in the given payment intent. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### CANCELLATION_REASON_ABANDONED

- CANCELLATION_REASON_ABANDONED: [String](TopLevel.String.md) = "abandoned"
  - : Cancellation reason indicating customer abandoned payment.


---

### CANCELLATION_REASON_DUPLICATE

- CANCELLATION_REASON_DUPLICATE: [String](TopLevel.String.md) = "duplicate"
  - : Cancellation reason indicating payment intent was a duplicate.


---

### CANCELLATION_REASON_FRAUDULENT

- CANCELLATION_REASON_FRAUDULENT: [String](TopLevel.String.md) = "fraudulent"
  - : Cancellation reason indicating payment was fraudulent.


---

### CANCELLATION_REASON_REQUESTED_BY_CUSTOMER

- CANCELLATION_REASON_REQUESTED_BY_CUSTOMER: [String](TopLevel.String.md) = "requested_by_customer"
  - : Cancellation reason indicating customer action or request.


---

### REFUND_REASON_DUPLICATE

- REFUND_REASON_DUPLICATE: [String](TopLevel.String.md) = "duplicate"
  - : Refund reason indicating payment intent was a duplicate.


---

### REFUND_REASON_FRAUDULENT

- REFUND_REASON_FRAUDULENT: [String](TopLevel.String.md) = "fraudulent"
  - : Refund reason indicating payment was fraudulent.


---

### REFUND_REASON_REQUESTED_BY_CUSTOMER

- REFUND_REASON_REQUESTED_BY_CUSTOMER: [String](TopLevel.String.md) = "requested_by_customer"
  - : Refund reason indicating customer action or request.


---

## Property Details

### paymentsSiteConfig
- paymentsSiteConfig: [SalesforcePaymentsSiteConfiguration](dw.extensions.payments.SalesforcePaymentsSiteConfiguration.md) `(read-only)`
  - : Returns a payments site configuration object for the current site.


---

## Method Details

### attachPaymentMethod(SalesforcePaymentMethod, Customer)
- ~~static attachPaymentMethod(paymentMethod: [SalesforcePaymentMethod](dw.extensions.payments.SalesforcePaymentMethod.md), customer: [Customer](dw.customer.Customer.md)): void~~
  - : Attaches the given payment method to the given customer. Use this method to attach a payment method of type
      [SalesforcePaymentMethod.TYPE_CARD](dw.extensions.payments.SalesforcePaymentMethod.md#type_card) to a shopper who registers as a customer after placing an order, and
      has affirmatively elected to save their card as part of the registration process. This method will throw an error
      if passed incompatible payment method and/or customer objects.


    **Parameters:**
    - paymentMethod - payment method to attach to customer
    - customer - customer whose payment method to attach

    **Throws:**
    - Exception - if there was an error attaching the payment method to the customer

    **Deprecated:**
:::warning
use [onCustomerRegistered(Order)](dw.extensions.payments.SalesforcePaymentsMgr.md#oncustomerregisteredorder) and
            [savePaymentMethod(Customer, SalesforcePaymentMethod)](dw.extensions.payments.SalesforcePaymentsMgr.md#savepaymentmethodcustomer-salesforcepaymentmethod)

:::

---

### authorizePayPalOrder(SalesforcePayPalOrder)
- static authorizePayPalOrder(paypalOrder: [SalesforcePayPalOrder](dw.extensions.payments.SalesforcePayPalOrder.md)): [Status](dw.system.Status.md)
  - : Authorizes the given PayPal order.
      
      
      The PayPal order must be in a status that supports authorization. See the PayPal documentation for more details.


    **Parameters:**
    - paypalOrder - PayPal order to authorize

    **Returns:**
    - Status 'OK' or 'ERROR'. Status detail `'error'` contains the PayPal error information, if it
              is available in the response.


    **Throws:**
    - Exception - if there was an error authorizing the PayPal order


---

### cancelPaymentIntent(SalesforcePaymentIntent, Object)
- static cancelPaymentIntent(paymentIntent: [SalesforcePaymentIntent](dw.extensions.payments.SalesforcePaymentIntent.md), paymentIntentProperties: [Object](TopLevel.Object.md)): [Status](dw.system.Status.md)
  - : Cancels the given payment intent. If a payment authorization has been made for the payment intent, the
      authorization is removed.
      
      
      The payment intent must be in a status that supports cancel. See the Stripe documentation for more details.
      
      
      
      
      The following Payment Intent property is supported:
      
      - `cancellationReason`- optional payment intent cancellation reason  


    **Parameters:**
    - paymentIntent - payment intent to capture
    - paymentIntentProperties - additional properties to pass to the create Payment Intent API

    **Returns:**
    - Status 'OK' or 'ERROR'. Status detail `'paymentintent'` contains the payment intent, if it is
              available in the Stripe response. Status detail `'error'` contains the Stripe error
              information, if it is available in the response.


    **Throws:**
    - Exception - if there was an error canceling the payment intent

    **See Also:**
    - [CANCELLATION_REASON_ABANDONED](dw.extensions.payments.SalesforcePaymentsMgr.md#cancellation_reason_abandoned)
    - [CANCELLATION_REASON_DUPLICATE](dw.extensions.payments.SalesforcePaymentsMgr.md#cancellation_reason_duplicate)
    - [CANCELLATION_REASON_FRAUDULENT](dw.extensions.payments.SalesforcePaymentsMgr.md#cancellation_reason_fraudulent)
    - [CANCELLATION_REASON_REQUESTED_BY_CUSTOMER](dw.extensions.payments.SalesforcePaymentsMgr.md#cancellation_reason_requested_by_customer)


---

### captureAdyenPayment(OrderPaymentInstrument, Money, Object)
- static captureAdyenPayment(orderPaymentInstrument: [OrderPaymentInstrument](dw.order.OrderPaymentInstrument.md), amount: [Money](dw.value.Money.md), transactionProperties: [Object](TopLevel.Object.md)): [Status](dw.system.Status.md)
  - : Captures funds for the given order payment instrument.
      
      
      The order payment instrument must be in a state that supports capture.
      
      
      
      
      The `amount` must be less than or equal to the amount available to capture.
      
      
      
      
      The following Transaction properties are supported:
      
      - `reference`- optional reference for the transaction, for example order number  


    **Parameters:**
    - orderPaymentInstrument - payment instrument to capture
    - amount - amount to capture
    - transactionProperties - properties to pass to the capture Adyen Payment API

    **Returns:**
    - Status 'OK' or 'ERROR'.

    **Throws:**
    - Exception - if there was an error capturing the payment instrument


---

### capturePayPalOrder(SalesforcePayPalOrder)
- static capturePayPalOrder(paypalOrder: [SalesforcePayPalOrder](dw.extensions.payments.SalesforcePayPalOrder.md)): [Status](dw.system.Status.md)
  - : Captures funds for the given PayPal order.
      
      
      The PayPal order must be in a status that supports capture. See the PayPal documentation for more details.


    **Parameters:**
    - paypalOrder - PayPal order to capture

    **Returns:**
    - Status 'OK' or 'ERROR'. Status detail `'error'` contains the PayPal error information, if it
              is available in the response.


    **Throws:**
    - Exception - if there was an error capturing the PayPal order


---

### capturePaymentIntent(SalesforcePaymentIntent, Money)
- static capturePaymentIntent(paymentIntent: [SalesforcePaymentIntent](dw.extensions.payments.SalesforcePaymentIntent.md), amount: [Money](dw.value.Money.md)): [Status](dw.system.Status.md)
  - : Captures funds for the given payment intent.
      
      
      The payment intent must be in a status that supports capture. See the Stripe documentation for more details.
      
      
      
      
      If `amount` is not specified, the default is the full amount available to capture. If specified, the
      amount must be less than or equal to the amount available to capture.


    **Parameters:**
    - paymentIntent - payment intent to capture
    - amount - optional amount to capture, defaults to amount available to capture

    **Returns:**
    - Status 'OK' or 'ERROR'. Status detail `'error'` contains the Stripe error information, if it
              is available in the response.


    **Throws:**
    - Exception - if there was an error capturing the payment intent


---

### confirmPaymentIntent(Order, SalesforcePaymentMethod, Object)
- static confirmPaymentIntent(order: [Order](dw.order.Order.md), paymentMethod: [SalesforcePaymentMethod](dw.extensions.payments.SalesforcePaymentMethod.md), paymentIntentProperties: [Object](TopLevel.Object.md)): [Status](dw.system.Status.md)
  - : 
      
      Confirms a new payment intent using the given payment method, and associates it with the given order.
      
      
      
      
      The order must be prepared to contain products, shipments, and any other necessary data, and must be calculated
      to reflect the correct total amounts. If the order is not for the same [Customer](dw.customer.Customer.md) as the given
      payment method, an error is thrown.
      
      
      
      
      The specified payment method must be set up for off session future use or an error is thrown. iDeal and
      Bancontact implement reuse differently than other payment methods, but they can't be reused themselves.
      
      
      
      
      The following Payment Intent properties are supported:
      
      - `statementDescriptor`- optional statement descriptor    - `cardCaptureAutomatic`- optional `true`if the credit card payment should be    automatically captured at the time of the sale, or `false`if the credit card payment should be    captured later    
      
      If `cardCaptureAutomatic`is provided it is used to determine card capture timing, and otherwise the    default card capture timing set for the site is used.    
      
      If `statementDescriptor`is provided it is used as the complete description that appears on your    customers' statements for the payment, and if not a default statement descriptor is used. If a default statement    descriptor is set for the site it is used as the default, and otherwise the default statement descriptor for the    account will apply.    


    **Parameters:**
    - order - order to pay using Salesforce Payments
    - paymentMethod - payment method to use to pay
    - paymentIntentProperties - additional properties to pass to the create Payment Intent API

    **Returns:**
    - Status 'OK' or 'ERROR'. Status detail `'paymentintent'` contains the payment intent, if it is
              available in the Stripe response. Status detail `'error'` contains the Stripe error
              information, if it is available in the response.


    **Throws:**
    - Exception - if the parameter validation failed or there's an error confirming the payment intent


---

### createAdyenPaymentIntent(Order, Shipment, String, Money, Boolean, Object, Object)
- static createAdyenPaymentIntent(order: [Order](dw.order.Order.md), shipment: [Shipment](dw.order.Shipment.md), zoneId: [String](TopLevel.String.md), amount: [Money](dw.value.Money.md), customerRequired: [Boolean](TopLevel.Boolean.md), paymentData: [Object](TopLevel.Object.md), paymentIntentProperties: [Object](TopLevel.Object.md)): [Status](dw.system.Status.md)
  - : 
      
      Creates an Adyen payment intent using the given information, and associates it with the given order.
      
      
      
      
      The following Payment Intent properties are supported:
      
      - `type`- required payment method type, such as [SalesforcePaymentMethod.TYPE_CARD](dw.extensions.payments.SalesforcePaymentMethod.md#type_card)  - `cardCaptureAutomatic`- optional `true`if the credit card payment should be    automatically captured at the time of the sale, or `false`if the credit card payment should be    captured later        - `storePaymentMethod`- optional `true`if the payment method should be stored for      future usage, or `false`if not      
      
      If `cardCaptureAutomatic`is provided it is used to determine card capture timing, and otherwise the      default card capture timing set for the site is used.      


    **Parameters:**
    - order - order to checkout and pay using Salesforce Payments
    - shipment - shipment to use for shipping information in the payment intent
    - zoneId - id of the payment zone
    - amount - payment amount
    - customerRequired - `true` if an Adyen shopper reference must be associated with the transaction             and needs to be created if it does not already exist for the given ecom customer or `false`             a shopper reference does not have to be associated with the transaction. A customer is required if             storing a payment method for future usage or using an existing stored payment method.
    - paymentData - Adyen specific payment data passed directly from the client as-is
    - paymentIntentProperties - properties to pass to the create Payment Intent API

    **Returns:**
    - Status 'OK' or 'ERROR'. Status detail `'paymentintent'` contains the payment intent, if it is
              available in the Adyen response. Status detail `'error'` contains the Adyen error information,
              if it is available in the response.



---

### createPayPalOrder(Basket, Shipment, String, Money, Object)
- static createPayPalOrder(basket: [Basket](dw.order.Basket.md), shipment: [Shipment](dw.order.Shipment.md), zoneId: [String](TopLevel.String.md), amount: [Money](dw.value.Money.md), paypalOrderProperties: [Object](TopLevel.Object.md)): [Status](dw.system.Status.md)
  - : 
      
      Creates a PayPal order using the given information, and associates it with the given basket.
      
      
      
      
      The following PayPal order properties are supported:
      
      - `fundingSource`- required funding source, such as [SalesforcePayPalOrder.TYPE_PAYPAL](dw.extensions.payments.SalesforcePayPalOrder.md#type_paypal)  - `intent`- optional order capture timing intent, such as    [SalesforcePayPalOrder.INTENT_AUTHORIZE](dw.extensions.payments.SalesforcePayPalOrder.md#intent_authorize)or [SalesforcePayPalOrder.INTENT_CAPTURE](dw.extensions.payments.SalesforcePayPalOrder.md#intent_capture)    - `shippingPreference`- optional shipping preference, such as `"GET_FROM_FILE"`      - `userAction`- optional user action, such as `"PAY_NOW"`
      
      If `intent`is provided it is used to determine manual or automatic capture, and otherwise the default        card capture timing set for the site is used.        


    **Parameters:**
    - basket - basket to checkout and pay using Salesforce Payments
    - shipment - shipment to use for shipping information in the payment intent
    - zoneId - id of the payment zone
    - amount - payment amount
    - paypalOrderProperties - properties to pass to the create PayPal order API

    **Returns:**
    - Status 'OK' or 'ERROR'. Status detail `'paypalorder'` contains the PayPal order, if it is
              available in the PayPal response. Status detail `'error'` contains the PayPal error
              information, if it is available in the response.



---

### createPaymentIntent(Basket, Shipment, String, Money, Boolean, Object)
- static createPaymentIntent(basket: [Basket](dw.order.Basket.md), shipment: [Shipment](dw.order.Shipment.md), zoneId: [String](TopLevel.String.md), amount: [Money](dw.value.Money.md), stripeCustomerRequired: [Boolean](TopLevel.Boolean.md), paymentIntentProperties: [Object](TopLevel.Object.md)): [Status](dw.system.Status.md)
  - : 
      
      Creates a payment intent using the given information, and associates it with the given basket.
      
      
      
      
      The following Payment Intent properties are supported:
      
      - `type`- required payment method type, such as [SalesforcePaymentMethod.TYPE_CARD](dw.extensions.payments.SalesforcePaymentMethod.md#type_card)  - `statementDescriptor`- optional statement descriptor        - `cardCaptureAutomatic`- optional `true`if the credit card payment should be      automatically captured at the time of the sale, or `false`if the credit card payment should be      captured later            - `setupFutureUsage`- optional future usage setup value, such as        [SalesforcePaymentIntent.SETUP_FUTURE_USAGE_ON_SESSION](dw.extensions.payments.SalesforcePaymentIntent.md#setup_future_usage_on_session)
      
      The `stripeCustomerRequired`must be set to `true`if the payment will be set up for future        usage, whether on session or off session. If `true`then if a Stripe Customer is associated with the        shopper then it will be used, and otherwise a new Stripe Customer will be created. The new Stripe Customer will        be associated with the shopper if logged into a registered customer account for the site.        
      
      If `cardCaptureAutomatic`is provided it is used to determine card capture timing, and otherwise the        default card capture timing set for the site is used.        
      
      If `statementDescriptor`is provided it is used as the complete description that appears on your        customers' statements for the payment, and if not a default statement descriptor is used. If a default statement        descriptor is set for the site it is used as the default, and otherwise the default statement descriptor for the        account will apply.        
      
      If `setupFutureUsage`is provided it will be used to prepare the payment to be set up for future usage        at confirmation time. When set, this future usage setup value must match the value used at confirmation time.        


    **Parameters:**
    - basket - basket to checkout and pay using Salesforce Payments
    - shipment - shipment to use for shipping information in the payment intent
    - zoneId - id of the payment zone
    - amount - payment amount
    - stripeCustomerRequired - `true` if a Stripe Customer must be associated with the payment intent,             and would be created if it doesn't already exist, or `false` if a Stripe Customer does not             have to be associated with the payment intent
    - paymentIntentProperties - properties to pass to the create Payment Intent API

    **Returns:**
    - Status 'OK' or 'ERROR'. Status detail `'paymentintent'` contains the payment intent, if it is
              available in the Stripe response. Status detail `'error'` contains the Stripe error
              information, if it is available in the response.



---

### detachPaymentMethod(SalesforcePaymentMethod)
- ~~static detachPaymentMethod(paymentMethod: [SalesforcePaymentMethod](dw.extensions.payments.SalesforcePaymentMethod.md)): void~~
  - : Detaches the given payment method from its associated customer. Once detached the payment method remains
      associated with payment intents in the payment account, but is no longer saved for use by the customer in future
      orders.


    **Parameters:**
    - paymentMethod - payment method to detach from customer

    **Throws:**
    - Exception - if there was an error detaching the payment method from its customer

    **Deprecated:**
:::warning
use [removeSavedPaymentMethod(SalesforcePaymentMethod)](dw.extensions.payments.SalesforcePaymentsMgr.md#removesavedpaymentmethodsalesforcepaymentmethod)
:::

---

### getAdyenSavedPaymentMethods(Customer)
- static getAdyenSavedPaymentMethods(customer: [Customer](dw.customer.Customer.md)): [Collection](dw.util.Collection.md)
  - : Returns a collection containing the Adyen payment methods saved to be presented to the given customer for reuse
      in checkouts. The collection will be empty if there are no payment methods saved for the customer, or there was
      an error retrieving the saved payment methods.


    **Parameters:**
    - customer - customer whose saved payment methods to get

    **Returns:**
    - collection of saved payment methods

    **Throws:**
    - Exception - if the given customer is `null` or `undefined`, or there is configuration              missing that is required to retrieve the saved payment methods


---

### getAttachedPaymentMethods(Customer)
- ~~static getAttachedPaymentMethods(customer: [Customer](dw.customer.Customer.md)): [Collection](dw.util.Collection.md)~~
  - : Returns a collection containing the payment methods attached to the given customer. The collection will be empty
      if there are no payment methods attached to the customer, or there was an error retrieving the attached payment
      methods.


    **Parameters:**
    - customer - customer whose payment methods to get

    **Returns:**
    - collection of attached payment methods

    **Throws:**
    - Exception - if the given customer is `null` or `undefined`

    **Deprecated:**
:::warning
use [getSavedPaymentMethods(Customer)](dw.extensions.payments.SalesforcePaymentsMgr.md#getsavedpaymentmethodscustomer)
:::

---

### getOffSessionPaymentMethods(Customer)
- static getOffSessionPaymentMethods(customer: [Customer](dw.customer.Customer.md)): [Collection](dw.util.Collection.md)
  - : Returns a collection containing the payment methods for the given customer set up for future off session reuse.
      The collection will be empty if there are no off session payment methods for the customer, or there was an error
      retrieving the off session payment methods.


    **Parameters:**
    - customer - customer whose off session payment methods to get

    **Returns:**
    - collection of off session payment methods

    **Throws:**
    - Exception - if the given customer is `null` or `undefined`, or there is an error              getting the off session payment methods


---

### getPayPalOrder(Basket)
- static getPayPalOrder(basket: [Basket](dw.order.Basket.md)): [SalesforcePayPalOrder](dw.extensions.payments.SalesforcePayPalOrder.md)
  - : Returns the PayPal order for the given basket, or `null` if the given basket has none.

    **Parameters:**
    - basket - basket to checkout and pay using Salesforce Payments

    **Returns:**
    - The PayPal order

    **Throws:**
    - Exception - if there was an error retrieving the PayPal order for the basket


---

### getPayPalOrder(Order)
- static getPayPalOrder(order: [Order](dw.order.Order.md)): [SalesforcePayPalOrder](dw.extensions.payments.SalesforcePayPalOrder.md)
  - : Returns the PayPal order for the given order, or `null` if the given order has none.

    **Parameters:**
    - order - order paid using Salesforce Payments

    **Returns:**
    - The PayPal order

    **Throws:**
    - Exception - if there was an error retrieving the PayPal order for the order


---

### getPaymentDetails(OrderPaymentInstrument)
- static getPaymentDetails(paymentInstrument: [OrderPaymentInstrument](dw.order.OrderPaymentInstrument.md)): [SalesforcePaymentDetails](dw.extensions.payments.SalesforcePaymentDetails.md)
  - : Returns the details to the Salesforce Payments payment associated with the given payment instrument, or
      `null` if the given payment instrument has none.


    **Parameters:**
    - paymentInstrument - payment instrument

    **Returns:**
    - The payment details

    **Throws:**
    - Exception - if paymentInstrument is null


---

### getPaymentIntent(Basket)
- static getPaymentIntent(basket: [Basket](dw.order.Basket.md)): [SalesforcePaymentIntent](dw.extensions.payments.SalesforcePaymentIntent.md)
  - : Returns the payment intent for the given basket, or `null` if the given basket has none.

    **Parameters:**
    - basket - basket to checkout and pay using Salesforce Payments

    **Returns:**
    - The payment intent

    **Throws:**
    - Exception - if there was an error retrieving the payment intent for the basket


---

### getPaymentIntent(Order)
- static getPaymentIntent(order: [Order](dw.order.Order.md)): [SalesforcePaymentIntent](dw.extensions.payments.SalesforcePaymentIntent.md)
  - : Returns the payment intent for the given order, or `null` if the given order has none.

    **Parameters:**
    - order - order paid using Salesforce Payments

    **Returns:**
    - The payment intent

    **Throws:**
    - Exception - if there was an error retrieving the payment intent for the order


---

### getPaymentsSiteConfig()
- static getPaymentsSiteConfig(): [SalesforcePaymentsSiteConfiguration](dw.extensions.payments.SalesforcePaymentsSiteConfiguration.md)
  - : Returns a payments site configuration object for the current site.

    **Returns:**
    - a payments site configuration or null if no payments site configuration found

    **Throws:**
    - Exception - if there is no current site


---

### getPaymentsZone(String)
- static getPaymentsZone(zoneId: [String](TopLevel.String.md)): [SalesforcePaymentsZone](dw.extensions.payments.SalesforcePaymentsZone.md)
  - : Returns a payments zone object for the passed in payments zone ID.

    **Parameters:**
    - zoneId - ID of the payments zone to retrieve and use to checkout and pay using Salesforce Payments

    **Returns:**
    - a payments zone or null if no payments zone with the given ID exists


---

### getSavedPaymentMethods(Customer)
- static getSavedPaymentMethods(customer: [Customer](dw.customer.Customer.md)): [Collection](dw.util.Collection.md)
  - : Returns a collection containing the payment methods saved to be presented to the given customer for reuse in
      checkouts. The collection will be empty if there are no payment methods saved for the customer, or there was an
      error retrieving the saved payment methods.


    **Parameters:**
    - customer - customer whose saved payment methods to get

    **Returns:**
    - collection of saved payment methods

    **Throws:**
    - Exception - if the given customer is `null` or `undefined`, or there is configuration              missing that is required to retrieve the saved payment methods


---

### handleAdyenAdditionalDetails(Order, String, Object)
- static handleAdyenAdditionalDetails(order: [Order](dw.order.Order.md), zoneId: [String](TopLevel.String.md), data: [Object](TopLevel.Object.md)): [Status](dw.system.Status.md)
  - : 
      
      Handles the given additional Adyen payment details and associates the associated payment with the given order, if
      applicable.
      
      
      
      
      Pass the state data from the Adyen `onAdditionalDetails` event as-is, without any encoding or other
      changes to the data or its structure. See the Adyen documentation for more information.


    **Parameters:**
    - order - order to checkout and pay using Salesforce Payments
    - zoneId - id of the payment zone
    - data - additional details state data

    **Returns:**
    - Status 'OK' or 'ERROR'. Status detail `'adyenpayment'` contains the payment details, if it is
              available in the Adyen response and the response resultCode is 'Authorised'. Status detail
              `'error'` contains the Adyen error information, if it is available in the response.



---

### onCustomerRegistered(Order)
- static onCustomerRegistered(order: [Order](dw.order.Order.md)): void
  - : Handles the account registration of the shopper who placed the given order. Use this method to ensure the
      registered customer profile is associated with the order in Salesforce Payments.


    **Parameters:**
    - order - order paid using Salesforce Payments

    **Throws:**
    - Exception - if there was an error attaching the payment method to the customer


---

### refundAdyenPayment(OrderPaymentInstrument, Money, Object)
- static refundAdyenPayment(orderPaymentInstrument: [OrderPaymentInstrument](dw.order.OrderPaymentInstrument.md), amount: [Money](dw.value.Money.md), transactionProperties: [Object](TopLevel.Object.md)): [Status](dw.system.Status.md)
  - : Refunds previously captured funds for the given order payment instrument.
      
      
      The order payment instrument must be in a state that supports refund.
      
      
      
      
      The `amount` must be less than or equal to the amount available to refund.
      
      
      
      
      The following Transaction properties are supported:
      
      - `reference`- optional reference for the transaction, for example order number  


    **Parameters:**
    - orderPaymentInstrument - payment instrument to refund
    - amount - amount to refund
    - transactionProperties - properties to pass to the refund Adyen Payment API

    **Returns:**
    - Status 'OK' or 'ERROR'.

    **Throws:**
    - Exception - if there was an error refunding the payment instrument


---

### refundPaymentIntent(SalesforcePaymentIntent, Money, Object)
- static refundPaymentIntent(paymentIntent: [SalesforcePaymentIntent](dw.extensions.payments.SalesforcePaymentIntent.md), amount: [Money](dw.value.Money.md), refundProperties: [Object](TopLevel.Object.md)): [Status](dw.system.Status.md)
  - : Refunds previously captured funds for the given payment intent.
      
      
      The payment intent must be in a state that supports refund. This includes its status as well as any previous
      refunds. See the Stripe documentation for more details.
      
      
      
      
      The following Payment Intent property is supported:
      
      - `reason`- optional payment intent refund reason  
      
      If `amount`is not specified, the default is the full amount available to refund. If specified, the  amount must be less than or equal to the amount available to refund.  


    **Parameters:**
    - paymentIntent - payment intent to refund
    - amount - optional amount to refund, defaults to amount previously captured
    - refundProperties - additional properties to pass to the refund API

    **Returns:**
    - Status 'OK' or 'ERROR'. Status detail `'error'` contains the Stripe error information, if it
              is available in the response.


    **Throws:**
    - Exception - if there was an error refunding the payment intent

    **See Also:**
    - [REFUND_REASON_DUPLICATE](dw.extensions.payments.SalesforcePaymentsMgr.md#refund_reason_duplicate)
    - [REFUND_REASON_FRAUDULENT](dw.extensions.payments.SalesforcePaymentsMgr.md#refund_reason_fraudulent)
    - [REFUND_REASON_REQUESTED_BY_CUSTOMER](dw.extensions.payments.SalesforcePaymentsMgr.md#refund_reason_requested_by_customer)


---

### removeAdyenSavedPaymentMethod(SalesforceAdyenSavedPaymentMethod)
- static removeAdyenSavedPaymentMethod(savedPaymentMethod: [SalesforceAdyenSavedPaymentMethod](dw.extensions.payments.SalesforceAdyenSavedPaymentMethod.md)): void
  - : Deletes an Adyen saved payment method.

    **Parameters:**
    - savedPaymentMethod - the saved payment method to delete

    **Throws:**
    - Exception - if the saved payment method is `null` or `undefined`, or there is              configuration missing that is required to delete the saved payment method


---

### removeSavedPaymentMethod(SalesforcePaymentMethod)
- static removeSavedPaymentMethod(paymentMethod: [SalesforcePaymentMethod](dw.extensions.payments.SalesforcePaymentMethod.md)): void
  - : Removes the given saved payment method so that it is no longer presented to the given customer for reuse in
      checkouts. The payment method remains in the payment account, but is no longer saved for use by the customer.


    **Parameters:**
    - paymentMethod - payment method to detach from customer

    **Throws:**
    - Exception - if there was an error removing the saved payment method from its customer


---

### resolvePaymentsZone(Object)
- static resolvePaymentsZone(paymentsZoneProperties: [Object](TopLevel.Object.md)): [SalesforcePaymentsZone](dw.extensions.payments.SalesforcePaymentsZone.md)
  - : Resolves and returns the payments zone object for the passed in payments zone properties object. If an empty
      object is provided, the default payments zone will be returned if it exists.
      
      
      The following payments zone properties are supported:
      
      - `countryCode`- optional country code of the shopper, or `null`if not known
      - `currency`- optional basket currency, or `null`if not known


    **Parameters:**
    - paymentsZoneProperties - properties to use to retrieve the payments zone for to use to checkout and pay             using Salesforce Payments

    **Returns:**
    - a payments zone

    **Throws:**
    - Exception - if no default payments zone exists


---

### reverseAdyenPayment(OrderPaymentInstrument, Object)
- static reverseAdyenPayment(orderPaymentInstrument: [OrderPaymentInstrument](dw.order.OrderPaymentInstrument.md), transactionProperties: [Object](TopLevel.Object.md)): [Status](dw.system.Status.md)
  - : Reverses the authorisation for the given order payment instrument.
      
      
      The order payment instrument must be in a state that supports reversal.
      
      
      
      
      The following Transaction properties are supported:
      
      - `reference`- optional reference for the transaction, for example order number  


    **Parameters:**
    - orderPaymentInstrument - payment instrument to reverse
    - transactionProperties - properties to pass to the reverse Adyen Payment API

    **Returns:**
    - Status 'OK' or 'ERROR'.

    **Throws:**
    - Exception - if there was an error reversing the payment instrument


---

### savePaymentMethod(Customer, SalesforcePaymentMethod)
- static savePaymentMethod(customer: [Customer](dw.customer.Customer.md), paymentMethod: [SalesforcePaymentMethod](dw.extensions.payments.SalesforcePaymentMethod.md)): void
  - : Saves the given payment method to be presented to the given customer for reuse in subsequent checkouts. This
      method will throw an error if passed incompatible payment method and/or customer objects.


    **Parameters:**
    - customer - customer for which to save the payment method
    - paymentMethod - payment method to save for the customer

    **Throws:**
    - Exception - if there was an error saving the payment method for the customer


---

### setPaymentDetails(OrderPaymentInstrument, SalesforcePaymentDetails)
- static setPaymentDetails(paymentInstrument: [OrderPaymentInstrument](dw.order.OrderPaymentInstrument.md), paymentDetails: [SalesforcePaymentDetails](dw.extensions.payments.SalesforcePaymentDetails.md)): void
  - : Sets the details to the Salesforce Payments payment associated with the given payment instrument.

    **Parameters:**
    - paymentInstrument - payment instrument
    - paymentDetails - payment details

    **Throws:**
    - Exception - if either paymentInstrument or paymentDetails is null

    **See Also:**
    - [SalesforcePaymentMethod.getPaymentDetails(OrderPaymentInstrument)](dw.extensions.payments.SalesforcePaymentMethod.md#getpaymentdetailsorderpaymentinstrument)
    - [SalesforcePayPalOrder.getPaymentDetails(OrderPaymentInstrument)](dw.extensions.payments.SalesforcePayPalOrder.md#getpaymentdetailsorderpaymentinstrument)


---

### updatePaymentIntent(SalesforcePaymentIntent, Shipment, Money, String, Object)
- static updatePaymentIntent(paymentIntent: [SalesforcePaymentIntent](dw.extensions.payments.SalesforcePaymentIntent.md), shipment: [Shipment](dw.order.Shipment.md), amount: [Money](dw.value.Money.md), orderNo: [String](TopLevel.String.md), paymentIntentProperties: [Object](TopLevel.Object.md)): [Status](dw.system.Status.md)
  - : Updates the provided information in the given payment intent.
      
      
      The payment intent must be in a status that supports update. See the Stripe documentation for more details.
      
      
      
      
      The following Payment Intent properties are supported:
      
      - `statementDescriptor`- optional statement descriptor    - `cardCaptureAutomatic`- optional `true`if the credit card payment should be    automatically captured at the time of the sale, or `false`if the credit card payment should be    captured later    
      
      If `cardCaptureAutomatic`is provided it is used to determine card capture timing, and otherwise the    default card capture timing set for the site is used.    
      
      If `statementDescriptor`is provided it is used as the complete description that appears on your    customers' statements for the payment, and if not a default statement descriptor is used. If a default statement    descriptor is set for the site it is used as the default, and otherwise the default statement descriptor for the    account will apply.    


    **Parameters:**
    - paymentIntent - payment intent to update
    - shipment - optional shipment to use to update shipping information in the payment intent
    - amount - optional new payment amount
    - orderNo - optional order no of [Order](dw.order.Order.md) to associate with the payment intent in metadata
    - paymentIntentProperties - optional additional properties to pass to the update Payment Intent API

    **Returns:**
    - Status 'OK' or 'ERROR'. Status detail `'paymentintent'` contains the payment intent, if it is
              available in the Stripe response. Status detail `'error'` contains the Stripe error
              information, if it is available in the response.


    **Throws:**
    - Exception - if the parameter validation failed or there's an error updating the payment intent


---

<!-- prettier-ignore-end -->
