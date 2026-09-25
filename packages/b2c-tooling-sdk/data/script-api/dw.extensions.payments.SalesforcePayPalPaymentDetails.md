<!-- prettier-ignore-start -->
# Class SalesforcePayPalPaymentDetails

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.extensions.payments.SalesforcePaymentDetails](dw.extensions.payments.SalesforcePaymentDetails.md)
    - [dw.extensions.payments.SalesforcePayPalPaymentDetails](dw.extensions.payments.SalesforcePayPalPaymentDetails.md)

Details to a payment of type [SalesforcePaymentDetails.TYPE_PAYPAL](dw.extensions.payments.SalesforcePaymentDetails.md#type_paypal).


## Property Summary

| Property | Description |
| --- | --- |
| [captureID](#captureid): [String](TopLevel.String.md) | Returns the ID of the capture against the PayPal order, or `null` if not known. |
| [payerEmailAddress](#payeremailaddress): [String](TopLevel.String.md) | Returns the email address of the payer for the PayPal order, or `null` if not known. |

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [SalesforcePayPalPaymentDetails](#salesforcepaypalpaymentdetails)() | Constructs an empty PayPal payment details object. |

## Method Summary

| Method | Description |
| --- | --- |
| [getCaptureID](dw.extensions.payments.SalesforcePayPalPaymentDetails.md#getcaptureid)() | Returns the ID of the capture against the PayPal order, or `null` if not known. |
| [getPayerEmailAddress](dw.extensions.payments.SalesforcePayPalPaymentDetails.md#getpayeremailaddress)() | Returns the email address of the payer for the PayPal order, or `null` if not known. |
| [setCaptureID](dw.extensions.payments.SalesforcePayPalPaymentDetails.md#setcaptureidstring)([String](TopLevel.String.md)) | Sets the ID of the capture against the PayPal order. |
| [setPayerEmailAddress](dw.extensions.payments.SalesforcePayPalPaymentDetails.md#setpayeremailaddressstring)([String](TopLevel.String.md)) | Sets the email address of the payer for the PayPal order. |

### Methods inherited from class SalesforcePaymentDetails

[getType](dw.extensions.payments.SalesforcePaymentDetails.md#gettype)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### captureID
- captureID: [String](TopLevel.String.md)
  - : Returns the ID of the capture against the PayPal order, or `null` if not known.


---

### payerEmailAddress
- payerEmailAddress: [String](TopLevel.String.md)
  - : Returns the email address of the payer for the PayPal order, or `null` if not known.


---

## Constructor Details

### SalesforcePayPalPaymentDetails()
- SalesforcePayPalPaymentDetails()
  - : Constructs an empty PayPal payment details object.


---

## Method Details

### getCaptureID()
- getCaptureID(): [String](TopLevel.String.md)
  - : Returns the ID of the capture against the PayPal order, or `null` if not known.

    **Returns:**
    - PayPal order capture ID


---

### getPayerEmailAddress()
- getPayerEmailAddress(): [String](TopLevel.String.md)
  - : Returns the email address of the payer for the PayPal order, or `null` if not known.

    **Returns:**
    - payer email address


---

### setCaptureID(String)
- setCaptureID(captureID: [String](TopLevel.String.md)): void
  - : Sets the ID of the capture against the PayPal order.

    **Parameters:**
    - captureID - PayPal order capture ID


---

### setPayerEmailAddress(String)
- setPayerEmailAddress(payerEmailAddress: [String](TopLevel.String.md)): void
  - : Sets the email address of the payer for the PayPal order.

    **Parameters:**
    - payerEmailAddress - payer email address


---

<!-- prettier-ignore-end -->
