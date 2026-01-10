<!-- prettier-ignore-start -->
# Class CustomerCDPData

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.customer.CustomerCDPData](dw.customer.CustomerCDPData.md)

Represents the read-only Customer's Salesforce CDP (Customer Data Platform) data for a [Customer](dw.customer.Customer.md) in Commerce
Cloud. Please see Salesforce CDP enablement documentation



## Property Summary

| Property | Description |
| --- | --- |
| [empty](#empty): [Boolean](TopLevel.Boolean.md) `(read-only)` | Return true if the CDPData is empty (has no meaningful data) |
| [segments](#segments): [String\[\]](TopLevel.String.md) `(read-only)` | Returns an array containing the CDP segments for the customer, or an empty array if no segments found |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getSegments](dw.customer.CustomerCDPData.md#getsegments)() | Returns an array containing the CDP segments for the customer, or an empty array if no segments found |
| [isEmpty](dw.customer.CustomerCDPData.md#isempty)() | Return true if the CDPData is empty (has no meaningful data) |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### empty
- empty: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Return true if the CDPData is empty (has no meaningful data)


---

### segments
- segments: [String\[\]](TopLevel.String.md) `(read-only)`
  - : Returns an array containing the CDP segments for the customer, or an empty array if no segments found


---

## Method Details

### getSegments()
- getSegments(): [String\[\]](TopLevel.String.md)
  - : Returns an array containing the CDP segments for the customer, or an empty array if no segments found

    **Returns:**
    - a collection containing the CDP segments for the customer


---

### isEmpty()
- isEmpty(): [Boolean](TopLevel.Boolean.md)
  - : Return true if the CDPData is empty (has no meaningful data)

    **Returns:**
    - true if CDPData is empty, false otherwise


---

<!-- prettier-ignore-end -->
