<!-- prettier-ignore-start -->
# Class GiftCertificateStatusCodes

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.order.GiftCertificateStatusCodes](dw.order.GiftCertificateStatusCodes.md)

Helper class containing status codes for the various errors that can occur
when redeeming a gift certificate. One of these codes is returned as part of
a Status object when a unsuccessful call to the
`RedeemGiftCertificate` pipelet is made.



## Constant Summary

| Constant | Description |
| --- | --- |
| [GIFTCERTIFICATE_CURRENCY_MISMATCH](#giftcertificate_currency_mismatch): [String](TopLevel.String.md) = "GIFTCERTIFICATE_CURRENCY_MISMATCH" | Indicates that an error occurred because the Gift Certificate  was in a different currency than the Basket. |
| [GIFTCERTIFICATE_DISABLED](#giftcertificate_disabled): [String](TopLevel.String.md) = "GIFTCERTIFICATE_DISABLED" | Indicates that an error occurred because the Gift Certificate  is currently disabled. |
| [GIFTCERTIFICATE_INSUFFICIENT_BALANCE](#giftcertificate_insufficient_balance): [String](TopLevel.String.md) = "GIFTCERTIFICATE_INSUFFICIENT_BALANCE" | Indicates that an error occurred because the Gift Certificate  does not have a sufficient balance to perform the requested  operation. |
| [GIFTCERTIFICATE_NOT_FOUND](#giftcertificate_not_found): [String](TopLevel.String.md) = "GIFTCERTIFICATE_NOT_FOUND" | Indicates that an error occurred because the Gift Certificate  was not found. |
| [GIFTCERTIFICATE_PENDING](#giftcertificate_pending): [String](TopLevel.String.md) = "GIFTCERTIFICATE_PENDING" | Indicates that an error occurred because the Gift Certificate  is pending and is not available for use. |
| [GIFTCERTIFICATE_REDEEMED](#giftcertificate_redeemed): [String](TopLevel.String.md) = "GIFTCERTIFICATE_REDEEMED" | Indicates that an error occurred because the Gift Certificate  has been fully redeemed. |

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [GiftCertificateStatusCodes](#giftcertificatestatuscodes)() |  |

## Method Summary

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### GIFTCERTIFICATE_CURRENCY_MISMATCH

- GIFTCERTIFICATE_CURRENCY_MISMATCH: [String](TopLevel.String.md) = "GIFTCERTIFICATE_CURRENCY_MISMATCH"
  - : Indicates that an error occurred because the Gift Certificate
      was in a different currency than the Basket.



---

### GIFTCERTIFICATE_DISABLED

- GIFTCERTIFICATE_DISABLED: [String](TopLevel.String.md) = "GIFTCERTIFICATE_DISABLED"
  - : Indicates that an error occurred because the Gift Certificate
      is currently disabled.



---

### GIFTCERTIFICATE_INSUFFICIENT_BALANCE

- GIFTCERTIFICATE_INSUFFICIENT_BALANCE: [String](TopLevel.String.md) = "GIFTCERTIFICATE_INSUFFICIENT_BALANCE"
  - : Indicates that an error occurred because the Gift Certificate
      does not have a sufficient balance to perform the requested
      operation.



---

### GIFTCERTIFICATE_NOT_FOUND

- GIFTCERTIFICATE_NOT_FOUND: [String](TopLevel.String.md) = "GIFTCERTIFICATE_NOT_FOUND"
  - : Indicates that an error occurred because the Gift Certificate
      was not found.



---

### GIFTCERTIFICATE_PENDING

- GIFTCERTIFICATE_PENDING: [String](TopLevel.String.md) = "GIFTCERTIFICATE_PENDING"
  - : Indicates that an error occurred because the Gift Certificate
      is pending and is not available for use.



---

### GIFTCERTIFICATE_REDEEMED

- GIFTCERTIFICATE_REDEEMED: [String](TopLevel.String.md) = "GIFTCERTIFICATE_REDEEMED"
  - : Indicates that an error occurred because the Gift Certificate
      has been fully redeemed.



---

## Constructor Details

### GiftCertificateStatusCodes()
- GiftCertificateStatusCodes()
  - : 


---

<!-- prettier-ignore-end -->
