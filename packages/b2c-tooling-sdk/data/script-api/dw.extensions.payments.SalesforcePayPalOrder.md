<!-- prettier-ignore-start -->
# Class SalesforcePayPalOrder

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.extensions.payments.SalesforcePayPalOrder](dw.extensions.payments.SalesforcePayPalOrder.md)



Salesforce Payments representation of a PayPal order object. See Salesforce Payments documentation for how
to gain access and configure it for use on your sites.




A PayPal order is automatically created when a shopper is ready to pay for items in their basket. It becomes
completed when the shopper provides information to the payment provider that is acceptable to authorize payment for a
given amount.



## Constant Summary

| Constant | Description |
| --- | --- |
| [INTENT_AUTHORIZE](#intent_authorize): [String](TopLevel.String.md) = "AUTHORIZE" | Represents the `"AUTHORIZE"` intent, meaning manual capture. |
| [INTENT_CAPTURE](#intent_capture): [String](TopLevel.String.md) = "CAPTURE" | Represents the `"CAPTURE"` intent, meaning automatic capture. |
| [TYPE_PAYPAL](#type_paypal): [String](TopLevel.String.md) = "paypal" | Represents the PayPal funding source. |
| [TYPE_VENMO](#type_venmo): [String](TopLevel.String.md) = "venmo" | Represents the Venmo funding source. |

## Property Summary

| Property | Description |
| --- | --- |
| [ID](#id): [String](TopLevel.String.md) `(read-only)` | Returns the identifier of this PayPal order. |
| [amount](#amount): [Money](dw.value.Money.md) `(read-only)` | Returns the amount of this PayPal order. |
| [authorizationID](#authorizationid): [String](TopLevel.String.md) `(read-only)` | Returns the ID of the authorization against this order, or `null` if not available. |
| [captureID](#captureid): [String](TopLevel.String.md) `(read-only)` | Returns the ID of the capture against this order, or `null` if not available. |
| [completed](#completed): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns `true` if this PayPal order has been completed, or `false` if not. |
| [payer](#payer): [SalesforcePayPalOrderPayer](dw.extensions.payments.SalesforcePayPalOrderPayer.md) `(read-only)` | Returns the payer information for this PayPal order, or `null` if not known. |
| [shipping](#shipping): [SalesforcePayPalOrderAddress](dw.extensions.payments.SalesforcePayPalOrderAddress.md) `(read-only)` | Returns the shipping address for this PayPal order, or `null` if not known. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getAmount](dw.extensions.payments.SalesforcePayPalOrder.md#getamount)() | Returns the amount of this PayPal order. |
| [getAuthorizationID](dw.extensions.payments.SalesforcePayPalOrder.md#getauthorizationid)() | Returns the ID of the authorization against this order, or `null` if not available. |
| [getCaptureID](dw.extensions.payments.SalesforcePayPalOrder.md#getcaptureid)() | Returns the ID of the capture against this order, or `null` if not available. |
| [getID](dw.extensions.payments.SalesforcePayPalOrder.md#getid)() | Returns the identifier of this PayPal order. |
| [getPayer](dw.extensions.payments.SalesforcePayPalOrder.md#getpayer)() | Returns the payer information for this PayPal order, or `null` if not known. |
| [getPaymentDetails](dw.extensions.payments.SalesforcePayPalOrder.md#getpaymentdetailsorderpaymentinstrument)([OrderPaymentInstrument](dw.order.OrderPaymentInstrument.md)) | Returns the details to the Salesforce Payments payment for this PayPal order, using the given payment instrument. |
| [getPaymentInstrument](dw.extensions.payments.SalesforcePayPalOrder.md#getpaymentinstrumentbasket)([Basket](dw.order.Basket.md)) | Returns the payment instrument for this PayPal order in the given basket, or `null` if the given  basket has none. |
| [getPaymentInstrument](dw.extensions.payments.SalesforcePayPalOrder.md#getpaymentinstrumentorder)([Order](dw.order.Order.md)) | Returns the payment instrument for this PayPal order in the given order, or `null` if the given  order has none. |
| [getShipping](dw.extensions.payments.SalesforcePayPalOrder.md#getshipping)() | Returns the shipping address for this PayPal order, or `null` if not known. |
| [isCompleted](dw.extensions.payments.SalesforcePayPalOrder.md#iscompleted)() | Returns `true` if this PayPal order has been completed, or `false` if not. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### INTENT_AUTHORIZE

- INTENT_AUTHORIZE: [String](TopLevel.String.md) = "AUTHORIZE"
  - : Represents the `"AUTHORIZE"` intent, meaning manual capture.


---

### INTENT_CAPTURE

- INTENT_CAPTURE: [String](TopLevel.String.md) = "CAPTURE"
  - : Represents the `"CAPTURE"` intent, meaning automatic capture.


---

### TYPE_PAYPAL

- TYPE_PAYPAL: [String](TopLevel.String.md) = "paypal"
  - : Represents the PayPal funding source.


---

### TYPE_VENMO

- TYPE_VENMO: [String](TopLevel.String.md) = "venmo"
  - : Represents the Venmo funding source.


---

## Property Details

### ID
- ID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the identifier of this PayPal order.


---

### amount
- amount: [Money](dw.value.Money.md) `(read-only)`
  - : Returns the amount of this PayPal order.


---

### authorizationID
- authorizationID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the ID of the authorization against this order, or `null` if not available.


---

### captureID
- captureID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the ID of the capture against this order, or `null` if not available.


---

### completed
- completed: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns `true` if this PayPal order has been completed, or `false` if not.


---

### payer
- payer: [SalesforcePayPalOrderPayer](dw.extensions.payments.SalesforcePayPalOrderPayer.md) `(read-only)`
  - : Returns the payer information for this PayPal order, or `null` if not known.


---

### shipping
- shipping: [SalesforcePayPalOrderAddress](dw.extensions.payments.SalesforcePayPalOrderAddress.md) `(read-only)`
  - : Returns the shipping address for this PayPal order, or `null` if not known.


---

## Method Details

### getAmount()
- getAmount(): [Money](dw.value.Money.md)
  - : Returns the amount of this PayPal order.

    **Returns:**
    - PayPal order amount


---

### getAuthorizationID()
- getAuthorizationID(): [String](TopLevel.String.md)
  - : Returns the ID of the authorization against this order, or `null` if not available.

    **Returns:**
    - PayPal order authorization identifier


---

### getCaptureID()
- getCaptureID(): [String](TopLevel.String.md)
  - : Returns the ID of the capture against this order, or `null` if not available.

    **Returns:**
    - PayPal order capture identifier


---

### getID()
- getID(): [String](TopLevel.String.md)
  - : Returns the identifier of this PayPal order.

    **Returns:**
    - PayPal order identifier


---

### getPayer()
- getPayer(): [SalesforcePayPalOrderPayer](dw.extensions.payments.SalesforcePayPalOrderPayer.md)
  - : Returns the payer information for this PayPal order, or `null` if not known.

    **Returns:**
    - order payer information


---

### getPaymentDetails(OrderPaymentInstrument)
- getPaymentDetails(paymentInstrument: [OrderPaymentInstrument](dw.order.OrderPaymentInstrument.md)): [SalesforcePaymentDetails](dw.extensions.payments.SalesforcePaymentDetails.md)
  - : Returns the details to the Salesforce Payments payment for this PayPal order, using the given payment instrument.

    **Parameters:**
    - paymentInstrument - payment instrument

    **Returns:**
    - The payment details


---

### getPaymentInstrument(Basket)
- getPaymentInstrument(basket: [Basket](dw.order.Basket.md)): [OrderPaymentInstrument](dw.order.OrderPaymentInstrument.md)
  - : Returns the payment instrument for this PayPal order in the given basket, or `null` if the given
      basket has none.


    **Parameters:**
    - basket - basket

    **Returns:**
    - basket payment instrument


---

### getPaymentInstrument(Order)
- getPaymentInstrument(order: [Order](dw.order.Order.md)): [OrderPaymentInstrument](dw.order.OrderPaymentInstrument.md)
  - : Returns the payment instrument for this PayPal order in the given order, or `null` if the given
      order has none.


    **Parameters:**
    - order - order

    **Returns:**
    - order payment instrument


---

### getShipping()
- getShipping(): [SalesforcePayPalOrderAddress](dw.extensions.payments.SalesforcePayPalOrderAddress.md)
  - : Returns the shipping address for this PayPal order, or `null` if not known.

    **Returns:**
    - order shipping address


---

### isCompleted()
- isCompleted(): [Boolean](TopLevel.Boolean.md)
  - : Returns `true` if this PayPal order has been completed, or `false` if not.

    **Returns:**
    - `true` if this PayPal order has been completed


---

<!-- prettier-ignore-end -->
