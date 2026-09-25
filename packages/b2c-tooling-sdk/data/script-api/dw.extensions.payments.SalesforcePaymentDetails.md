<!-- prettier-ignore-start -->
# Class SalesforcePaymentDetails

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.extensions.payments.SalesforcePaymentDetails](dw.extensions.payments.SalesforcePaymentDetails.md)



Base class details to a payment.




Payment details are differentiated by their type. Some payment types like [TYPE_CARD](dw.extensions.payments.SalesforcePaymentDetails.md#type_card)
contain additional details like the card brand, or the last 4 digits of the card number. Details for those payment
types are represented by a type-specific subclass of this class. Other payment types have no additional information
so their details are represented by an object of this base type.




Payment details contain information about the method and credentials for a payment before any attempt to authorize or
capture a payment amount. Some of that information may be relevant to the payer and is appropriate to present on an
order confirmation or order history page, as well as in an order confirmation email. Other information may only be
important for auditing or fraud check purposes and need not be presented to the payer.



## All Known Subclasses
[GiftCardPaymentDetails](dw.extensions.payments.GiftCardPaymentDetails.md), [SalesforceBancontactPaymentDetails](dw.extensions.payments.SalesforceBancontactPaymentDetails.md), [SalesforceCardPaymentDetails](dw.extensions.payments.SalesforceCardPaymentDetails.md), [SalesforceEpsPaymentDetails](dw.extensions.payments.SalesforceEpsPaymentDetails.md), [SalesforceIdealPaymentDetails](dw.extensions.payments.SalesforceIdealPaymentDetails.md), [SalesforceKlarnaPaymentDetails](dw.extensions.payments.SalesforceKlarnaPaymentDetails.md), [SalesforcePayPalPaymentDetails](dw.extensions.payments.SalesforcePayPalPaymentDetails.md), [SalesforceSepaDebitPaymentDetails](dw.extensions.payments.SalesforceSepaDebitPaymentDetails.md), [SalesforceVenmoPaymentDetails](dw.extensions.payments.SalesforceVenmoPaymentDetails.md)
## Constant Summary

| Constant | Description |
| --- | --- |
| [TYPE_AFTERPAY_CLEARPAY](#type_afterpay_clearpay): [String](TopLevel.String.md) = "afterpay_clearpay" | Represents the Afterpay Clearpay payment method. |
| [TYPE_AMAZON_PAY](#type_amazon_pay): [String](TopLevel.String.md) = "amazon_pay" | Represents the Amazon Pay payment method. |
| [TYPE_BANCONTACT](#type_bancontact): [String](TopLevel.String.md) = "bancontact" | Represents the Bancontact payment method. |
| [TYPE_CARD](#type_card): [String](TopLevel.String.md) = "card" | Represents a credit card type of payment method. |
| [TYPE_EPS](#type_eps): [String](TopLevel.String.md) = "eps" | Represents the EPS (Electronic Payment Standard) payment method. |
| [TYPE_GIFT_CARD](#type_gift_card): [String](TopLevel.String.md) = "gift_card" | Represents a gift card type of payment method. |
| [TYPE_IDEAL](#type_ideal): [String](TopLevel.String.md) = "ideal" | Represents the iDEAL payment method. |
| [TYPE_KLARNA](#type_klarna): [String](TopLevel.String.md) = "klarna" | Represents the Klarna payment method. |
| [TYPE_PAYPAL](#type_paypal): [String](TopLevel.String.md) = "paypal" | Represents the PayPal payment method. |
| [TYPE_SEPA_DEBIT](#type_sepa_debit): [String](TopLevel.String.md) = "sepa_debit" | Represents the SEPA Debit payment method. |
| [TYPE_TWINT](#type_twint): [String](TopLevel.String.md) = "twint" | Represents the TWINT payment method. |
| [TYPE_VENMO](#type_venmo): [String](TopLevel.String.md) = "venmo" | Represents the Venmo payment method. |

## Property Summary

| Property | Description |
| --- | --- |
| [type](#type): [String](TopLevel.String.md) `(read-only)` | Returns the payment type. |

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [SalesforcePaymentDetails](#salesforcepaymentdetailsstring)([String](TopLevel.String.md)) | Constructs a new payment details instance for the given payment type. |

## Method Summary

| Method | Description |
| --- | --- |
| [getType](dw.extensions.payments.SalesforcePaymentDetails.md#gettype)() | Returns the payment type. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### TYPE_AFTERPAY_CLEARPAY

- TYPE_AFTERPAY_CLEARPAY: [String](TopLevel.String.md) = "afterpay_clearpay"
  - : Represents the Afterpay Clearpay payment method.


---

### TYPE_AMAZON_PAY

- TYPE_AMAZON_PAY: [String](TopLevel.String.md) = "amazon_pay"
  - : Represents the Amazon Pay payment method.


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

### TYPE_GIFT_CARD

- TYPE_GIFT_CARD: [String](TopLevel.String.md) = "gift_card"
  - : Represents a gift card type of payment method.


---

### TYPE_IDEAL

- TYPE_IDEAL: [String](TopLevel.String.md) = "ideal"
  - : Represents the iDEAL payment method.


---

### TYPE_KLARNA

- TYPE_KLARNA: [String](TopLevel.String.md) = "klarna"
  - : Represents the Klarna payment method.


---

### TYPE_PAYPAL

- TYPE_PAYPAL: [String](TopLevel.String.md) = "paypal"
  - : Represents the PayPal payment method.


---

### TYPE_SEPA_DEBIT

- TYPE_SEPA_DEBIT: [String](TopLevel.String.md) = "sepa_debit"
  - : Represents the SEPA Debit payment method.


---

### TYPE_TWINT

- TYPE_TWINT: [String](TopLevel.String.md) = "twint"
  - : Represents the TWINT payment method.


---

### TYPE_VENMO

- TYPE_VENMO: [String](TopLevel.String.md) = "venmo"
  - : Represents the Venmo payment method.


---

## Property Details

### type
- type: [String](TopLevel.String.md) `(read-only)`
  - : Returns the payment type.

    **See Also:**
    - [TYPE_AFTERPAY_CLEARPAY](dw.extensions.payments.SalesforcePaymentDetails.md#type_afterpay_clearpay)
    - [TYPE_AMAZON_PAY](dw.extensions.payments.SalesforcePaymentDetails.md#type_amazon_pay)
    - [TYPE_BANCONTACT](dw.extensions.payments.SalesforcePaymentDetails.md#type_bancontact)
    - [TYPE_CARD](dw.extensions.payments.SalesforcePaymentDetails.md#type_card)
    - [TYPE_GIFT_CARD](dw.extensions.payments.SalesforcePaymentDetails.md#type_gift_card)
    - [TYPE_EPS](dw.extensions.payments.SalesforcePaymentDetails.md#type_eps)
    - [TYPE_IDEAL](dw.extensions.payments.SalesforcePaymentDetails.md#type_ideal)
    - [TYPE_KLARNA](dw.extensions.payments.SalesforcePaymentDetails.md#type_klarna)
    - [TYPE_SEPA_DEBIT](dw.extensions.payments.SalesforcePaymentDetails.md#type_sepa_debit)
    - [TYPE_TWINT](dw.extensions.payments.SalesforcePaymentDetails.md#type_twint)
    - [TYPE_PAYPAL](dw.extensions.payments.SalesforcePaymentDetails.md#type_paypal)
    - [TYPE_VENMO](dw.extensions.payments.SalesforcePaymentDetails.md#type_venmo)


---

## Constructor Details

### SalesforcePaymentDetails(String)
- SalesforcePaymentDetails(type: [String](TopLevel.String.md))
  - : Constructs a new payment details instance for the given payment type.

    **Parameters:**
    - type - the payment type, must not be null


---

## Method Details

### getType()
- getType(): [String](TopLevel.String.md)
  - : Returns the payment type.

    **Returns:**
    - payment type

    **See Also:**
    - [TYPE_AFTERPAY_CLEARPAY](dw.extensions.payments.SalesforcePaymentDetails.md#type_afterpay_clearpay)
    - [TYPE_AMAZON_PAY](dw.extensions.payments.SalesforcePaymentDetails.md#type_amazon_pay)
    - [TYPE_BANCONTACT](dw.extensions.payments.SalesforcePaymentDetails.md#type_bancontact)
    - [TYPE_CARD](dw.extensions.payments.SalesforcePaymentDetails.md#type_card)
    - [TYPE_GIFT_CARD](dw.extensions.payments.SalesforcePaymentDetails.md#type_gift_card)
    - [TYPE_EPS](dw.extensions.payments.SalesforcePaymentDetails.md#type_eps)
    - [TYPE_IDEAL](dw.extensions.payments.SalesforcePaymentDetails.md#type_ideal)
    - [TYPE_KLARNA](dw.extensions.payments.SalesforcePaymentDetails.md#type_klarna)
    - [TYPE_SEPA_DEBIT](dw.extensions.payments.SalesforcePaymentDetails.md#type_sepa_debit)
    - [TYPE_TWINT](dw.extensions.payments.SalesforcePaymentDetails.md#type_twint)
    - [TYPE_PAYPAL](dw.extensions.payments.SalesforcePaymentDetails.md#type_paypal)
    - [TYPE_VENMO](dw.extensions.payments.SalesforcePaymentDetails.md#type_venmo)


---

<!-- prettier-ignore-end -->
