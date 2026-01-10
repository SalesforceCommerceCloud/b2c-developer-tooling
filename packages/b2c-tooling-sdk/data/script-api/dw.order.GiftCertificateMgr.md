<!-- prettier-ignore-start -->
# Class GiftCertificateMgr

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.order.GiftCertificateMgr](dw.order.GiftCertificateMgr.md)

The GiftCertificateMgr class contains a set of static methods for
interacting with GiftCertificates.



## Constant Summary

| Constant | Description |
| --- | --- |
| ~~[GC_ERROR_DISABLED](#gc_error_disabled): [String](TopLevel.String.md) = "GIFTCERTIFICATE-100"~~ | Indicates that an error occurred because the Gift Certificate  is currently disabled. |
| ~~[GC_ERROR_INSUFFICIENT_BALANCE](#gc_error_insufficient_balance): [String](TopLevel.String.md) = "GIFTCERTIFICATE-110"~~ | Indicates that an error occurred because the Gift Certificate  does not have a sufficient balance to perform the requested  operation. |
| ~~[GC_ERROR_INVALID_AMOUNT](#gc_error_invalid_amount): [String](TopLevel.String.md) = "GIFTCERTIFICATE-140"~~ | Indicates that an error occurred because the Gift Certificate  Amount was not valid. |
| ~~[GC_ERROR_INVALID_CODE](#gc_error_invalid_code): [String](TopLevel.String.md) = "GIFTCERTIFICATE-150"~~ | Indicates that an error occurred because the Gift Certificate  ID was not valid. |
| ~~[GC_ERROR_PENDING](#gc_error_pending): [String](TopLevel.String.md) = "GIFTCERTIFICATE-130"~~ | Indicates that an error occurred because the Gift Certificate  has been fully redeemed. |
| ~~[GC_ERROR_REDEEMED](#gc_error_redeemed): [String](TopLevel.String.md) = "GIFTCERTIFICATE-120"~~ | Indicates that an error occurred because the Gift Certificate  has been fully redeemed. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| static [createGiftCertificate](dw.order.GiftCertificateMgr.md#creategiftcertificatenumber)([Number](TopLevel.Number.md)) | Creates a Gift Certificate. |
| static [createGiftCertificate](dw.order.GiftCertificateMgr.md#creategiftcertificatenumber-string)([Number](TopLevel.Number.md), [String](TopLevel.String.md)) | Creates a Gift Certificate. |
| ~~static [getGiftCertificate](dw.order.GiftCertificateMgr.md#getgiftcertificatestring)([String](TopLevel.String.md))~~ | Returns the Gift Certificate identified by the specified  gift certificate code. |
| static [getGiftCertificateByCode](dw.order.GiftCertificateMgr.md#getgiftcertificatebycodestring)([String](TopLevel.String.md)) | Returns the Gift Certificate identified by the specified  gift certificate code. |
| static [getGiftCertificateByMerchantID](dw.order.GiftCertificateMgr.md#getgiftcertificatebymerchantidstring)([String](TopLevel.String.md)) | Returns the Gift Certificate identified by the specified merchant ID. |
| static [redeemGiftCertificate](dw.order.GiftCertificateMgr.md#redeemgiftcertificateorderpaymentinstrument)([OrderPaymentInstrument](dw.order.OrderPaymentInstrument.md)) | Redeems an amount from a Gift Certificate. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### GC_ERROR_DISABLED

- ~~GC_ERROR_DISABLED: [String](TopLevel.String.md) = "GIFTCERTIFICATE-100"~~
  - : Indicates that an error occurred because the Gift Certificate
      is currently disabled.


    **Deprecated:**
:::warning
Use [GiftCertificateStatusCodes](dw.order.GiftCertificateStatusCodes.md) instead.
:::

---

### GC_ERROR_INSUFFICIENT_BALANCE

- ~~GC_ERROR_INSUFFICIENT_BALANCE: [String](TopLevel.String.md) = "GIFTCERTIFICATE-110"~~
  - : Indicates that an error occurred because the Gift Certificate
      does not have a sufficient balance to perform the requested
      operation.


    **Deprecated:**
:::warning
Use [GiftCertificateStatusCodes](dw.order.GiftCertificateStatusCodes.md) instead.
:::

---

### GC_ERROR_INVALID_AMOUNT

- ~~GC_ERROR_INVALID_AMOUNT: [String](TopLevel.String.md) = "GIFTCERTIFICATE-140"~~
  - : Indicates that an error occurred because the Gift Certificate
      Amount was not valid.


    **Deprecated:**
:::warning
Use [GiftCertificateStatusCodes](dw.order.GiftCertificateStatusCodes.md) instead.
:::

---

### GC_ERROR_INVALID_CODE

- ~~GC_ERROR_INVALID_CODE: [String](TopLevel.String.md) = "GIFTCERTIFICATE-150"~~
  - : Indicates that an error occurred because the Gift Certificate
      ID was not valid.


    **Deprecated:**
:::warning
Use [GiftCertificateStatusCodes](dw.order.GiftCertificateStatusCodes.md) instead.
:::

---

### GC_ERROR_PENDING

- ~~GC_ERROR_PENDING: [String](TopLevel.String.md) = "GIFTCERTIFICATE-130"~~
  - : Indicates that an error occurred because the Gift Certificate
      has been fully redeemed.


    **Deprecated:**
:::warning
Use [GiftCertificateStatusCodes](dw.order.GiftCertificateStatusCodes.md) instead.
:::

---

### GC_ERROR_REDEEMED

- ~~GC_ERROR_REDEEMED: [String](TopLevel.String.md) = "GIFTCERTIFICATE-120"~~
  - : Indicates that an error occurred because the Gift Certificate
      has been fully redeemed.


    **Deprecated:**
:::warning
Use   [GiftCertificateStatusCodes](dw.order.GiftCertificateStatusCodes.md) instead.
:::

---

## Method Details

### createGiftCertificate(Number)
- static createGiftCertificate(amount: [Number](TopLevel.Number.md)): [GiftCertificate](dw.order.GiftCertificate.md)
  - : Creates a Gift Certificate. The system will assign a code to the new Gift Certificate.

    **Parameters:**
    - amount - the amount of the gift certificate. Must not be negative or zero.

    **Returns:**
    - the newly created Gift Certificate.


---

### createGiftCertificate(Number, String)
- static createGiftCertificate(amount: [Number](TopLevel.Number.md), code: [String](TopLevel.String.md)): [GiftCertificate](dw.order.GiftCertificate.md)
  - : Creates a Gift Certificate. If a non-empty Gift Certificate code is specified, the code will be used to create
      the Gift Certificate. Be aware that this code must be unique for the current site. If it is not unique, the Gift
      Certificate will not be created.


    **Parameters:**
    - amount - the amount of the gift certificate. Must not be negative or zero.
    - code - the code for the new gift certificate. If parameter is null or empty , the system will assign a code             to the new gift certificate.

    **Returns:**
    - the newly created Gift Certificate.


---

### getGiftCertificate(String)
- ~~static getGiftCertificate(giftCertificateCode: [String](TopLevel.String.md)): [GiftCertificate](dw.order.GiftCertificate.md)~~
  - : Returns the Gift Certificate identified by the specified
      gift certificate code.


    **Parameters:**
    - giftCertificateCode - to identify the Gift Certificate.

    **Returns:**
    - the Gift Certificate identified by the specified code or null.

    **Deprecated:**
:::warning
Use [getGiftCertificateByCode(String)](dw.order.GiftCertificateMgr.md#getgiftcertificatebycodestring)
:::

---

### getGiftCertificateByCode(String)
- static getGiftCertificateByCode(giftCertificateCode: [String](TopLevel.String.md)): [GiftCertificate](dw.order.GiftCertificate.md)
  - : Returns the Gift Certificate identified by the specified
      gift certificate code.


    **Parameters:**
    - giftCertificateCode - to identify the Gift Certificate.

    **Returns:**
    - the Gift Certificate identified by the specified code or null.


---

### getGiftCertificateByMerchantID(String)
- static getGiftCertificateByMerchantID(merchantID: [String](TopLevel.String.md)): [GiftCertificate](dw.order.GiftCertificate.md)
  - : Returns the Gift Certificate identified by the specified merchant ID.

    **Parameters:**
    - merchantID - to identify the Gift Certificate.

    **Returns:**
    - the Gift Certificate identified by the specified merchant ID or
      null.



---

### redeemGiftCertificate(OrderPaymentInstrument)
- static redeemGiftCertificate(paymentInstrument: [OrderPaymentInstrument](dw.order.OrderPaymentInstrument.md)): [Status](dw.system.Status.md)
  - : Redeems an amount from a Gift Certificate. The Gift Certificate ID
      is specified in the OrderPaymentInstrument and the amount
      specified in the PaymentTransaction associated with the
      OrderPaymentInstrument. If the PaymentTransaction.getTransactionID()
      is not null, the value returned by this method is used as the
      'Order Number' for the redemption transaction. The 'Order Number' is
      visible via the Business Manager.


    **Parameters:**
    - paymentInstrument - the OrderPaymentInstrument containing the ID of  the Gift Certificate to redeem, and the amount of the redemption.

    **Returns:**
    - the status of the redemption operation.


---

<!-- prettier-ignore-end -->
