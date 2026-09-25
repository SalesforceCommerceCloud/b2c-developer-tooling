<!-- prettier-ignore-start -->
# Class SalesforceEpsPaymentDetails

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.extensions.payments.SalesforcePaymentDetails](dw.extensions.payments.SalesforcePaymentDetails.md)
    - [dw.extensions.payments.SalesforceEpsPaymentDetails](dw.extensions.payments.SalesforceEpsPaymentDetails.md)

Details to a payment of type [SalesforcePaymentDetails.TYPE_EPS](dw.extensions.payments.SalesforcePaymentDetails.md#type_eps).


## Property Summary

| Property | Description |
| --- | --- |
| [bank](#bank): [String](TopLevel.String.md) | Returns the bank used for the payment, or `null` if not known. |

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [SalesforceEpsPaymentDetails](#salesforceepspaymentdetails)() | Constructs an empty EPS payment details object. |

## Method Summary

| Method | Description |
| --- | --- |
| [getBank](dw.extensions.payments.SalesforceEpsPaymentDetails.md#getbank)() | Returns the bank used for the payment, or `null` if not known. |
| [setBank](dw.extensions.payments.SalesforceEpsPaymentDetails.md#setbankstring)([String](TopLevel.String.md)) | Sets the bank used for the payment. |

### Methods inherited from class SalesforcePaymentDetails

[getType](dw.extensions.payments.SalesforcePaymentDetails.md#gettype)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### bank
- bank: [String](TopLevel.String.md)
  - : Returns the bank used for the payment, or `null` if not known.


---

## Constructor Details

### SalesforceEpsPaymentDetails()
- SalesforceEpsPaymentDetails()
  - : Constructs an empty EPS payment details object.


---

## Method Details

### getBank()
- getBank(): [String](TopLevel.String.md)
  - : Returns the bank used for the payment, or `null` if not known.

    **Returns:**
    - bank


---

### setBank(String)
- setBank(bank: [String](TopLevel.String.md)): void
  - : Sets the bank used for the payment.

    **Parameters:**
    - bank - bank


---

<!-- prettier-ignore-end -->
