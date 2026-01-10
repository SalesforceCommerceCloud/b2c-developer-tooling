<!-- prettier-ignore-start -->
# Class Wallet

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.customer.Wallet](dw.customer.Wallet.md)

Represents a set of payment instruments associated with a registered customer.


**Note:** this class allows access to sensitive personal and private
information. Pay attention to appropriate legal and regulatory requirements
when developing.



## Property Summary

| Property | Description |
| --- | --- |
| [defaultPaymentInstrument](#defaultpaymentinstrument): [CustomerPaymentInstrument](dw.customer.CustomerPaymentInstrument.md) `(read-only)` | Returns the default payment instrument associated with the related customer. |
| [paymentInstruments](#paymentinstruments): [Collection](dw.util.Collection.md) `(read-only)` | Returns a collection of all payment instruments associated with the  related customer. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [createPaymentInstrument](dw.customer.Wallet.md#createpaymentinstrumentstring)([String](TopLevel.String.md)) | Creates a new, empty payment instrument object associated with the  related customer for the given payment method. |
| [getDefaultPaymentInstrument](dw.customer.Wallet.md#getdefaultpaymentinstrument)() | Returns the default payment instrument associated with the related customer. |
| [getPaymentInstruments](dw.customer.Wallet.md#getpaymentinstruments)() | Returns a collection of all payment instruments associated with the  related customer. |
| [getPaymentInstruments](dw.customer.Wallet.md#getpaymentinstrumentsstring)([String](TopLevel.String.md)) | Returns a collection of all payment instruments associated with the  related customer filtered by the given payment method id. |
| [removePaymentInstrument](dw.customer.Wallet.md#removepaymentinstrumentcustomerpaymentinstrument)([CustomerPaymentInstrument](dw.customer.CustomerPaymentInstrument.md)) | Removes a payment instrument associated with the customer. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### defaultPaymentInstrument
- defaultPaymentInstrument: [CustomerPaymentInstrument](dw.customer.CustomerPaymentInstrument.md) `(read-only)`
  - : Returns the default payment instrument associated with the related customer. If not available, returns the first
      payment instrument or null if no payment instruments are associated with the customer.



---

### paymentInstruments
- paymentInstruments: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns a collection of all payment instruments associated with the
      related customer.



---

## Method Details

### createPaymentInstrument(String)
- createPaymentInstrument(paymentMethodId: [String](TopLevel.String.md)): [CustomerPaymentInstrument](dw.customer.CustomerPaymentInstrument.md)
  - : Creates a new, empty payment instrument object associated with the
      related customer for the given payment method.


    **Parameters:**
    - paymentMethodId - the id of a payment method

    **Returns:**
    - the new payment instrument object.

    **Throws:**
    - NullArgumentException - If passed 'paymentMethodId' is null.


---

### getDefaultPaymentInstrument()
- getDefaultPaymentInstrument(): [CustomerPaymentInstrument](dw.customer.CustomerPaymentInstrument.md)
  - : Returns the default payment instrument associated with the related customer. If not available, returns the first
      payment instrument or null if no payment instruments are associated with the customer.


    **Returns:**
    - The default payment instrument object.


---

### getPaymentInstruments()
- getPaymentInstruments(): [Collection](dw.util.Collection.md)
  - : Returns a collection of all payment instruments associated with the
      related customer.


    **Returns:**
    - Collection of all payment instruments.


---

### getPaymentInstruments(String)
- getPaymentInstruments(paymentMethodID: [String](TopLevel.String.md)): [Collection](dw.util.Collection.md)
  - : Returns a collection of all payment instruments associated with the
      related customer filtered by the given payment method id. If
      `null` is passed as payment method id all payment instruments
      of the customer will be retrieved. If for the given payment method id no
      payment instrument is associated with the customer an empty collection
      will be returned.


    **Parameters:**
    - paymentMethodID - the paymentMethodID the payment method id to filter for

    **Returns:**
    - Collection of payment instruments for a payment method.


---

### removePaymentInstrument(CustomerPaymentInstrument)
- removePaymentInstrument(instrument: [CustomerPaymentInstrument](dw.customer.CustomerPaymentInstrument.md)): void
  - : Removes a payment instrument associated with the customer.

    **Parameters:**
    - instrument - the instrument associated with this customer

    **Throws:**
    - NullArgumentException - If passed 'instrument' is null.
    - IllegalArgumentException - If passed 'instrument' belongs to an other customer


---

<!-- prettier-ignore-end -->
