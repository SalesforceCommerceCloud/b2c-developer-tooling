<!-- prettier-ignore-start -->
# Class PaymentProcessor

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.object.PersistentObject](dw.object.PersistentObject.md)
    - [dw.object.ExtensibleObject](dw.object.ExtensibleObject.md)
      - [dw.order.PaymentProcessor](dw.order.PaymentProcessor.md)

A PaymentProcessor represents an entity that processes payments of one or more types. In the B2C Commerce system, a
payment processor is just a container for configuration values, which describe, for example, the parameters (URL,
merchant ID, password, etc) required for connecting to a payment gateway.


The system has several built in PaymentProcessors. These are:

- BASIC\_CREDIT
- BASIC\_GIFT\_CERTIFICATE
- CYBERSOURCE\_CREDIT
- CYBERSOURCE\_BML
- PAYPAL\_CREDIT
- PAYPAL\_EXPRESS
- VERISIGN\_CREDIT

The first two of these are merely placeholders with no associated preference values. The remaining system payment
processors define preference values which are maintained in the Business Manager and are used in conjunction with
built-in B2C Commerce payment integrations. Preferences of system PaymentProcessors are not intended to be read
programmatically.


Merchants may also define custom payment processors. This is done by defining a payment processor with an arbitrary
ID in the Business Manager, and then configuring an attribute group with the same ID on the
[SitePreferences](dw.system.SitePreferences.md) system object. Attributes added to the group will be considered preferences of the
payment processor and will be readable through [getPreferenceValue(String)](dw.order.PaymentProcessor.md#getpreferencevaluestring). Merchants can design their
checkout process to read these preferences at run time for connecting to their payment gateways.


Every [PaymentMethod](dw.order.PaymentMethod.md) in the system is associated with at most one PaymentProcessor. This basically
represents the physical payment gateway which processes the (logical) payment method. Each payment processor may be
associated with an arbitrary number of payment methods. Also, each payment transaction has one PaymentProcessor which
is set by custom code during the checkout process.



## Property Summary

| Property | Description |
| --- | --- |
| [ID](#id): [String](TopLevel.String.md) `(read-only)` | Returns the 'ID' of this processor. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getID](dw.order.PaymentProcessor.md#getid)() | Returns the 'ID' of this processor. |
| [getPreferenceValue](dw.order.PaymentProcessor.md#getpreferencevaluestring)([String](TopLevel.String.md)) | Returns the value of the specified preference for this payment processor. |

### Methods inherited from class ExtensibleObject

[describe](dw.object.ExtensibleObject.md#describe), [getCustom](dw.object.ExtensibleObject.md#getcustom)
### Methods inherited from class PersistentObject

[getCreationDate](dw.object.PersistentObject.md#getcreationdate), [getLastModified](dw.object.PersistentObject.md#getlastmodified), [getUUID](dw.object.PersistentObject.md#getuuid)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### ID
- ID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the 'ID' of this processor.


---

## Method Details

### getID()
- getID(): [String](TopLevel.String.md)
  - : Returns the 'ID' of this processor.

    **Returns:**
    - the 'ID' of this processor, e.g. "BASIC\_CREDIT".


---

### getPreferenceValue(String)
- getPreferenceValue(name: [String](TopLevel.String.md)): [Object](TopLevel.Object.md)
  - : Returns the value of the specified preference for this payment processor.
      If the preference name is invalid (or null) or no preference value is
      defined for this payment processor, null is returned.


    **Parameters:**
    - name - preference name. Typically an attribute defined on             SitePreferences contained in an attribute group whose name is             the same as this.ID.

    **Returns:**
    - preference value, or null.


---

<!-- prettier-ignore-end -->
