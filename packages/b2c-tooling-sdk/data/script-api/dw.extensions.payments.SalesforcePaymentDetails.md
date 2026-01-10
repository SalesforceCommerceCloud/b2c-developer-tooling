<!-- prettier-ignore-start -->
# Class SalesforcePaymentDetails

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.extensions.payments.SalesforcePaymentDetails](dw.extensions.payments.SalesforcePaymentDetails.md)



Base class details to a Salesforce Payments payment. See Salesforce Payments documentation for how to gain access and
configure it for use on your sites.




Some payment types like [SalesforcePaymentMethod.TYPE_CARD](dw.extensions.payments.SalesforcePaymentMethod.md#type_card) contain additional details like the card brand, or
the last 4 digits of the card number. Details to those payments will be of a specific subclass of this class like
[SalesforceCardPaymentDetails](dw.extensions.payments.SalesforceCardPaymentDetails.md). Other payment types have no additional information so their details are
represented by an object of this base type.



## All Known Subclasses
[SalesforceBancontactPaymentDetails](dw.extensions.payments.SalesforceBancontactPaymentDetails.md), [SalesforceCardPaymentDetails](dw.extensions.payments.SalesforceCardPaymentDetails.md), [SalesforceEpsPaymentDetails](dw.extensions.payments.SalesforceEpsPaymentDetails.md), [SalesforceIdealPaymentDetails](dw.extensions.payments.SalesforceIdealPaymentDetails.md), [SalesforceKlarnaPaymentDetails](dw.extensions.payments.SalesforceKlarnaPaymentDetails.md), [SalesforcePayPalPaymentDetails](dw.extensions.payments.SalesforcePayPalPaymentDetails.md), [SalesforceSepaDebitPaymentDetails](dw.extensions.payments.SalesforceSepaDebitPaymentDetails.md), [SalesforceVenmoPaymentDetails](dw.extensions.payments.SalesforceVenmoPaymentDetails.md)
## Property Summary

| Property | Description |
| --- | --- |
| [type](#type): [String](TopLevel.String.md) `(read-only)` | Returns the payment type. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getType](dw.extensions.payments.SalesforcePaymentDetails.md#gettype)() | Returns the payment type. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### type
- type: [String](TopLevel.String.md) `(read-only)`
  - : Returns the payment type.

    **See Also:**
    - [SalesforcePaymentMethod.TYPE_BANCONTACT](dw.extensions.payments.SalesforcePaymentMethod.md#type_bancontact)
    - [SalesforcePaymentMethod.TYPE_CARD](dw.extensions.payments.SalesforcePaymentMethod.md#type_card)
    - [SalesforcePaymentMethod.TYPE_EPS](dw.extensions.payments.SalesforcePaymentMethod.md#type_eps)
    - [SalesforcePaymentMethod.TYPE_IDEAL](dw.extensions.payments.SalesforcePaymentMethod.md#type_ideal)
    - [SalesforcePaymentMethod.TYPE_KLARNA](dw.extensions.payments.SalesforcePaymentMethod.md#type_klarna)
    - [SalesforcePaymentMethod.TYPE_SEPA_DEBIT](dw.extensions.payments.SalesforcePaymentMethod.md#type_sepa_debit)
    - [SalesforcePayPalOrder.TYPE_PAYPAL](dw.extensions.payments.SalesforcePayPalOrder.md#type_paypal)
    - [SalesforcePayPalOrder.TYPE_VENMO](dw.extensions.payments.SalesforcePayPalOrder.md#type_venmo)


---

## Method Details

### getType()
- getType(): [String](TopLevel.String.md)
  - : Returns the payment type.

    **Returns:**
    - payment type

    **See Also:**
    - [SalesforcePaymentMethod.TYPE_BANCONTACT](dw.extensions.payments.SalesforcePaymentMethod.md#type_bancontact)
    - [SalesforcePaymentMethod.TYPE_CARD](dw.extensions.payments.SalesforcePaymentMethod.md#type_card)
    - [SalesforcePaymentMethod.TYPE_EPS](dw.extensions.payments.SalesforcePaymentMethod.md#type_eps)
    - [SalesforcePaymentMethod.TYPE_IDEAL](dw.extensions.payments.SalesforcePaymentMethod.md#type_ideal)
    - [SalesforcePaymentMethod.TYPE_KLARNA](dw.extensions.payments.SalesforcePaymentMethod.md#type_klarna)
    - [SalesforcePaymentMethod.TYPE_SEPA_DEBIT](dw.extensions.payments.SalesforcePaymentMethod.md#type_sepa_debit)
    - [SalesforcePayPalOrder.TYPE_PAYPAL](dw.extensions.payments.SalesforcePayPalOrder.md#type_paypal)
    - [SalesforcePayPalOrder.TYPE_VENMO](dw.extensions.payments.SalesforcePayPalOrder.md#type_venmo)


---

<!-- prettier-ignore-end -->
