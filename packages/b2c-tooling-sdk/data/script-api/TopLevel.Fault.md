<!-- prettier-ignore-start -->
# Class Fault

- [TopLevel.Object](TopLevel.Object.md)
  - [TopLevel.Error](TopLevel.Error.md)
    - [TopLevel.Fault](TopLevel.Fault.md)

This error indicates an RPC related error in the system. The Fault
is always related to a systems internal Java exception. The class provides
access to some more details about this internal Java exception. In particular
it provides details about the error send from the remote system.



## Property Summary

| Property | Description |
| --- | --- |
| [causeFullName](#causefullname): [String](TopLevel.String.md) | If the exception is associated with a root cause, the property  contains the full name of the associated Java exception. |
| [causeMessage](#causemessage): [String](TopLevel.String.md) | If the exception is associated with a root cause, the property  contains the message of the associated Java exception. |
| [causeName](#causename): [String](TopLevel.String.md) | If the exception is associated with a root cause, the property  contains the simplified name of the associated Java exception. |
| [faultActor](#faultactor): [String](TopLevel.String.md) | Provides some information on who cause the fault along the message  path. |
| [faultCode](#faultcode): [String](TopLevel.String.md) | An identifier for the specific fault. |
| [faultDetail](#faultdetail): [String](TopLevel.String.md) | More detailed information about the fault. |
| [faultString](#faultstring): [String](TopLevel.String.md) | A human readable description for the fault. |
| [javaFullName](#javafullname): [String](TopLevel.String.md) | The full name of the underlying Java exception. |
| [javaMessage](#javamessage): [String](TopLevel.String.md) | The message of the underlying Java exception. |
| [javaName](#javaname): [String](TopLevel.String.md) | The simplified name of the underlying Java exception. |

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [Fault](#fault)() |  |

## Method Summary

### Methods inherited from class Error

[captureStackTrace](TopLevel.Error.md#capturestacktraceerror-function), [toString](TopLevel.Error.md#tostring)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### causeFullName
- causeFullName: [String](TopLevel.String.md)
  - : If the exception is associated with a root cause, the property
      contains the full name of the associated Java exception.



---

### causeMessage
- causeMessage: [String](TopLevel.String.md)
  - : If the exception is associated with a root cause, the property
      contains the message of the associated Java exception.



---

### causeName
- causeName: [String](TopLevel.String.md)
  - : If the exception is associated with a root cause, the property
      contains the simplified name of the associated Java exception.



---

### faultActor
- faultActor: [String](TopLevel.String.md)
  - : Provides some information on who cause the fault along the message
      path.



---

### faultCode
- faultCode: [String](TopLevel.String.md)
  - : An identifier for the specific fault.


---

### faultDetail
- faultDetail: [String](TopLevel.String.md)
  - : More detailed information about the fault.


---

### faultString
- faultString: [String](TopLevel.String.md)
  - : A human readable description for the fault.


---

### javaFullName
- javaFullName: [String](TopLevel.String.md)
  - : The full name of the underlying Java exception.


---

### javaMessage
- javaMessage: [String](TopLevel.String.md)
  - : The message of the underlying Java exception.


---

### javaName
- javaName: [String](TopLevel.String.md)
  - : The simplified name of the underlying Java exception.


---

## Constructor Details

### Fault()
- Fault()
  - : 


---

<!-- prettier-ignore-end -->
