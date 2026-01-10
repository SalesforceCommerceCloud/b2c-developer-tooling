<!-- prettier-ignore-start -->
# Class PaymentCard

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.object.PersistentObject](dw.object.PersistentObject.md)
    - [dw.object.ExtensibleObject](dw.object.ExtensibleObject.md)
      - [dw.order.PaymentCard](dw.order.PaymentCard.md)

Represents payment cards and provides methods to access the payment card
attributes and status.


**Note:** this class handles sensitive financial and card holder data.
Pay special attention to PCI DSS v3. requirements 1, 3, 7, and 9.



## Property Summary

| Property | Description |
| --- | --- |
| [active](#active): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns 'true' if payment card is active (enabled), otherwise 'false' is returned. |
| [cardType](#cardtype): [String](TopLevel.String.md) `(read-only)` | Returns the unique card type of the payment card. |
| [description](#description): [MarkupText](dw.content.MarkupText.md) `(read-only)` | Returns the description of the payment card. |
| [image](#image): [MediaFile](dw.content.MediaFile.md) `(read-only)` | Returns the reference to the payment card image. |
| [name](#name): [String](TopLevel.String.md) `(read-only)` | Returns the name of the payment card. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getCardType](dw.order.PaymentCard.md#getcardtype)() | Returns the unique card type of the payment card. |
| [getDescription](dw.order.PaymentCard.md#getdescription)() | Returns the description of the payment card. |
| [getImage](dw.order.PaymentCard.md#getimage)() | Returns the reference to the payment card image. |
| [getName](dw.order.PaymentCard.md#getname)() | Returns the name of the payment card. |
| [isActive](dw.order.PaymentCard.md#isactive)() | Returns 'true' if payment card is active (enabled), otherwise 'false' is returned. |
| [isApplicable](dw.order.PaymentCard.md#isapplicablecustomer-string-number)([Customer](dw.customer.Customer.md), [String](TopLevel.String.md), [Number](TopLevel.Number.md)) | Returns 'true' if this payment card is applicable for the specified  customer, country and payment amount and the session currency. |
| [verify](dw.order.PaymentCard.md#verifynumber-number-string)([Number](TopLevel.Number.md), [Number](TopLevel.Number.md), [String](TopLevel.String.md)) | Verify the card against the provided values. |
| [verify](dw.order.PaymentCard.md#verifynumber-number-string-string)([Number](TopLevel.Number.md), [Number](TopLevel.Number.md), [String](TopLevel.String.md), [String](TopLevel.String.md)) | Verify the card against the provided values. |

### Methods inherited from class ExtensibleObject

[describe](dw.object.ExtensibleObject.md#describe), [getCustom](dw.object.ExtensibleObject.md#getcustom)
### Methods inherited from class PersistentObject

[getCreationDate](dw.object.PersistentObject.md#getcreationdate), [getLastModified](dw.object.PersistentObject.md#getlastmodified), [getUUID](dw.object.PersistentObject.md#getuuid)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### active
- active: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns 'true' if payment card is active (enabled), otherwise 'false' is returned.


---

### cardType
- cardType: [String](TopLevel.String.md) `(read-only)`
  - : Returns the unique card type of the payment card.


---

### description
- description: [MarkupText](dw.content.MarkupText.md) `(read-only)`
  - : Returns the description of the payment card.


---

### image
- image: [MediaFile](dw.content.MediaFile.md) `(read-only)`
  - : Returns the reference to the payment card image.


---

### name
- name: [String](TopLevel.String.md) `(read-only)`
  - : Returns the name of the payment card.


---

## Method Details

### getCardType()
- getCardType(): [String](TopLevel.String.md)
  - : Returns the unique card type of the payment card.

    **Returns:**
    - cardType of the payment card.


---

### getDescription()
- getDescription(): [MarkupText](dw.content.MarkupText.md)
  - : Returns the description of the payment card.

    **Returns:**
    - Description of the payment card.


---

### getImage()
- getImage(): [MediaFile](dw.content.MediaFile.md)
  - : Returns the reference to the payment card image.

    **Returns:**
    - Image of the payment card.


---

### getName()
- getName(): [String](TopLevel.String.md)
  - : Returns the name of the payment card.

    **Returns:**
    - Name of the payment card.


---

### isActive()
- isActive(): [Boolean](TopLevel.Boolean.md)
  - : Returns 'true' if payment card is active (enabled), otherwise 'false' is returned.

    **Returns:**
    - true if payment card is active, otherwise false.


---

### isApplicable(Customer, String, Number)
- isApplicable(customer: [Customer](dw.customer.Customer.md), countryCode: [String](TopLevel.String.md), paymentAmount: [Number](TopLevel.Number.md)): [Boolean](TopLevel.Boolean.md)
  - : Returns 'true' if this payment card is applicable for the specified
      customer, country and payment amount and the session currency.
      
      
      
      The payment card is applicable if
      
      - the card is restricted by customer group, and at least one of the  groups of the specified customer is assigned to the card
      - the card is restricted by billing country, and the specified country  code is assigned to the card
      - the method is restricted by payment amount for the session currency,  and the specified payment amount is within the limits of the min/max  payment amount defined for the method and the session currency
      - the method is restricted by session currency, and the session  currency code is assigned to the method
      
      
      All parameters are optional, and if not specified, the respective
      restriction won't be validated. For example, if a card is restricted by
      billing country, but no country code is specified, this card will be
      returned, unless it is filtered out by customer group or payment amount.


    **Parameters:**
    - customer - Customer or null
    - countryCode - Billing country code or null
    - paymentAmount - Payment amount or null

    **Returns:**
    - true if payment card is applicable, false otherwise


---

### verify(Number, Number, String)
- verify(expiresMonth: [Number](TopLevel.Number.md), expiresYear: [Number](TopLevel.Number.md), cardNumber: [String](TopLevel.String.md)): [Status](dw.system.Status.md)
  - : Verify the card against the provided values. This method is equivalent to
      [verify(Number, Number, String, String)](dw.order.PaymentCard.md#verifynumber-number-string-string) but omits verification of the
      card security code. If the verification fails the resulting
      [Status](dw.system.Status.md) will hold up to 2 error items each with a code:
      
      
      - [PaymentStatusCodes.CREDITCARD_INVALID_EXPIRATION_DATE](dw.order.PaymentStatusCodes.md#creditcard_invalid_expiration_date)- the expiresMonth and expiresYear do not describe a  month in the future, or describe an invalid month outside the range 1-12.
      - [PaymentStatusCodes.CREDITCARD_INVALID_CARD_NUMBER](dw.order.PaymentStatusCodes.md#creditcard_invalid_card_number)- the cardNumber does not verify against one or more configured  checks, which may include the Luhn checksum, accepted number lengths, or accepted number prefixes.


    **Parameters:**
    - expiresMonth - expiration month as integer, 1 (January) to 12 (December)
    - expiresYear - expiration year as integer, e.g. 2025
    - cardNumber - card number, a string containing digital characters

    **Returns:**
    - status indicating result


---

### verify(Number, Number, String, String)
- verify(expiresMonth: [Number](TopLevel.Number.md), expiresYear: [Number](TopLevel.Number.md), cardNumber: [String](TopLevel.String.md), csc: [String](TopLevel.String.md)): [Status](dw.system.Status.md)
  - : Verify the card against the provided values. If the verification fails the resulting
      [Status](dw.system.Status.md) will hold up to 3 error items with these codes:
      
      
      - [PaymentStatusCodes.CREDITCARD_INVALID_EXPIRATION_DATE](dw.order.PaymentStatusCodes.md#creditcard_invalid_expiration_date)- the expiresMonth and expiresYear do not describe a  month in the future, or describe an invalid month outside the range 1-12.
      - [PaymentStatusCodes.CREDITCARD_INVALID_CARD_NUMBER](dw.order.PaymentStatusCodes.md#creditcard_invalid_card_number)- the cardNumber does not verify against one or more configured  checks, which may include the Luhn checksum, accepted number lengths, or accepted number prefixes.
      - [PaymentStatusCodes.CREDITCARD_INVALID_SECURITY_CODE](dw.order.PaymentStatusCodes.md#creditcard_invalid_security_code)- the card security code does not verify against the configured  accepted length.


    **Parameters:**
    - expiresMonth - expiration month as integer, 1 (January) to 12 (December)
    - expiresYear - expiration year as integer, e.g. 2025
    - cardNumber - card number, a string containing digital characters
    - csc - card security code, a string containing digital characters

    **Returns:**
    - status indicating result


---

<!-- prettier-ignore-end -->
