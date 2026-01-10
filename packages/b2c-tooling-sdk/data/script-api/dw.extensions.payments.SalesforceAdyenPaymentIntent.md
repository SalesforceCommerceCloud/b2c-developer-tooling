<!-- prettier-ignore-start -->
# Class SalesforceAdyenPaymentIntent

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.extensions.payments.SalesforceAdyenPaymentIntent](dw.extensions.payments.SalesforceAdyenPaymentIntent.md)



Salesforce Payments representation of an Adyen payment intent object. See Salesforce Payments documentation for how
to gain access and configure it for use on your sites.



## Property Summary

| Property | Description |
| --- | --- |
| [ID](#id): [String](TopLevel.String.md) `(read-only)` | Returns the identifier of this payment intent. |
| [action](#action): [Object](TopLevel.Object.md) `(read-only)` | Returns the payment action for this payment intent. |
| [resultCode](#resultcode): [String](TopLevel.String.md) `(read-only)` | Returns the Adyen result code for this payment intent. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getAction](dw.extensions.payments.SalesforceAdyenPaymentIntent.md#getaction)() | Returns the payment action for this payment intent. |
| [getID](dw.extensions.payments.SalesforceAdyenPaymentIntent.md#getid)() | Returns the identifier of this payment intent. |
| [getPaymentInstrument](dw.extensions.payments.SalesforceAdyenPaymentIntent.md#getpaymentinstrumentbasket)([Basket](dw.order.Basket.md)) | Returns the payment instrument for this payment intent in the given basket, or `null` if the given  basket has none. |
| [getPaymentInstrument](dw.extensions.payments.SalesforceAdyenPaymentIntent.md#getpaymentinstrumentorder)([Order](dw.order.Order.md)) | Returns the payment instrument for this payment intent in the given order, or `null` if the given  order has none. |
| [getResultCode](dw.extensions.payments.SalesforceAdyenPaymentIntent.md#getresultcode)() | Returns the Adyen result code for this payment intent. |
| [hasAction](dw.extensions.payments.SalesforceAdyenPaymentIntent.md#hasaction)() | Returns `true` if this payment intent has an action, or `false` if not. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### ID
- ID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the identifier of this payment intent.


---

### action
- action: [Object](TopLevel.Object.md) `(read-only)`
  - : Returns the payment action for this payment intent.


---

### resultCode
- resultCode: [String](TopLevel.String.md) `(read-only)`
  - : Returns the Adyen result code for this payment intent.


---

## Method Details

### getAction()
- getAction(): [Object](TopLevel.Object.md)
  - : Returns the payment action for this payment intent.

    **Returns:**
    - payment action


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

### getResultCode()
- getResultCode(): [String](TopLevel.String.md)
  - : Returns the Adyen result code for this payment intent.

    **Returns:**
    - Adyen result code


---

### hasAction()
- hasAction(): [Boolean](TopLevel.Boolean.md)
  - : Returns `true` if this payment intent has an action, or `false` if not.

    **Returns:**
    - `true` if this payment intent has an action


---

<!-- prettier-ignore-end -->
