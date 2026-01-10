<!-- prettier-ignore-start -->
# Class PaymentMgr

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.order.PaymentMgr](dw.order.PaymentMgr.md)

[PaymentMgr](dw.order.PaymentMgr.md) is used to access payment methods and payment
cards of the current site.


To access payment methods and payment cards explicitly, use methods
[getPaymentMethod(String)](dw.order.PaymentMgr.md#getpaymentmethodstring) and [getPaymentCard(String)](dw.order.PaymentMgr.md#getpaymentcardstring).



To access active payment methods use method [getActivePaymentMethods()](dw.order.PaymentMgr.md#getactivepaymentmethods).



To access applicable payment methods for a customer, country and/or payment
amount use method [getApplicablePaymentMethods(Customer, String, Number)](dw.order.PaymentMgr.md#getapplicablepaymentmethodscustomer-string-number).



## Property Summary

| Property | Description |
| --- | --- |
| [activePaymentMethods](#activepaymentmethods): [List](dw.util.List.md) `(read-only)` | Returns the sorted list of all enabled payment methods of the current  site, regardless of any customer group, country, payment amount or currency  restrictions. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| static [getActivePaymentMethods](dw.order.PaymentMgr.md#getactivepaymentmethods)() | Returns the sorted list of all enabled payment methods of the current  site, regardless of any customer group, country, payment amount or currency  restrictions. |
| static [getApplicablePaymentMethods](dw.order.PaymentMgr.md#getapplicablepaymentmethodscustomer-string-number)([Customer](dw.customer.Customer.md), [String](TopLevel.String.md), [Number](TopLevel.Number.md)) | Returns the sorted list of all enabled payment methods of the current  site applicable for the session currency, specified customer, country and payment amount. |
| static [getPaymentCard](dw.order.PaymentMgr.md#getpaymentcardstring)([String](TopLevel.String.md)) | Returns the payment card for the specified cardType or null if no such  card exists in the current site. |
| static [getPaymentMethod](dw.order.PaymentMgr.md#getpaymentmethodstring)([String](TopLevel.String.md)) | Returns the payment method for the specified ID or null if no such method  exists in the current site. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### activePaymentMethods
- activePaymentMethods: [List](dw.util.List.md) `(read-only)`
  - : Returns the sorted list of all enabled payment methods of the current
      site, regardless of any customer group, country, payment amount or currency
      restrictions. The payment methods are sorted as defined in the Business
      Manager.



---

## Method Details

### getActivePaymentMethods()
- static getActivePaymentMethods(): [List](dw.util.List.md)
  - : Returns the sorted list of all enabled payment methods of the current
      site, regardless of any customer group, country, payment amount or currency
      restrictions. The payment methods are sorted as defined in the Business
      Manager.


    **Returns:**
    - List of enabled payment methods of current site


---

### getApplicablePaymentMethods(Customer, String, Number)
- static getApplicablePaymentMethods(customer: [Customer](dw.customer.Customer.md), countryCode: [String](TopLevel.String.md), paymentAmount: [Number](TopLevel.Number.md)): [List](dw.util.List.md)
  - : Returns the sorted list of all enabled payment methods of the current
      site applicable for the session currency, specified customer, country and payment amount.
      The payment methods are sorted as defined in the Business Manager. 
      
      
      A payment method is applicable if
      
      - the method is restricted by customer group, and at least one of  the groups of the specified customer is assigned to the method
      - the method is restricted by billing country, and the specified  country code is assigned to the method
      - the method is restricted by payment amount for the session currency,  and the specified payment amount is within the limits of the min/max  payment amount defined for the method and the session currency
      - the method is restricted by currency code, and the specified  currency code matches session currency.
      
      
      All parameters are optional, and if not specified, the respective
      restriction won't be validated. For example, if a method is restricted
      by billing country, but no country code is specified, this method will
      be returned, unless it is filtered out by customer group or payment
      amount.


    **Parameters:**
    - customer - Customer or null
    - countryCode - Billing country code or null
    - paymentAmount - Payment amount or null

    **Returns:**
    - List of applicable payment methods of current site


---

### getPaymentCard(String)
- static getPaymentCard(cardType: [String](TopLevel.String.md)): [PaymentCard](dw.order.PaymentCard.md)
  - : Returns the payment card for the specified cardType or null if no such
      card exists in the current site.


    **Parameters:**
    - cardType - PaymentCard type

    **Returns:**
    - PaymentCard or null


---

### getPaymentMethod(String)
- static getPaymentMethod(id: [String](TopLevel.String.md)): [PaymentMethod](dw.order.PaymentMethod.md)
  - : Returns the payment method for the specified ID or null if no such method
      exists in the current site.


    **Parameters:**
    - id - PaymentMethod ID

    **Returns:**
    - PaymentMethod or null


---

<!-- prettier-ignore-end -->
