<!-- prettier-ignore-start -->
# Class SalesforceKlarnaPaymentDetails

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.extensions.payments.SalesforcePaymentDetails](dw.extensions.payments.SalesforcePaymentDetails.md)
    - [dw.extensions.payments.SalesforceKlarnaPaymentDetails](dw.extensions.payments.SalesforceKlarnaPaymentDetails.md)



Details to a Salesforce Payments payment of type [SalesforcePaymentMethod.TYPE_KLARNA](dw.extensions.payments.SalesforcePaymentMethod.md#type_klarna). See Salesforce Payments
documentation for how to gain access and configure it for use on your sites.



## Property Summary

| Property | Description |
| --- | --- |
| [paymentMethodCategory](#paymentmethodcategory): [String](TopLevel.String.md) `(read-only)` | Returns the payment method category used for the payment, or `null` if not known. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getPaymentMethodCategory](dw.extensions.payments.SalesforceKlarnaPaymentDetails.md#getpaymentmethodcategory)() | Returns the payment method category used for the payment, or `null` if not known. |

### Methods inherited from class SalesforcePaymentDetails

[getType](dw.extensions.payments.SalesforcePaymentDetails.md#gettype)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### paymentMethodCategory
- paymentMethodCategory: [String](TopLevel.String.md) `(read-only)`
  - : Returns the payment method category used for the payment, or `null` if not known.

    **See Also:**
    - [SalesforcePaymentMethod.getPaymentMethodCategory()](dw.extensions.payments.SalesforcePaymentMethod.md#getpaymentmethodcategory)


---

## Method Details

### getPaymentMethodCategory()
- getPaymentMethodCategory(): [String](TopLevel.String.md)
  - : Returns the payment method category used for the payment, or `null` if not known.

    **Returns:**
    - payment method category

    **See Also:**
    - [SalesforcePaymentMethod.getPaymentMethodCategory()](dw.extensions.payments.SalesforcePaymentMethod.md#getpaymentmethodcategory)


---

<!-- prettier-ignore-end -->
