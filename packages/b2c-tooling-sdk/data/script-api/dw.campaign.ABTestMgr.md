<!-- prettier-ignore-start -->
# Class ABTestMgr

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.campaign.ABTestMgr](dw.campaign.ABTestMgr.md)

Manager class used to access AB-test information in the storefront.


## Property Summary

| Property | Description |
| --- | --- |
| [assignedTestSegments](#assignedtestsegments): [Collection](dw.util.Collection.md) `(read-only)` | Return the AB-test segments to which the current customer is assigned. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| static [getAssignedTestSegments](dw.campaign.ABTestMgr.md#getassignedtestsegments)() | Return the AB-test segments to which the current customer is assigned. |
| static [isParticipant](dw.campaign.ABTestMgr.md#isparticipantstring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Test whether the current customer is a member of the specified AB-test  segment. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### assignedTestSegments
- assignedTestSegments: [Collection](dw.util.Collection.md) `(read-only)`
  - : Return the AB-test segments to which the current customer is assigned.
      AB-test segments deleted in the meantime will not be returned.



---

## Method Details

### getAssignedTestSegments()
- static getAssignedTestSegments(): [Collection](dw.util.Collection.md)
  - : Return the AB-test segments to which the current customer is assigned.
      AB-test segments deleted in the meantime will not be returned.


    **Returns:**
    - unordered collection of ABTestSegment instances representing the
              AB-test segments to which the current customer is assigned.



---

### isParticipant(String, String)
- static isParticipant(testID: [String](TopLevel.String.md), segmentID: [String](TopLevel.String.md)): [Boolean](TopLevel.Boolean.md)
  - : Test whether the current customer is a member of the specified AB-test
      segment. This method can be used to customize the storefront experience
      in ways that are not supported using Business Manager configuration
      alone.


    **Parameters:**
    - testID - The ID of the AB-test, must not be null.
    - segmentID - The ID of the segment within the AB-test, must not be             null.

    **Returns:**
    - true if the current customer is a member of the specified AB-test
              segment, false otherwise.



---

<!-- prettier-ignore-end -->
