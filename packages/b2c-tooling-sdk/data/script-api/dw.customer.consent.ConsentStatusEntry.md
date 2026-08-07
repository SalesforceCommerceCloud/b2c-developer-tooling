<!-- prettier-ignore-start -->
# Class ConsentStatusEntry

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.customer.consent.ConsentStatusEntry](dw.customer.consent.ConsentStatusEntry.md)

Represents the consent status for a specific channel and contact point.


This class provides information about the shopper's consent status (OPT\_IN, OPT\_OUT)
for a particular marketing communication channel.



## Property Summary

| Property | Description |
| --- | --- |
| [channel](#channel): [String](TopLevel.String.md) `(read-only)` | Returns the channel type for this consent status entry. |
| [contactPointValue](#contactpointvalue): [String](TopLevel.String.md) `(read-only)` | Returns the contact point value (email address or phone number) for this consent entry. |
| [status](#status): [String](TopLevel.String.md) `(read-only)` | Returns the consent status. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getChannel](dw.customer.consent.ConsentStatusEntry.md#getchannel)() | Returns the channel type for this consent status entry. |
| [getContactPointValue](dw.customer.consent.ConsentStatusEntry.md#getcontactpointvalue)() | Returns the contact point value (email address or phone number) for this consent entry. |
| [getStatus](dw.customer.consent.ConsentStatusEntry.md#getstatus)() | Returns the consent status. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### channel
- channel: [String](TopLevel.String.md) `(read-only)`
  - : Returns the channel type for this consent status entry.


---

### contactPointValue
- contactPointValue: [String](TopLevel.String.md) `(read-only)`
  - : Returns the contact point value (email address or phone number) for this consent entry.


---

### status
- status: [String](TopLevel.String.md) `(read-only)`
  - : Returns the consent status.


---

## Method Details

### getChannel()
- getChannel(): [String](TopLevel.String.md)
  - : Returns the channel type for this consent status entry.

    **Returns:**
    - The channel type (e.g., "EMAIL", "SMS", "WHATSAPP").


---

### getContactPointValue()
- getContactPointValue(): [String](TopLevel.String.md)
  - : Returns the contact point value (email address or phone number) for this consent entry.

    **Returns:**
    - The contact point value.


---

### getStatus()
- getStatus(): [String](TopLevel.String.md)
  - : Returns the consent status.

    **Returns:**
    - The consent status (e.g., "OPT\_IN", "OPT\_OUT").


---

<!-- prettier-ignore-end -->
