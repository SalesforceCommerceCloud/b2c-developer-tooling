<!-- prettier-ignore-start -->
# Class PaymentMethod

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.object.PersistentObject](dw.object.PersistentObject.md)
    - [dw.object.ExtensibleObject](dw.object.ExtensibleObject.md)
      - [dw.order.PaymentMethod](dw.order.PaymentMethod.md)

The PaymentMethod class represents a logical type of payment a customer can
make in the storefront. This class provides methods to access the payment
method attributes, status, and (for card-based payment methods) the related
payment cards.


A typical storefront presents the customer a list of payment methods that a
customer can choose from after he has entered his billing address during the
checkout.
[PaymentMgr.getApplicablePaymentMethods(Customer, String, Number)](dw.order.PaymentMgr.md#getapplicablepaymentmethodscustomer-string-number)
is used to determine the PaymentMethods that are relevant for the customer
based on the amount of his order, his customer groups, and his shipping
address.



## Property Summary

| Property | Description |
| --- | --- |
| [ID](#id): [String](TopLevel.String.md) `(read-only)` | Returns the unique ID of the payment method. |
| [active](#active): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns 'true' if payment method is active (enabled), otherwise 'false' is returned. |
| [activePaymentCards](#activepaymentcards): [List](dw.util.List.md) `(read-only)` | Returns enabled payment cards that are assigned to this payment method, regardless  of current customer, country or payment amount restrictions. |
| [description](#description): [MarkupText](dw.content.MarkupText.md) `(read-only)` | Returns the description of the payment method. |
| [image](#image): [MediaFile](dw.content.MediaFile.md) `(read-only)` | Returns the reference to the payment method image. |
| [name](#name): [String](TopLevel.String.md) `(read-only)` | Returns the name of the payment method. |
| [paymentProcessor](#paymentprocessor): [PaymentProcessor](dw.order.PaymentProcessor.md) `(read-only)` | Returns the payment processor associated to this payment method. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getActivePaymentCards](dw.order.PaymentMethod.md#getactivepaymentcards)() | Returns enabled payment cards that are assigned to this payment method, regardless  of current customer, country or payment amount restrictions. |
| [getApplicablePaymentCards](dw.order.PaymentMethod.md#getapplicablepaymentcardscustomer-string-number)([Customer](dw.customer.Customer.md), [String](TopLevel.String.md), [Number](TopLevel.Number.md)) | Returns the sorted list of all enabled payment cards of this payment  method applicable for the specified customer, country, payment amount and the session currency  The payment cards are sorted as defined in the Business Manager. |
| [getDescription](dw.order.PaymentMethod.md#getdescription)() | Returns the description of the payment method. |
| [getID](dw.order.PaymentMethod.md#getid)() | Returns the unique ID of the payment method. |
| [getImage](dw.order.PaymentMethod.md#getimage)() | Returns the reference to the payment method image. |
| [getName](dw.order.PaymentMethod.md#getname)() | Returns the name of the payment method. |
| [getPaymentProcessor](dw.order.PaymentMethod.md#getpaymentprocessor)() | Returns the payment processor associated to this payment method. |
| [isActive](dw.order.PaymentMethod.md#isactive)() | Returns 'true' if payment method is active (enabled), otherwise 'false' is returned. |
| [isApplicable](dw.order.PaymentMethod.md#isapplicablecustomer-string-number)([Customer](dw.customer.Customer.md), [String](TopLevel.String.md), [Number](TopLevel.Number.md)) | Returns 'true' if this payment method is applicable for the specified  customer, country and payment amount and the session currency. |

### Methods inherited from class ExtensibleObject

[describe](dw.object.ExtensibleObject.md#describe), [getCustom](dw.object.ExtensibleObject.md#getcustom)
### Methods inherited from class PersistentObject

[getCreationDate](dw.object.PersistentObject.md#getcreationdate), [getLastModified](dw.object.PersistentObject.md#getlastmodified), [getUUID](dw.object.PersistentObject.md#getuuid)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### ID
- ID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the unique ID of the payment method.


---

### active
- active: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns 'true' if payment method is active (enabled), otherwise 'false' is returned.


---

### activePaymentCards
- activePaymentCards: [List](dw.util.List.md) `(read-only)`
  - : Returns enabled payment cards that are assigned to this payment method, regardless
      of current customer, country or payment amount restrictions.
      The payment cards are sorted as defined in the Business Manager.



---

### description
- description: [MarkupText](dw.content.MarkupText.md) `(read-only)`
  - : Returns the description of the payment method.


---

### image
- image: [MediaFile](dw.content.MediaFile.md) `(read-only)`
  - : Returns the reference to the payment method image.


---

### name
- name: [String](TopLevel.String.md) `(read-only)`
  - : Returns the name of the payment method.


---

### paymentProcessor
- paymentProcessor: [PaymentProcessor](dw.order.PaymentProcessor.md) `(read-only)`
  - : Returns the payment processor associated to this payment method.


---

## Method Details

### getActivePaymentCards()
- getActivePaymentCards(): [List](dw.util.List.md)
  - : Returns enabled payment cards that are assigned to this payment method, regardless
      of current customer, country or payment amount restrictions.
      The payment cards are sorted as defined in the Business Manager.


    **Returns:**
    - List of enabled payment cards of current site


---

### getApplicablePaymentCards(Customer, String, Number)
- getApplicablePaymentCards(customer: [Customer](dw.customer.Customer.md), countryCode: [String](TopLevel.String.md), paymentAmount: [Number](TopLevel.Number.md)): [List](dw.util.List.md)
  - : Returns the sorted list of all enabled payment cards of this payment
      method applicable for the specified customer, country, payment amount and the session currency
      The payment cards are sorted as defined in the Business Manager. 
      
      
      A payment card is applicable if
      
      - the card is restricted by customer group, and at least one of  the groups of the specified customer is assigned to the card
      - the card is restricted by billing country, and the specified  country code is assigned to the card
      - the card is restricted by payment amount for the session currency,  and the specified payment amount is within the limits of the min/max  payment amount defined for the method and the session currency
      - the card is restricted by currency code, and the specified  currency code matches session currency.
      
      
      All parameters are optional, and if not specified, the respective
      restriction won't be validated. For example, if a card is restricted
      by billing country, but no country code is specified, this card will
      be returned, unless it is filtered out by customer group or payment
      amount.


    **Parameters:**
    - customer - Customer or null
    - countryCode - Billing country code or null
    - paymentAmount - Payment amount or null

    **Returns:**
    - List of applicable payment cards of this payment method


---

### getDescription()
- getDescription(): [MarkupText](dw.content.MarkupText.md)
  - : Returns the description of the payment method.

    **Returns:**
    - Description of the payment method.


---

### getID()
- getID(): [String](TopLevel.String.md)
  - : Returns the unique ID of the payment method.

    **Returns:**
    - ID of the payment method.


---

### getImage()
- getImage(): [MediaFile](dw.content.MediaFile.md)
  - : Returns the reference to the payment method image.

    **Returns:**
    - Image of the payment method.


---

### getName()
- getName(): [String](TopLevel.String.md)
  - : Returns the name of the payment method.

    **Returns:**
    - Name of the payment method.


---

### getPaymentProcessor()
- getPaymentProcessor(): [PaymentProcessor](dw.order.PaymentProcessor.md)
  - : Returns the payment processor associated to this payment method.

    **Returns:**
    - the payment processor associated to this payment method.


---

### isActive()
- isActive(): [Boolean](TopLevel.Boolean.md)
  - : Returns 'true' if payment method is active (enabled), otherwise 'false' is returned.

    **Returns:**
    - true if payment method is active, otherwise false.


---

### isApplicable(Customer, String, Number)
- isApplicable(customer: [Customer](dw.customer.Customer.md), countryCode: [String](TopLevel.String.md), paymentAmount: [Number](TopLevel.Number.md)): [Boolean](TopLevel.Boolean.md)
  - : Returns 'true' if this payment method is applicable for the specified
      customer, country and payment amount and the session currency.
      
      
      
      The payment method is applicable if
      
      - the method is restricted by customer group, and at least one of the  groups of the specified customer is assigned to the method
      - the method is restricted by billing country, and the specified  country code is assigned to the method
      - the method is restricted by payment amount for the session currency,  and the specified payment amount is within the limits of the min/max  payment amount defined for the method and the session currency
      - the method is restricted by currency code, and the specified  currency code matches session currency.
      
      
      All parameters are optional, and if not specified, the respective
      restriction won't be validated. For example, if a method is restricted by
      billing country, but no country code is specified, this method will be
      returned, unless it is filtered out by customer group or payment amount.


    **Parameters:**
    - customer - Customer or null
    - countryCode - Billing country code or null
    - paymentAmount - Payment amount or null

    **Returns:**
    - true if payment method is applicable, false otherwise


---

<!-- prettier-ignore-end -->
