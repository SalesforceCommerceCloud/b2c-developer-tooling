<!-- prettier-ignore-start -->
# Class SalesforcePaymentIntent

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.extensions.payments.SalesforcePaymentIntent](dw.extensions.payments.SalesforcePaymentIntent.md)



Salesforce Payments representation of a Stripe payment intent object. See Salesforce Payments documentation for how
to gain access and configure it for use on your sites.




A payment intent is automatically created when a shopper is ready to pay for items in their basket. It becomes
confirmed when the shopper provides information to the payment provider that is acceptable to authorize payment for a
given amount. Once that information has been provided it becomes available as the payment method associated with the
payment intent.



## Constant Summary

| Constant | Description |
| --- | --- |
| [SETUP_FUTURE_USAGE_OFF_SESSION](#setup_future_usage_off_session): [String](TopLevel.String.md) = "off_session" | Represents the payment method setup future usage is off session. |
| [SETUP_FUTURE_USAGE_ON_SESSION](#setup_future_usage_on_session): [String](TopLevel.String.md) = "on_session" | Represents the payment method setup future usage is on session. |

## Property Summary

| Property | Description |
| --- | --- |
| [ID](#id): [String](TopLevel.String.md) `(read-only)` | Returns the identifier of this payment intent. |
| [amount](#amount): [Money](dw.value.Money.md) `(read-only)` | Returns the amount of this payment intent. |
| [cancelable](#cancelable): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns `true` if this payment intent has a status which indicates it can be canceled,  or `false` if its status does not indicate it can be canceled. |
| [clientSecret](#clientsecret): [String](TopLevel.String.md) `(read-only)` | Returns the client secret of this payment intent. |
| [confirmed](#confirmed): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns `true` if this payment intent has been confirmed, or `false` if not. |
| [paymentMethod](#paymentmethod): [SalesforcePaymentMethod](dw.extensions.payments.SalesforcePaymentMethod.md) `(read-only)` | Returns the payment method for this payment intent, or `null` if none has been established. |
| [refundable](#refundable): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns `true` if this payment intent has a status and other state which indicate it can be refunded,  or `false` if it cannot be refunded. |
| [setupFutureUsage](#setupfutureusage): [String](TopLevel.String.md) `(read-only)` | Returns [SETUP_FUTURE_USAGE_OFF_SESSION](dw.extensions.payments.SalesforcePaymentIntent.md#setup_future_usage_off_session) or [SETUP_FUTURE_USAGE_ON_SESSION](dw.extensions.payments.SalesforcePaymentIntent.md#setup_future_usage_on_session) to indicate how the payment  intent can be used in the future or returns `null` if future usage is not set up. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getAmount](dw.extensions.payments.SalesforcePaymentIntent.md#getamount)() | Returns the amount of this payment intent. |
| [getClientSecret](dw.extensions.payments.SalesforcePaymentIntent.md#getclientsecret)() | Returns the client secret of this payment intent. |
| [getID](dw.extensions.payments.SalesforcePaymentIntent.md#getid)() | Returns the identifier of this payment intent. |
| [getPaymentInstrument](dw.extensions.payments.SalesforcePaymentIntent.md#getpaymentinstrumentbasket)([Basket](dw.order.Basket.md)) | Returns the payment instrument for this payment intent in the given basket, or `null` if the given  basket has none. |
| [getPaymentInstrument](dw.extensions.payments.SalesforcePaymentIntent.md#getpaymentinstrumentorder)([Order](dw.order.Order.md)) | Returns the payment instrument for this payment intent in the given order, or `null` if the given  order has none. |
| [getPaymentMethod](dw.extensions.payments.SalesforcePaymentIntent.md#getpaymentmethod)() | Returns the payment method for this payment intent, or `null` if none has been established. |
| [getSetupFutureUsage](dw.extensions.payments.SalesforcePaymentIntent.md#getsetupfutureusage)() | Returns [SETUP_FUTURE_USAGE_OFF_SESSION](dw.extensions.payments.SalesforcePaymentIntent.md#setup_future_usage_off_session) or [SETUP_FUTURE_USAGE_ON_SESSION](dw.extensions.payments.SalesforcePaymentIntent.md#setup_future_usage_on_session) to indicate how the payment  intent can be used in the future or returns `null` if future usage is not set up. |
| [isCancelable](dw.extensions.payments.SalesforcePaymentIntent.md#iscancelable)() | Returns `true` if this payment intent has a status which indicates it can be canceled,  or `false` if its status does not indicate it can be canceled. |
| [isConfirmed](dw.extensions.payments.SalesforcePaymentIntent.md#isconfirmed)() | Returns `true` if this payment intent has been confirmed, or `false` if not. |
| [isRefundable](dw.extensions.payments.SalesforcePaymentIntent.md#isrefundable)() | Returns `true` if this payment intent has a status and other state which indicate it can be refunded,  or `false` if it cannot be refunded. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### SETUP_FUTURE_USAGE_OFF_SESSION

- SETUP_FUTURE_USAGE_OFF_SESSION: [String](TopLevel.String.md) = "off_session"
  - : Represents the payment method setup future usage is off session.


---

### SETUP_FUTURE_USAGE_ON_SESSION

- SETUP_FUTURE_USAGE_ON_SESSION: [String](TopLevel.String.md) = "on_session"
  - : Represents the payment method setup future usage is on session.


---

## Property Details

### ID
- ID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the identifier of this payment intent.


---

### amount
- amount: [Money](dw.value.Money.md) `(read-only)`
  - : Returns the amount of this payment intent.


---

### cancelable
- cancelable: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns `true` if this payment intent has a status which indicates it can be canceled,
      or `false` if its status does not indicate it can be canceled.



---

### clientSecret
- clientSecret: [String](TopLevel.String.md) `(read-only)`
  - : Returns the client secret of this payment intent.


---

### confirmed
- confirmed: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns `true` if this payment intent has been confirmed, or `false` if not.


---

### paymentMethod
- paymentMethod: [SalesforcePaymentMethod](dw.extensions.payments.SalesforcePaymentMethod.md) `(read-only)`
  - : Returns the payment method for this payment intent, or `null` if none has been established.


---

### refundable
- refundable: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns `true` if this payment intent has a status and other state which indicate it can be refunded,
      or `false` if it cannot be refunded.



---

### setupFutureUsage
- setupFutureUsage: [String](TopLevel.String.md) `(read-only)`
  - : Returns [SETUP_FUTURE_USAGE_OFF_SESSION](dw.extensions.payments.SalesforcePaymentIntent.md#setup_future_usage_off_session) or [SETUP_FUTURE_USAGE_ON_SESSION](dw.extensions.payments.SalesforcePaymentIntent.md#setup_future_usage_on_session) to indicate how the payment
      intent can be used in the future or returns `null` if future usage is not set up.


    **See Also:**
    - [SalesforcePaymentRequest.setSetupFutureUsage(Boolean)](dw.extensions.payments.SalesforcePaymentRequest.md#setsetupfutureusageboolean)
    - [SETUP_FUTURE_USAGE_OFF_SESSION](dw.extensions.payments.SalesforcePaymentIntent.md#setup_future_usage_off_session)
    - [SETUP_FUTURE_USAGE_ON_SESSION](dw.extensions.payments.SalesforcePaymentIntent.md#setup_future_usage_on_session)


---

## Method Details

### getAmount()
- getAmount(): [Money](dw.value.Money.md)
  - : Returns the amount of this payment intent.

    **Returns:**
    - payment intent amount


---

### getClientSecret()
- getClientSecret(): [String](TopLevel.String.md)
  - : Returns the client secret of this payment intent.

    **Returns:**
    - payment intent client secret


---

### getID()
- getID(): [String](TopLevel.String.md)
  - : Returns the identifier of this payment intent.

    **Returns:**
    - payment intent identifier


---

### getPaymentInstrument(Basket)
- getPaymentInstrument(basket: [Basket](dw.order.Basket.md)): [OrderPaymentInstrument](dw.order.OrderPaymentInstrument.md)
  - : Returns the payment instrument for this payment intent in the given basket, or `null` if the given
      basket has none.


    **Parameters:**
    - basket - basket

    **Returns:**
    - basket payment instrument


---

### getPaymentInstrument(Order)
- getPaymentInstrument(order: [Order](dw.order.Order.md)): [OrderPaymentInstrument](dw.order.OrderPaymentInstrument.md)
  - : Returns the payment instrument for this payment intent in the given order, or `null` if the given
      order has none.


    **Parameters:**
    - order - order

    **Returns:**
    - order payment instrument


---

### getPaymentMethod()
- getPaymentMethod(): [SalesforcePaymentMethod](dw.extensions.payments.SalesforcePaymentMethod.md)
  - : Returns the payment method for this payment intent, or `null` if none has been established.

    **Returns:**
    - payment method


---

### getSetupFutureUsage()
- getSetupFutureUsage(): [String](TopLevel.String.md)
  - : Returns [SETUP_FUTURE_USAGE_OFF_SESSION](dw.extensions.payments.SalesforcePaymentIntent.md#setup_future_usage_off_session) or [SETUP_FUTURE_USAGE_ON_SESSION](dw.extensions.payments.SalesforcePaymentIntent.md#setup_future_usage_on_session) to indicate how the payment
      intent can be used in the future or returns `null` if future usage is not set up.


    **Returns:**
    - setup future usage or `null` if future usage is not set up

    **See Also:**
    - [SalesforcePaymentRequest.setSetupFutureUsage(Boolean)](dw.extensions.payments.SalesforcePaymentRequest.md#setsetupfutureusageboolean)
    - [SETUP_FUTURE_USAGE_OFF_SESSION](dw.extensions.payments.SalesforcePaymentIntent.md#setup_future_usage_off_session)
    - [SETUP_FUTURE_USAGE_ON_SESSION](dw.extensions.payments.SalesforcePaymentIntent.md#setup_future_usage_on_session)


---

### isCancelable()
- isCancelable(): [Boolean](TopLevel.Boolean.md)
  - : Returns `true` if this payment intent has a status which indicates it can be canceled,
      or `false` if its status does not indicate it can be canceled.


    **Returns:**
    - `true` if this payment intent has a status which indicates it can be canceled


---

### isConfirmed()
- isConfirmed(): [Boolean](TopLevel.Boolean.md)
  - : Returns `true` if this payment intent has been confirmed, or `false` if not.

    **Returns:**
    - `true` if this payment intent has been confirmed


---

### isRefundable()
- isRefundable(): [Boolean](TopLevel.Boolean.md)
  - : Returns `true` if this payment intent has a status and other state which indicate it can be refunded,
      or `false` if it cannot be refunded.


    **Returns:**
    - `true` if this payment intent has a status and other state which indicate it can be refunded


---

<!-- prettier-ignore-end -->
