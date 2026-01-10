<!-- prettier-ignore-start -->
# Class ABTestSegment

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.object.PersistentObject](dw.object.PersistentObject.md)
    - [dw.campaign.ABTestSegment](dw.campaign.ABTestSegment.md)

Object representing an AB-test segment in the Commerce Cloud Digital.


Each AB-test defines 1 or more segments to which customers are randomly
assigned by the platform when they qualify for the AB-test. Customers are
assigned to segments according to allocation percentages controlled by the
merchant. Each AB-test segment defines a set of "experiences" that the
merchant is testing and which which apply only to the customers in that
segment.  There is always one "control" segment which contains only the
default set of experiences for that site.



## Property Summary

| Property | Description |
| --- | --- |
| [ABTest](#abtest): [ABTest](dw.campaign.ABTest.md) `(read-only)` | Get the AB-test to which this segment belongs. |
| [ID](#id): [String](TopLevel.String.md) `(read-only)` | Get the ID of the AB-test segment. |
| [controlSegment](#controlsegment): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns true if this is the "control segment" for the AB-test, meaning  the segment that has no experiences associated with it. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getABTest](dw.campaign.ABTestSegment.md#getabtest)() | Get the AB-test to which this segment belongs. |
| [getID](dw.campaign.ABTestSegment.md#getid)() | Get the ID of the AB-test segment. |
| [isControlSegment](dw.campaign.ABTestSegment.md#iscontrolsegment)() | Returns true if this is the "control segment" for the AB-test, meaning  the segment that has no experiences associated with it. |

### Methods inherited from class PersistentObject

[getCreationDate](dw.object.PersistentObject.md#getcreationdate), [getLastModified](dw.object.PersistentObject.md#getlastmodified), [getUUID](dw.object.PersistentObject.md#getuuid)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### ABTest
- ABTest: [ABTest](dw.campaign.ABTest.md) `(read-only)`
  - : Get the AB-test to which this segment belongs.


---

### ID
- ID: [String](TopLevel.String.md) `(read-only)`
  - : Get the ID of the AB-test segment.


---

### controlSegment
- controlSegment: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns true if this is the "control segment" for the AB-test, meaning
      the segment that has no experiences associated with it.



---

## Method Details

### getABTest()
- getABTest(): [ABTest](dw.campaign.ABTest.md)
  - : Get the AB-test to which this segment belongs.

    **Returns:**
    - the AB-test to which this segment belongs.


---

### getID()
- getID(): [String](TopLevel.String.md)
  - : Get the ID of the AB-test segment.

    **Returns:**
    - the ID of the AB-test segment.


---

### isControlSegment()
- isControlSegment(): [Boolean](TopLevel.Boolean.md)
  - : Returns true if this is the "control segment" for the AB-test, meaning
      the segment that has no experiences associated with it.


    **Returns:**
    - true if this segment is the "control segment" for the AB-test, or
              false otherwise.



---

<!-- prettier-ignore-end -->
