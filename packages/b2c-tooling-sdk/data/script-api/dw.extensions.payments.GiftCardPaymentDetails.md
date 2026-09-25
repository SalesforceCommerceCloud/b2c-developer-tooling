<!-- prettier-ignore-start -->
# Class GiftCardPaymentDetails

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.extensions.payments.SalesforcePaymentDetails](dw.extensions.payments.SalesforcePaymentDetails.md)
    - [dw.extensions.payments.GiftCardPaymentDetails](dw.extensions.payments.GiftCardPaymentDetails.md)

Details to a payment of type [SalesforcePaymentDetails.TYPE_GIFT_CARD](dw.extensions.payments.SalesforcePaymentDetails.md#type_gift_card). Used for Salesforce Payments and
third-party gift card providers. Only the masked identifier (`last4`) is stored here.



## Property Summary

| Property | Description |
| --- | --- |
| [last4](#last4): [String](TopLevel.String.md) | Returns the last 4 digits of the gift card number, or `null` if not known. |

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [GiftCardPaymentDetails](#giftcardpaymentdetails)() | Constructs an empty gift card payment details object. |

## Method Summary

| Method | Description |
| --- | --- |
| [getLast4](dw.extensions.payments.GiftCardPaymentDetails.md#getlast4)() | Returns the last 4 digits of the gift card number, or `null` if not known. |
| [setLast4](dw.extensions.payments.GiftCardPaymentDetails.md#setlast4string)([String](TopLevel.String.md)) | Sets the last 4 digits of the gift card number. |

### Methods inherited from class SalesforcePaymentDetails

[getType](dw.extensions.payments.SalesforcePaymentDetails.md#gettype)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### last4
- last4: [String](TopLevel.String.md)
  - : Returns the last 4 digits of the gift card number, or `null` if not known. This is _not_ the full
      card number (PAN).



---

## Constructor Details

### GiftCardPaymentDetails()
- GiftCardPaymentDetails()
  - : Constructs an empty gift card payment details object.


---

## Method Details

### getLast4()
- getLast4(): [String](TopLevel.String.md)
  - : Returns the last 4 digits of the gift card number, or `null` if not known. This is _not_ the full
      card number (PAN).


    **Returns:**
    - last 4 digits of the gift card number


---

### setLast4(String)
- setLast4(last4: [String](TopLevel.String.md)): void
  - : Sets the last 4 digits of the gift card number. Do not set the full card number (PAN) or PIN.

    **Parameters:**
    - last4 - last 4 digits of the gift card number


---

<!-- prettier-ignore-end -->
