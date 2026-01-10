<!-- prettier-ignore-start -->
# Class LogNDC

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.system.LogNDC](dw.system.LogNDC.md)

A Nested Diagnostic Context, or NDC in short, is an instrument to distinguish 
interleaved log output from different sources. Log output is typically 
interleaved when a server handles multiple script calls near-simultaneously.



## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [peek](dw.system.LogNDC.md#peek)() | Looks at the last diagnostic context at the top of this NDC without   removing it. |
| [pop](dw.system.LogNDC.md#pop)() | Clients should call this method before leaving a diagnostic context. |
| [push](dw.system.LogNDC.md#pushstring)([String](TopLevel.String.md)) | Push new diagnostic context information for the current script execution. |
| [remove](dw.system.LogNDC.md#remove)() | Remove the diagnostic context for this script call. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Method Details

### peek()
- peek(): [String](TopLevel.String.md)
  - : Looks at the last diagnostic context at the top of this NDC without 
      removing it.
      The returned value is the value that was pushed last. If no context is 
      available, then the empty string "" is returned.


    **Returns:**
    - String The innermost diagnostic context.


---

### pop()
- pop(): [String](TopLevel.String.md)
  - : Clients should call this method before leaving a diagnostic context.
      The returned value is the value that was pushed last. 
      If no context is available, then the empty string "" is returned.
      NOTE: The NDC is removed after every script execution.


    **Returns:**
    - String The innermost diagnostic context.


---

### push(String)
- push(message: [String](TopLevel.String.md)): void
  - : Push new diagnostic context information for the current script execution.

    **Parameters:**
    - message - - The new diagnostic context information.


---

### remove()
- remove(): void
  - : Remove the diagnostic context for this script call.


---

<!-- prettier-ignore-end -->
