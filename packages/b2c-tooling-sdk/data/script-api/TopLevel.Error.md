<!-- prettier-ignore-start -->
# Class Error

- [TopLevel.Object](TopLevel.Object.md)
  - [TopLevel.Error](TopLevel.Error.md)

Error represents a generic exception.


## All Known Subclasses
[APIException](TopLevel.APIException.md)
## Property Summary

| Property | Description |
| --- | --- |
| [message](#message): [String](TopLevel.String.md) | An error message that provides details about the exception. |
| [name](#name): [String](TopLevel.String.md) | The name of the error based on the constructor used. |
| [stack](#stack): [String](TopLevel.String.md) | The script stack trace. |

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [Error](#error)() | Constructs the Error object. |
| [Error](#errorstring)([String](TopLevel.String.md)) | Constructs the Error object  using the specified message. |

## Method Summary

| Method | Description |
| --- | --- |
| static [captureStackTrace](TopLevel.Error.md#capturestacktraceerror-function)([Error](TopLevel.Error.md), [Function](TopLevel.Function.md)) | Fills the [stack](TopLevel.Error.md#stack) property for the passed error. |
| [toString](TopLevel.Error.md#tostring)() | Returns a String representation of the Error. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### message
- message: [String](TopLevel.String.md)
  - : An error message that provides details about the exception.


---

### name
- name: [String](TopLevel.String.md)
  - : The name of the error based on the constructor used.


---

### stack
- stack: [String](TopLevel.String.md)
  - : The script stack trace. 
      
      This property is filled on throwing or via an explicit call [captureStackTrace(Error, Function)](TopLevel.Error.md#capturestacktraceerror-function).



---

## Constructor Details

### Error()
- Error()
  - : Constructs the Error object.


---

### Error(String)
- Error(msg: [String](TopLevel.String.md))
  - : Constructs the Error object
      using the specified message.


    **Parameters:**
    - msg - the message to use,.


---

## Method Details

### captureStackTrace(Error, Function)
- static captureStackTrace(error: [Error](TopLevel.Error.md), constructorOpt: [Function](TopLevel.Function.md)): void
  - : Fills the [stack](TopLevel.Error.md#stack) property for the passed error. 
      
      The optional constructorOpt parameter allows you to pass in a function value. When collecting the stack trace all
      frames above the topmost call to this function, including that call, are left out of the stack trace. This can be
      useful to hide implementation details that won’t be useful to the user. The usual way of defining a custom error
      that captures a stack trace would be:
      
      ```
      function MyError() {
          // fill the stack trace, but hide the call to MyError
          Error.captureStackTrace(this, MyError);
      }
      ```


    **Parameters:**
    - error - The error whose stack trace should be filled.
    - constructorOpt - An optional filter to hide the topmost stack frames.

    **API Version:**
:::note
Available from version 21.2.
:::

---

### toString()
- toString(): [String](TopLevel.String.md)
  - : Returns a String representation of the Error.

    **Returns:**
    - a String representation of the Error.


---

<!-- prettier-ignore-end -->
