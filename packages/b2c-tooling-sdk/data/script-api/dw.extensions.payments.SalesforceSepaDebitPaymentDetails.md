<!-- prettier-ignore-start -->
# Class SalesforceSepaDebitPaymentDetails

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.extensions.payments.SalesforcePaymentDetails](dw.extensions.payments.SalesforcePaymentDetails.md)
    - [dw.extensions.payments.SalesforceSepaDebitPaymentDetails](dw.extensions.payments.SalesforceSepaDebitPaymentDetails.md)

Details to a payment of type [SalesforcePaymentDetails.TYPE_SEPA_DEBIT](dw.extensions.payments.SalesforcePaymentDetails.md#type_sepa_debit).


## Property Summary

| Property | Description |
| --- | --- |
| [accountHolderName](#accountholdername): [String](TopLevel.String.md) | Returns the account holder name, or `null` if not known. |
| [last4](#last4): [String](TopLevel.String.md) | Returns the last 4 digits of the account number, or `null` if not known. |

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [SalesforceSepaDebitPaymentDetails](#salesforcesepadebitpaymentdetails)() | Constructs an empty SEPA debit payment details object. |

## Method Summary

| Method | Description |
| --- | --- |
| [getAccountHolderName](dw.extensions.payments.SalesforceSepaDebitPaymentDetails.md#getaccountholdername)() | Returns the account holder name, or `null` if not known. |
| [getLast4](dw.extensions.payments.SalesforceSepaDebitPaymentDetails.md#getlast4)() | Returns the last 4 digits of the account number, or `null` if not known. |
| [setAccountHolderName](dw.extensions.payments.SalesforceSepaDebitPaymentDetails.md#setaccountholdernamestring)([String](TopLevel.String.md)) | Sets the account holder name. |
| [setLast4](dw.extensions.payments.SalesforceSepaDebitPaymentDetails.md#setlast4string)([String](TopLevel.String.md)) | Sets the last 4 digits of the account number. |

### Methods inherited from class SalesforcePaymentDetails

[getType](dw.extensions.payments.SalesforcePaymentDetails.md#gettype)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### accountHolderName
- accountHolderName: [String](TopLevel.String.md)
  - : Returns the account holder name, or `null` if not known.


---

### last4
- last4: [String](TopLevel.String.md)
  - : Returns the last 4 digits of the account number, or `null` if not known.


---

## Constructor Details

### SalesforceSepaDebitPaymentDetails()
- SalesforceSepaDebitPaymentDetails()
  - : Constructs an empty SEPA debit payment details object.


---

## Method Details

### getAccountHolderName()
- getAccountHolderName(): [String](TopLevel.String.md)
  - : Returns the account holder name, or `null` if not known.

    **Returns:**
    - account holder name


---

### getLast4()
- getLast4(): [String](TopLevel.String.md)
  - : Returns the last 4 digits of the account number, or `null` if not known.

    **Returns:**
    - last 4 digits of the account number


---

### setAccountHolderName(String)
- setAccountHolderName(accountHolderName: [String](TopLevel.String.md)): void
  - : Sets the account holder name.

    **Parameters:**
    - accountHolderName - account holder name


---

### setLast4(String)
- setLast4(last4: [String](TopLevel.String.md)): void
  - : Sets the last 4 digits of the account number. Do not set the full account number.

    **Parameters:**
    - last4 - last 4 digits of the account number


---

<!-- prettier-ignore-end -->
