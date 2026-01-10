<!-- prettier-ignore-start -->
# Class SalesforcePaymentMethod

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.extensions.payments.SalesforcePaymentMethod](dw.extensions.payments.SalesforcePaymentMethod.md)



Salesforce Payments representation of a payment method object. See Salesforce Payments documentation for how
to gain access and configure it for use on your sites.




A payment method contains information about a credential used by a shopper to attempt payment, such as a payment card
or bank account. The available information differs for each type of payment method. It includes only limited
information that can be safely presented to a shopper to remind them what credential they used, and specifically not
complete card, account, or other numbers that could be used to make future payments.



## Constant Summary

| Constant | Description |
| --- | --- |
| [TYPE_AFTERPAY_CLEARPAY](#type_afterpay_clearpay): [String](TopLevel.String.md) = "afterpay_clearpay" | Represents the Afterpay Clearpay payment method. |
| [TYPE_BANCONTACT](#type_bancontact): [String](TopLevel.String.md) = "bancontact" | Represents the Bancontact payment method. |
| [TYPE_CARD](#type_card): [String](TopLevel.String.md) = "card" | Represents a credit card type of payment method. |
| [TYPE_EPS](#type_eps): [String](TopLevel.String.md) = "eps" | Represents the EPS (Electronic Payment Standard) payment method. |
| [TYPE_IDEAL](#type_ideal): [String](TopLevel.String.md) = "ideal" | Represents the iDEAL payment method. |
| [TYPE_KLARNA](#type_klarna): [String](TopLevel.String.md) = "klarna" | Represents the Klarna payment method. |
| [TYPE_SEPA_DEBIT](#type_sepa_debit): [String](TopLevel.String.md) = "sepa_debit" | Represents the SEPA Debit payment method. |

## Property Summary

| Property | Description |
| --- | --- |
| [ID](#id): [String](TopLevel.String.md) `(read-only)` | Returns the identifier of this payment method. |
| [bank](#bank): [String](TopLevel.String.md) `(read-only)` | Returns the bank of this payment method, or `null` if none is available. |
| [bankCode](#bankcode): [String](TopLevel.String.md) `(read-only)` | Returns the bank code of this payment method, or `null` if none is available. |
| [bankName](#bankname): [String](TopLevel.String.md) `(read-only)` | Returns the bank name of this payment method, or `null` if none is available. |
| [branchCode](#branchcode): [String](TopLevel.String.md) `(read-only)` | Returns the bank branch code of this payment method, or `null` if none is available. |
| [brand](#brand): [String](TopLevel.String.md) `(read-only)` | Returns the brand of this payment method, or `null` if none is available. |
| [country](#country): [String](TopLevel.String.md) `(read-only)` | Returns the country of this payment method, or `null` if none is available. |
| [last4](#last4): [String](TopLevel.String.md) `(read-only)` | Returns the last 4 digits of the credential for this payment method, or `null` if none is available. |
| [paymentMethodCategory](#paymentmethodcategory): [String](TopLevel.String.md) `(read-only)` | Returns the payment method category of this payment method, or `null` if none is available. |
| [type](#type): [String](TopLevel.String.md) `(read-only)` | Returns the type of this payment method. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getBank](dw.extensions.payments.SalesforcePaymentMethod.md#getbank)() | Returns the bank of this payment method, or `null` if none is available. |
| [getBankCode](dw.extensions.payments.SalesforcePaymentMethod.md#getbankcode)() | Returns the bank code of this payment method, or `null` if none is available. |
| [getBankName](dw.extensions.payments.SalesforcePaymentMethod.md#getbankname)() | Returns the bank name of this payment method, or `null` if none is available. |
| [getBranchCode](dw.extensions.payments.SalesforcePaymentMethod.md#getbranchcode)() | Returns the bank branch code of this payment method, or `null` if none is available. |
| [getBrand](dw.extensions.payments.SalesforcePaymentMethod.md#getbrand)() | Returns the brand of this payment method, or `null` if none is available. |
| [getCountry](dw.extensions.payments.SalesforcePaymentMethod.md#getcountry)() | Returns the country of this payment method, or `null` if none is available. |
| [getID](dw.extensions.payments.SalesforcePaymentMethod.md#getid)() | Returns the identifier of this payment method. |
| [getLast4](dw.extensions.payments.SalesforcePaymentMethod.md#getlast4)() | Returns the last 4 digits of the credential for this payment method, or `null` if none is available. |
| [getPaymentDetails](dw.extensions.payments.SalesforcePaymentMethod.md#getpaymentdetailsorderpaymentinstrument)([OrderPaymentInstrument](dw.order.OrderPaymentInstrument.md)) | Returns the details to the Salesforce Payments payment for this payment method, using the given payment  instrument. |
| [getPaymentMethodCategory](dw.extensions.payments.SalesforcePaymentMethod.md#getpaymentmethodcategory)() | Returns the payment method category of this payment method, or `null` if none is available. |
| [getType](dw.extensions.payments.SalesforcePaymentMethod.md#gettype)() | Returns the type of this payment method. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### TYPE_AFTERPAY_CLEARPAY

- TYPE_AFTERPAY_CLEARPAY: [String](TopLevel.String.md) = "afterpay_clearpay"
  - : Represents the Afterpay Clearpay payment method.


---

### TYPE_BANCONTACT

- TYPE_BANCONTACT: [String](TopLevel.String.md) = "bancontact"
  - : Represents the Bancontact payment method.


---

### TYPE_CARD

- TYPE_CARD: [String](TopLevel.String.md) = "card"
  - : Represents a credit card type of payment method.


---

### TYPE_EPS

- TYPE_EPS: [String](TopLevel.String.md) = "eps"
  - : Represents the EPS (Electronic Payment Standard) payment method.


---

### TYPE_IDEAL

- TYPE_IDEAL: [String](TopLevel.String.md) = "ideal"
  - : Represents the iDEAL payment method.


---

### TYPE_KLARNA

- TYPE_KLARNA: [String](TopLevel.String.md) = "klarna"
  - : Represents the Klarna payment method.


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

### bank
- bank: [String](TopLevel.String.md) `(read-only)`
  - : Returns the bank of this payment method, or `null` if none is available. Available on
      [TYPE_IDEAL](dw.extensions.payments.SalesforcePaymentMethod.md#type_ideal) and [TYPE_EPS](dw.extensions.payments.SalesforcePaymentMethod.md#type_eps) type methods.



---

### bankCode
- bankCode: [String](TopLevel.String.md) `(read-only)`
  - : Returns the bank code of this payment method, or `null` if none is available. Available on
      [TYPE_SEPA_DEBIT](dw.extensions.payments.SalesforcePaymentMethod.md#type_sepa_debit) and [TYPE_BANCONTACT](dw.extensions.payments.SalesforcePaymentMethod.md#type_bancontact) type methods.



---

### bankName
- bankName: [String](TopLevel.String.md) `(read-only)`
  - : Returns the bank name of this payment method, or `null` if none is available. Available on
      [TYPE_BANCONTACT](dw.extensions.payments.SalesforcePaymentMethod.md#type_bancontact) type methods.



---

### branchCode
- branchCode: [String](TopLevel.String.md) `(read-only)`
  - : Returns the bank branch code of this payment method, or `null` if none is available. Available on
      [TYPE_SEPA_DEBIT](dw.extensions.payments.SalesforcePaymentMethod.md#type_sepa_debit) type methods.



---

### brand
- brand: [String](TopLevel.String.md) `(read-only)`
  - : Returns the brand of this payment method, or `null` if none is available. Available on
      [TYPE_CARD](dw.extensions.payments.SalesforcePaymentMethod.md#type_card) type methods.



---

### country
- country: [String](TopLevel.String.md) `(read-only)`
  - : Returns the country of this payment method, or `null` if none is available. Available on
      [TYPE_SEPA_DEBIT](dw.extensions.payments.SalesforcePaymentMethod.md#type_sepa_debit) type methods.



---

### last4
- last4: [String](TopLevel.String.md) `(read-only)`
  - : Returns the last 4 digits of the credential for this payment method, or `null` if none is available.
      Available on [TYPE_CARD](dw.extensions.payments.SalesforcePaymentMethod.md#type_card), [TYPE_SEPA_DEBIT](dw.extensions.payments.SalesforcePaymentMethod.md#type_sepa_debit), and
      [TYPE_BANCONTACT](dw.extensions.payments.SalesforcePaymentMethod.md#type_bancontact) type methods.



---

### paymentMethodCategory
- paymentMethodCategory: [String](TopLevel.String.md) `(read-only)`
  - : Returns the payment method category of this payment method, or `null` if none is available. Available
      on [TYPE_KLARNA](dw.extensions.payments.SalesforcePaymentMethod.md#type_klarna) type methods.



---

### type
- type: [String](TopLevel.String.md) `(read-only)`
  - : Returns the type of this payment method.

    **See Also:**
    - [TYPE_BANCONTACT](dw.extensions.payments.SalesforcePaymentMethod.md#type_bancontact)
    - [TYPE_CARD](dw.extensions.payments.SalesforcePaymentMethod.md#type_card)
    - [TYPE_EPS](dw.extensions.payments.SalesforcePaymentMethod.md#type_eps)
    - [TYPE_AFTERPAY_CLEARPAY](dw.extensions.payments.SalesforcePaymentMethod.md#type_afterpay_clearpay)
    - [TYPE_IDEAL](dw.extensions.payments.SalesforcePaymentMethod.md#type_ideal)
    - [TYPE_SEPA_DEBIT](dw.extensions.payments.SalesforcePaymentMethod.md#type_sepa_debit)


---

## Method Details

### getBank()
- getBank(): [String](TopLevel.String.md)
  - : Returns the bank of this payment method, or `null` if none is available. Available on
      [TYPE_IDEAL](dw.extensions.payments.SalesforcePaymentMethod.md#type_ideal) and [TYPE_EPS](dw.extensions.payments.SalesforcePaymentMethod.md#type_eps) type methods.


    **Returns:**
    - payment method bank


---

### getBankCode()
- getBankCode(): [String](TopLevel.String.md)
  - : Returns the bank code of this payment method, or `null` if none is available. Available on
      [TYPE_SEPA_DEBIT](dw.extensions.payments.SalesforcePaymentMethod.md#type_sepa_debit) and [TYPE_BANCONTACT](dw.extensions.payments.SalesforcePaymentMethod.md#type_bancontact) type methods.


    **Returns:**
    - payment method bank code


---

### getBankName()
- getBankName(): [String](TopLevel.String.md)
  - : Returns the bank name of this payment method, or `null` if none is available. Available on
      [TYPE_BANCONTACT](dw.extensions.payments.SalesforcePaymentMethod.md#type_bancontact) type methods.


    **Returns:**
    - payment method bank name


---

### getBranchCode()
- getBranchCode(): [String](TopLevel.String.md)
  - : Returns the bank branch code of this payment method, or `null` if none is available. Available on
      [TYPE_SEPA_DEBIT](dw.extensions.payments.SalesforcePaymentMethod.md#type_sepa_debit) type methods.


    **Returns:**
    - payment method bank branch code


---

### getBrand()
- getBrand(): [String](TopLevel.String.md)
  - : Returns the brand of this payment method, or `null` if none is available. Available on
      [TYPE_CARD](dw.extensions.payments.SalesforcePaymentMethod.md#type_card) type methods.


    **Returns:**
    - payment method brand


---

### getCountry()
- getCountry(): [String](TopLevel.String.md)
  - : Returns the country of this payment method, or `null` if none is available. Available on
      [TYPE_SEPA_DEBIT](dw.extensions.payments.SalesforcePaymentMethod.md#type_sepa_debit) type methods.


    **Returns:**
    - payment method country


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
      Available on [TYPE_CARD](dw.extensions.payments.SalesforcePaymentMethod.md#type_card), [TYPE_SEPA_DEBIT](dw.extensions.payments.SalesforcePaymentMethod.md#type_sepa_debit), and
      [TYPE_BANCONTACT](dw.extensions.payments.SalesforcePaymentMethod.md#type_bancontact) type methods.


    **Returns:**
    - payment method credential last 4 digits


---

### getPaymentDetails(OrderPaymentInstrument)
- getPaymentDetails(paymentInstrument: [OrderPaymentInstrument](dw.order.OrderPaymentInstrument.md)): [SalesforcePaymentDetails](dw.extensions.payments.SalesforcePaymentDetails.md)
  - : Returns the details to the Salesforce Payments payment for this payment method, using the given payment
      instrument.


    **Parameters:**
    - paymentInstrument - payment instrument

    **Returns:**
    - The payment details


---

### getPaymentMethodCategory()
- getPaymentMethodCategory(): [String](TopLevel.String.md)
  - : Returns the payment method category of this payment method, or `null` if none is available. Available
      on [TYPE_KLARNA](dw.extensions.payments.SalesforcePaymentMethod.md#type_klarna) type methods.


    **Returns:**
    - payment method category


---

### getType()
- getType(): [String](TopLevel.String.md)
  - : Returns the type of this payment method.

    **Returns:**
    - payment method type

    **See Also:**
    - [TYPE_BANCONTACT](dw.extensions.payments.SalesforcePaymentMethod.md#type_bancontact)
    - [TYPE_CARD](dw.extensions.payments.SalesforcePaymentMethod.md#type_card)
    - [TYPE_EPS](dw.extensions.payments.SalesforcePaymentMethod.md#type_eps)
    - [TYPE_AFTERPAY_CLEARPAY](dw.extensions.payments.SalesforcePaymentMethod.md#type_afterpay_clearpay)
    - [TYPE_IDEAL](dw.extensions.payments.SalesforcePaymentMethod.md#type_ideal)
    - [TYPE_SEPA_DEBIT](dw.extensions.payments.SalesforcePaymentMethod.md#type_sepa_debit)


---

<!-- prettier-ignore-end -->
