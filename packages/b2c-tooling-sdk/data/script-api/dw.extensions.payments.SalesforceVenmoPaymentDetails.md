<!-- prettier-ignore-start -->
# Class SalesforceVenmoPaymentDetails

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.extensions.payments.SalesforcePaymentDetails](dw.extensions.payments.SalesforcePaymentDetails.md)
    - [dw.extensions.payments.SalesforceVenmoPaymentDetails](dw.extensions.payments.SalesforceVenmoPaymentDetails.md)



Details to a Salesforce Payments payment of type [SalesforcePayPalOrder.TYPE_VENMO](dw.extensions.payments.SalesforcePayPalOrder.md#type_venmo). See Salesforce Payments
documentation for how to gain access and configure it for use on your sites.



## Property Summary

| Property | Description |
| --- | --- |
| [captureID](#captureid): [String](TopLevel.String.md) `(read-only)` | Returns the ID of the capture against the PayPal Venmo order, or `null` if not known. |
| [payerEmailAddress](#payeremailaddress): [String](TopLevel.String.md) `(read-only)` | Returns the email address of the payer for the PayPal Venmo order, or `null` if not known. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getCaptureID](dw.extensions.payments.SalesforceVenmoPaymentDetails.md#getcaptureid)() | Returns the ID of the capture against the PayPal Venmo order, or `null` if not known. |
| [getPayerEmailAddress](dw.extensions.payments.SalesforceVenmoPaymentDetails.md#getpayeremailaddress)() | Returns the email address of the payer for the PayPal Venmo order, or `null` if not known. |

### Methods inherited from class SalesforcePaymentDetails

[getType](dw.extensions.payments.SalesforcePaymentDetails.md#gettype)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### captureID
- captureID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the ID of the capture against the PayPal Venmo order, or `null` if not known.

    **See Also:**
    - [SalesforcePayPalOrder.getCaptureID()](dw.extensions.payments.SalesforcePayPalOrder.md#getcaptureid)


---

### payerEmailAddress
- payerEmailAddress: [String](TopLevel.String.md) `(read-only)`
  - : Returns the email address of the payer for the PayPal Venmo order, or `null` if not known.

    **See Also:**
    - [SalesforcePayPalOrderPayer.getEmailAddress()](dw.extensions.payments.SalesforcePayPalOrderPayer.md#getemailaddress)


---

## Method Details

### getCaptureID()
- getCaptureID(): [String](TopLevel.String.md)
  - : Returns the ID of the capture against the PayPal Venmo order, or `null` if not known.

    **Returns:**
    - PayPal order capture ID

    **See Also:**
    - [SalesforcePayPalOrder.getCaptureID()](dw.extensions.payments.SalesforcePayPalOrder.md#getcaptureid)


---

### getPayerEmailAddress()
- getPayerEmailAddress(): [String](TopLevel.String.md)
  - : Returns the email address of the payer for the PayPal Venmo order, or `null` if not known.

    **Returns:**
    - payer email address

    **See Also:**
    - [SalesforcePayPalOrderPayer.getEmailAddress()](dw.extensions.payments.SalesforcePayPalOrderPayer.md#getemailaddress)


---

<!-- prettier-ignore-end -->
