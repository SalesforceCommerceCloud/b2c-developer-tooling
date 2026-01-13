<!-- prettier-ignore-start -->
# Class PaymentStatusCodes

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.order.PaymentStatusCodes](dw.order.PaymentStatusCodes.md)

Helper class containing status codes for the various errors that can occur
when validating a payment card. One of these codes is returned as part of a
Status object when a unsuccessful call to the `VerifyPaymentCard`
or `VerifyCreditCard` pipelet is made. The same codes are used
when calling [PaymentCard.verify(Number, Number, String)](dw.order.PaymentCard.md#verifynumber-number-string) or
[PaymentCard.verify(Number, Number, String, String)](dw.order.PaymentCard.md#verifynumber-number-string-string).



## Constant Summary

| Constant | Description |
| --- | --- |
| [CREDITCARD_INVALID_CARD_NUMBER](#creditcard_invalid_card_number): [String](TopLevel.String.md) = "CREDITCARD_INVALID_CARD_NUMBER" | The code indicates that the credit card number is incorrect. |
| [CREDITCARD_INVALID_EXPIRATION_DATE](#creditcard_invalid_expiration_date): [String](TopLevel.String.md) = "CREDITCARD_INVALID_EXPIRATION_DATE" | The code indicates that the credit card is expired. |
| [CREDITCARD_INVALID_SECURITY_CODE](#creditcard_invalid_security_code): [String](TopLevel.String.md) = "CREDITCARD_INVALID_SECURITY_CODE" | The code indicates that the credit card security code length is invalid. |

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [PaymentStatusCodes](#paymentstatuscodes)() |  |

## Method Summary

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### CREDITCARD_INVALID_CARD_NUMBER

- CREDITCARD_INVALID_CARD_NUMBER: [String](TopLevel.String.md) = "CREDITCARD_INVALID_CARD_NUMBER"
  - : The code indicates that the credit card number is incorrect.


---

### CREDITCARD_INVALID_EXPIRATION_DATE

- CREDITCARD_INVALID_EXPIRATION_DATE: [String](TopLevel.String.md) = "CREDITCARD_INVALID_EXPIRATION_DATE"
  - : The code indicates that the credit card is expired.


---

### CREDITCARD_INVALID_SECURITY_CODE

- CREDITCARD_INVALID_SECURITY_CODE: [String](TopLevel.String.md) = "CREDITCARD_INVALID_SECURITY_CODE"
  - : The code indicates that the credit card security code length is invalid.


---

## Constructor Details

### PaymentStatusCodes()
- PaymentStatusCodes()
  - : 


---

<!-- prettier-ignore-end -->
