<!-- prettier-ignore-start -->
# Class SalesforceAdyenSavedPaymentMethod

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.extensions.payments.SalesforceAdyenSavedPaymentMethod](dw.extensions.payments.SalesforceAdyenSavedPaymentMethod.md)



Salesforce Payments representation of an Adyen saved payment method object. See Salesforce Payments documentation for
how to gain access and configure it for use on your sites.




An Adyen saved payment method contains information about a credential used by a shopper to attempt payment, such as a
payment card or bank account. The available information differs for each type of payment method. It includes only
limited information that can be safely presented to a shopper to remind them what credential they used, and
specifically not complete card, account, or other numbers that could be used to make future payments.



## Constant Summary

| Constant | Description |
| --- | --- |
| [TYPE_BANCONTACT](#type_bancontact): [String](TopLevel.String.md) = "bancontact" | Represents the Bancontact payment method. |
| [TYPE_CARD](#type_card): [String](TopLevel.String.md) = "card" | Represents a credit card type of payment method. |
| [TYPE_IDEAL](#type_ideal): [String](TopLevel.String.md) = "ideal" | Represents the iDEAL payment method. |
| [TYPE_SEPA_DEBIT](#type_sepa_debit): [String](TopLevel.String.md) = "sepa_debit" | Represents the SEPA Debit payment method. |

## Property Summary

| Property | Description |
| --- | --- |
| [ID](#id): [String](TopLevel.String.md) `(read-only)` | Returns the identifier of this payment method. |
| [brand](#brand): [String](TopLevel.String.md) `(read-only)` | Returns the brand of this payment method, or `null` if none is available. |
| [expiryMonth](#expirymonth): [String](TopLevel.String.md) `(read-only)` | Returns the expiry month of the card for this payment method, or `null` if none is available. |
| [expiryYear](#expiryyear): [String](TopLevel.String.md) `(read-only)` | Returns the expiry year of the card for this payment method, or `null` if none is available. |
| [holderName](#holdername): [String](TopLevel.String.md) `(read-only)` | Returns the cardholder name for this payment method, or `null` if none is available. |
| [last4](#last4): [String](TopLevel.String.md) `(read-only)` | Returns the last 4 digits of the credential for this payment method, or `null` if none is available. |
| [ownerName](#ownername): [String](TopLevel.String.md) `(read-only)` | Returns the back account owner name for this payment method, or `null` if none is available. |
| [type](#type): [String](TopLevel.String.md) `(read-only)` | Returns the type of this payment method. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getBrand](dw.extensions.payments.SalesforceAdyenSavedPaymentMethod.md#getbrand)() | Returns the brand of this payment method, or `null` if none is available. |
| [getExpiryMonth](dw.extensions.payments.SalesforceAdyenSavedPaymentMethod.md#getexpirymonth)() | Returns the expiry month of the card for this payment method, or `null` if none is available. |
| [getExpiryYear](dw.extensions.payments.SalesforceAdyenSavedPaymentMethod.md#getexpiryyear)() | Returns the expiry year of the card for this payment method, or `null` if none is available. |
| [getHolderName](dw.extensions.payments.SalesforceAdyenSavedPaymentMethod.md#getholdername)() | Returns the cardholder name for this payment method, or `null` if none is available. |
| [getID](dw.extensions.payments.SalesforceAdyenSavedPaymentMethod.md#getid)() | Returns the identifier of this payment method. |
| [getLast4](dw.extensions.payments.SalesforceAdyenSavedPaymentMethod.md#getlast4)() | Returns the last 4 digits of the credential for this payment method, or `null` if none is available. |
| [getOwnerName](dw.extensions.payments.SalesforceAdyenSavedPaymentMethod.md#getownername)() | Returns the back account owner name for this payment method, or `null` if none is available. |
| [getType](dw.extensions.payments.SalesforceAdyenSavedPaymentMethod.md#gettype)() | Returns the type of this payment method. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### TYPE_BANCONTACT

- TYPE_BANCONTACT: [String](TopLevel.String.md) = "bancontact"
  - : Represents the Bancontact payment method.


---

### TYPE_CARD

- TYPE_CARD: [String](TopLevel.String.md) = "card"
  - : Represents a credit card type of payment method.


---

### TYPE_IDEAL

- TYPE_IDEAL: [String](TopLevel.String.md) = "ideal"
  - : Represents the iDEAL payment method.


---

### TYPE_SEPA_DEBIT

- TYPE_SEPA_DEBIT: [String](TopLevel.String.md) = "sepa_debit"
  - : Represents the SEPA Debit payment method.


---

## Property Details

### ID
- ID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the identifier of this payment method.


---

### brand
- brand: [String](TopLevel.String.md) `(read-only)`
  - : Returns the brand of this payment method, or `null` if none is available. Available on
      [TYPE_CARD](dw.extensions.payments.SalesforceAdyenSavedPaymentMethod.md#type_card) type methods.



---

### expiryMonth
- expiryMonth: [String](TopLevel.String.md) `(read-only)`
  - : Returns the expiry month of the card for this payment method, or `null` if none is available.
      Available on [TYPE_CARD](dw.extensions.payments.SalesforceAdyenSavedPaymentMethod.md#type_card) and
      [TYPE_BANCONTACT](dw.extensions.payments.SalesforceAdyenSavedPaymentMethod.md#type_bancontact) type methods.



---

### expiryYear
- expiryYear: [String](TopLevel.String.md) `(read-only)`
  - : Returns the expiry year of the card for this payment method, or `null` if none is available. Available
      on [TYPE_CARD](dw.extensions.payments.SalesforceAdyenSavedPaymentMethod.md#type_card) and
      [TYPE_BANCONTACT](dw.extensions.payments.SalesforceAdyenSavedPaymentMethod.md#type_bancontact) type methods.



---

### holderName
- holderName: [String](TopLevel.String.md) `(read-only)`
  - : Returns the cardholder name for this payment method, or `null` if none is available. Available on
      [TYPE_CARD](dw.extensions.payments.SalesforceAdyenSavedPaymentMethod.md#type_card) and [TYPE_BANCONTACT](dw.extensions.payments.SalesforceAdyenSavedPaymentMethod.md#type_bancontact)
      type methods.



---

### last4
- last4: [String](TopLevel.String.md) `(read-only)`
  - : Returns the last 4 digits of the credential for this payment method, or `null` if none is available.
      Available on [TYPE_CARD](dw.extensions.payments.SalesforceAdyenSavedPaymentMethod.md#type_card) and
      [TYPE_BANCONTACT](dw.extensions.payments.SalesforceAdyenSavedPaymentMethod.md#type_bancontact) type methods.



---

### ownerName
- ownerName: [String](TopLevel.String.md) `(read-only)`
  - : Returns the back account owner name for this payment method, or `null` if none is available. Available
      on [TYPE_SEPA_DEBIT](dw.extensions.payments.SalesforceAdyenSavedPaymentMethod.md#type_sepa_debit) and
      [TYPE_IDEAL](dw.extensions.payments.SalesforceAdyenSavedPaymentMethod.md#type_ideal) type method.



---

### type
- type: [String](TopLevel.String.md) `(read-only)`
  - : Returns the type of this payment method.

    **See Also:**
    - [TYPE_BANCONTACT](dw.extensions.payments.SalesforceAdyenSavedPaymentMethod.md#type_bancontact)
    - [TYPE_CARD](dw.extensions.payments.SalesforceAdyenSavedPaymentMethod.md#type_card)
    - [TYPE_IDEAL](dw.extensions.payments.SalesforceAdyenSavedPaymentMethod.md#type_ideal)
    - [TYPE_SEPA_DEBIT](dw.extensions.payments.SalesforceAdyenSavedPaymentMethod.md#type_sepa_debit)


---

## Method Details

### getBrand()
- getBrand(): [String](TopLevel.String.md)
  - : Returns the brand of this payment method, or `null` if none is available. Available on
      [TYPE_CARD](dw.extensions.payments.SalesforceAdyenSavedPaymentMethod.md#type_card) type methods.


    **Returns:**
    - payment method brand


---

### getExpiryMonth()
- getExpiryMonth(): [String](TopLevel.String.md)
  - : Returns the expiry month of the card for this payment method, or `null` if none is available.
      Available on [TYPE_CARD](dw.extensions.payments.SalesforceAdyenSavedPaymentMethod.md#type_card) and
      [TYPE_BANCONTACT](dw.extensions.payments.SalesforceAdyenSavedPaymentMethod.md#type_bancontact) type methods.


    **Returns:**
    - payment method credential expiry month


---

### getExpiryYear()
- getExpiryYear(): [String](TopLevel.String.md)
  - : Returns the expiry year of the card for this payment method, or `null` if none is available. Available
      on [TYPE_CARD](dw.extensions.payments.SalesforceAdyenSavedPaymentMethod.md#type_card) and
      [TYPE_BANCONTACT](dw.extensions.payments.SalesforceAdyenSavedPaymentMethod.md#type_bancontact) type methods.


    **Returns:**
    - payment method credential expiry year


---

### getHolderName()
- getHolderName(): [String](TopLevel.String.md)
  - : Returns the cardholder name for this payment method, or `null` if none is available. Available on
      [TYPE_CARD](dw.extensions.payments.SalesforceAdyenSavedPaymentMethod.md#type_card) and [TYPE_BANCONTACT](dw.extensions.payments.SalesforceAdyenSavedPaymentMethod.md#type_bancontact)
      type methods.


    **Returns:**
    - payment method credential cardholder name


---

### getID()
- getID(): [String](TopLevel.String.md)
  - : Returns the identifier of this payment method.

    **Returns:**
    - payment method identifier


---

### getLast4()
- getLast4(): [String](TopLevel.String.md)
  - : Returns the last 4 digits of the credential for this payment method, or `null` if none is available.
      Available on [TYPE_CARD](dw.extensions.payments.SalesforceAdyenSavedPaymentMethod.md#type_card) and
      [TYPE_BANCONTACT](dw.extensions.payments.SalesforceAdyenSavedPaymentMethod.md#type_bancontact) type methods.


    **Returns:**
    - payment method credential last 4 digits


---

### getOwnerName()
- getOwnerName(): [String](TopLevel.String.md)
  - : Returns the back account owner name for this payment method, or `null` if none is available. Available
      on [TYPE_SEPA_DEBIT](dw.extensions.payments.SalesforceAdyenSavedPaymentMethod.md#type_sepa_debit) and
      [TYPE_IDEAL](dw.extensions.payments.SalesforceAdyenSavedPaymentMethod.md#type_ideal) type method.


    **Returns:**
    - payment method credential back account owner name


---

### getType()
- getType(): [String](TopLevel.String.md)
  - : Returns the type of this payment method.

    **Returns:**
    - payment method type

    **See Also:**
    - [TYPE_BANCONTACT](dw.extensions.payments.SalesforceAdyenSavedPaymentMethod.md#type_bancontact)
    - [TYPE_CARD](dw.extensions.payments.SalesforceAdyenSavedPaymentMethod.md#type_card)
    - [TYPE_IDEAL](dw.extensions.payments.SalesforceAdyenSavedPaymentMethod.md#type_ideal)
    - [TYPE_SEPA_DEBIT](dw.extensions.payments.SalesforceAdyenSavedPaymentMethod.md#type_sepa_debit)


---

<!-- prettier-ignore-end -->
