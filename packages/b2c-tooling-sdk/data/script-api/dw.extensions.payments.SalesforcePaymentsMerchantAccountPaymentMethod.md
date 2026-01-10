<!-- prettier-ignore-start -->
# Class SalesforcePaymentsMerchantAccountPaymentMethod

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.extensions.payments.SalesforcePaymentsMerchantAccountPaymentMethod](dw.extensions.payments.SalesforcePaymentsMerchantAccountPaymentMethod.md)

Contains information about a payment method to be presented to a payer, as configured for a Salesforce Payments
merchant account. See Salesforce Payments documentation for how to gain access and configure it for use on your
sites.



## Property Summary

| Property | Description |
| --- | --- |
| [merchantAccount](#merchantaccount): [SalesforcePaymentsMerchantAccount](dw.extensions.payments.SalesforcePaymentsMerchantAccount.md) `(read-only)` | Returns the merchant account configured for this payment method. |
| [paymentMethodType](#paymentmethodtype): [String](TopLevel.String.md) `(read-only)` | Returns the constant indicating the type of payment method to be presented, such as  [SalesforcePaymentMethod.TYPE_CARD](dw.extensions.payments.SalesforcePaymentMethod.md#type_card). |
| [paymentModes](#paymentmodes): [Collection](dw.util.Collection.md) `(read-only)` | Returns a collection containing the payment modes for which this payment method is to be presented, such as  `"Express"`. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getMerchantAccount](dw.extensions.payments.SalesforcePaymentsMerchantAccountPaymentMethod.md#getmerchantaccount)() | Returns the merchant account configured for this payment method. |
| [getPaymentMethodType](dw.extensions.payments.SalesforcePaymentsMerchantAccountPaymentMethod.md#getpaymentmethodtype)() | Returns the constant indicating the type of payment method to be presented, such as  [SalesforcePaymentMethod.TYPE_CARD](dw.extensions.payments.SalesforcePaymentMethod.md#type_card). |
| [getPaymentModes](dw.extensions.payments.SalesforcePaymentsMerchantAccountPaymentMethod.md#getpaymentmodes)() | Returns a collection containing the payment modes for which this payment method is to be presented, such as  `"Express"`. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### merchantAccount
- merchantAccount: [SalesforcePaymentsMerchantAccount](dw.extensions.payments.SalesforcePaymentsMerchantAccount.md) `(read-only)`
  - : Returns the merchant account configured for this payment method.


---

### paymentMethodType
- paymentMethodType: [String](TopLevel.String.md) `(read-only)`
  - : Returns the constant indicating the type of payment method to be presented, such as
      [SalesforcePaymentMethod.TYPE_CARD](dw.extensions.payments.SalesforcePaymentMethod.md#type_card).



---

### paymentModes
- paymentModes: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns a collection containing the payment modes for which this payment method is to be presented, such as
      `"Express"`.



---

## Method Details

### getMerchantAccount()
- getMerchantAccount(): [SalesforcePaymentsMerchantAccount](dw.extensions.payments.SalesforcePaymentsMerchantAccount.md)
  - : Returns the merchant account configured for this payment method.

    **Returns:**
    - merchant account


---

### getPaymentMethodType()
- getPaymentMethodType(): [String](TopLevel.String.md)
  - : Returns the constant indicating the type of payment method to be presented, such as
      [SalesforcePaymentMethod.TYPE_CARD](dw.extensions.payments.SalesforcePaymentMethod.md#type_card).


    **Returns:**
    - payment method type


---

### getPaymentModes()
- getPaymentModes(): [Collection](dw.util.Collection.md)
  - : Returns a collection containing the payment modes for which this payment method is to be presented, such as
      `"Express"`.


    **Returns:**
    - collection of payment modes


---

<!-- prettier-ignore-end -->
