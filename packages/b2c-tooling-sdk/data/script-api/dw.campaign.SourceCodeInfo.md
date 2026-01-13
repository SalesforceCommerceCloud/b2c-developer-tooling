<!-- prettier-ignore-start -->
# Class SourceCodeInfo

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.campaign.SourceCodeInfo](dw.campaign.SourceCodeInfo.md)

Class representing a code (i.e. a "source code") that has been applied to a
customer's session. Source codes can qualify customers for different
campaigns, promotions, and other site experiences from those that the typical
customer sees. Codes are organized into source code groups.


Typically, a code is applied to a customer's session automatically by
Commerce Cloud Digital when a customer accesses a Digital URL with a well
known request parameter in the querystring.  A code may also be explicitly
applied to a customer session using the `SetSourceCode`
pipelet.



## Constant Summary

| Constant | Description |
| --- | --- |
| [STATUS_ACTIVE](#status_active): [Number](TopLevel.Number.md) = 2 | The literal source-code is found and currently active. |
| [STATUS_INACTIVE](#status_inactive): [Number](TopLevel.Number.md) = 1 | The literal source-code is found but not active. |
| [STATUS_INVALID](#status_invalid): [Number](TopLevel.Number.md) = 0 | The literal source-code is not found in the system. |

## Property Summary

| Property | Description |
| --- | --- |
| [code](#code): [String](TopLevel.String.md) `(read-only)` | The literal source-code. |
| [group](#group): [SourceCodeGroup](dw.campaign.SourceCodeGroup.md) `(read-only)` | The associated source-code group. |
| [redirect](#redirect): [URLRedirect](dw.web.URLRedirect.md) `(read-only)` | Retrieves the redirect information from the last processed SourceCodeGroup (active or inactive). |
| [status](#status): [Number](TopLevel.Number.md) `(read-only)` | The status of the source-code. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getCode](dw.campaign.SourceCodeInfo.md#getcode)() | The literal source-code. |
| [getGroup](dw.campaign.SourceCodeInfo.md#getgroup)() | The associated source-code group. |
| [getRedirect](dw.campaign.SourceCodeInfo.md#getredirect)() | Retrieves the redirect information from the last processed SourceCodeGroup (active or inactive). |
| [getStatus](dw.campaign.SourceCodeInfo.md#getstatus)() | The status of the source-code. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### STATUS_ACTIVE

- STATUS_ACTIVE: [Number](TopLevel.Number.md) = 2
  - : The literal source-code is found and currently active.


---

### STATUS_INACTIVE

- STATUS_INACTIVE: [Number](TopLevel.Number.md) = 1
  - : The literal source-code is found but not active.


---

### STATUS_INVALID

- STATUS_INVALID: [Number](TopLevel.Number.md) = 0
  - : The literal source-code is not found in the system.


---

## Property Details

### code
- code: [String](TopLevel.String.md) `(read-only)`
  - : The literal source-code.


---

### group
- group: [SourceCodeGroup](dw.campaign.SourceCodeGroup.md) `(read-only)`
  - : The associated source-code group.


---

### redirect
- redirect: [URLRedirect](dw.web.URLRedirect.md) `(read-only)`
  - : Retrieves the redirect information from the last processed SourceCodeGroup (active or inactive). If none exists,
      then the redirect information is retrieved from the source-code preferences, based on the active/inactive status
      of the SourceCodeGroup. The redirect information is then resolved to the output URL. If the redirect information
      cannot be resolved to a URL, or there is an error retrieving the preferences, then null is returned.



---

### status
- status: [Number](TopLevel.Number.md) `(read-only)`
  - : The status of the source-code.  One of the following:
      STATUS\_INVALID - The source code is not found in the system.
      STATUS\_INACTIVE - The source code is found but not active.
      STATUS\_INACTIVE - The source code is found and active.



---

## Method Details

### getCode()
- getCode(): [String](TopLevel.String.md)
  - : The literal source-code.

    **Returns:**
    - the source-code.


---

### getGroup()
- getGroup(): [SourceCodeGroup](dw.campaign.SourceCodeGroup.md)
  - : The associated source-code group.

    **Returns:**
    - the source-code group.


---

### getRedirect()
- getRedirect(): [URLRedirect](dw.web.URLRedirect.md)
  - : Retrieves the redirect information from the last processed SourceCodeGroup (active or inactive). If none exists,
      then the redirect information is retrieved from the source-code preferences, based on the active/inactive status
      of the SourceCodeGroup. The redirect information is then resolved to the output URL. If the redirect information
      cannot be resolved to a URL, or there is an error retrieving the preferences, then null is returned.


    **Returns:**
    - URLRedirect containing the location and status code, null in case of no redirect was found


---

### getStatus()
- getStatus(): [Number](TopLevel.Number.md)
  - : The status of the source-code.  One of the following:
      STATUS\_INVALID - The source code is not found in the system.
      STATUS\_INACTIVE - The source code is found but not active.
      STATUS\_INACTIVE - The source code is found and active.


    **Returns:**
    - the status.


---

<!-- prettier-ignore-end -->
