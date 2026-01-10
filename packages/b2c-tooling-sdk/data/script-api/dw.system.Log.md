<!-- prettier-ignore-start -->
# Class Log

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.system.Log](dw.system.Log.md)

A log4j like logger instance. To obtain such an instance, use the [Logger.getRootLogger()](dw.system.Logger.md#getrootlogger) or
[Logger.getLogger(String)](dw.system.Logger.md#getloggerstring) or [Logger.getLogger(String, String)](dw.system.Logger.md#getloggerstring-string) methods.



## Property Summary

| Property | Description |
| --- | --- |
| [NDC](#ndc): [LogNDC](dw.system.LogNDC.md) `(read-only)` | Returns the Nested Diagnostic Context for this script call. |
| [debugEnabled](#debugenabled): [Boolean](TopLevel.Boolean.md) `(read-only)` | This method returns true if debug logging is enabled for this logging instance. |
| [errorEnabled](#errorenabled): [Boolean](TopLevel.Boolean.md) `(read-only)` | This method returns true if error logging is enabled for this logging instance. |
| [infoEnabled](#infoenabled): [Boolean](TopLevel.Boolean.md) `(read-only)` | This method returns true if information logging is enabled for this logging instance. |
| [warnEnabled](#warnenabled): [Boolean](TopLevel.Boolean.md) `(read-only)` | This method returns true if warning logging is enabled for this logging instance. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [debug](dw.system.Log.md#debugstring-object)([String](TopLevel.String.md), [Object...](TopLevel.Object.md)) | The method reports an debug level message. |
| [error](dw.system.Log.md#errorstring-object)([String](TopLevel.String.md), [Object...](TopLevel.Object.md)) | The method reports an error level message. |
| [fatal](dw.system.Log.md#fatalstring-object)([String](TopLevel.String.md), [Object...](TopLevel.Object.md)) | The method reports an warning level message. |
| static [getNDC](dw.system.Log.md#getndc)() | Returns the Nested Diagnostic Context for this script call. |
| [info](dw.system.Log.md#infostring-object)([String](TopLevel.String.md), [Object...](TopLevel.Object.md)) | The method reports an information level message. |
| [isDebugEnabled](dw.system.Log.md#isdebugenabled)() | This method returns true if debug logging is enabled for this logging instance. |
| [isErrorEnabled](dw.system.Log.md#iserrorenabled)() | This method returns true if error logging is enabled for this logging instance. |
| [isInfoEnabled](dw.system.Log.md#isinfoenabled)() | This method returns true if information logging is enabled for this logging instance. |
| [isWarnEnabled](dw.system.Log.md#iswarnenabled)() | This method returns true if warning logging is enabled for this logging instance. |
| [warn](dw.system.Log.md#warnstring-object)([String](TopLevel.String.md), [Object...](TopLevel.Object.md)) | The method reports an warning level message. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### NDC
- NDC: [LogNDC](dw.system.LogNDC.md) `(read-only)`
  - : Returns the Nested Diagnostic Context for this script call.


---

### debugEnabled
- debugEnabled: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : This method returns true if debug logging is enabled for this logging instance.


---

### errorEnabled
- errorEnabled: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : This method returns true if error logging is enabled for this logging instance.


---

### infoEnabled
- infoEnabled: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : This method returns true if information logging is enabled for this logging instance.


---

### warnEnabled
- warnEnabled: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : This method returns true if warning logging is enabled for this logging instance.


---

## Method Details

### debug(String, Object...)
- debug(msg: [String](TopLevel.String.md), args: [Object...](TopLevel.Object.md)): void
  - : The method reports an debug level message. Arguments can be embedded into the message, e.g. like "Failure {0} in
      {1}". The method implements the Java MessageFormat.format() syntax.


    **Parameters:**
    - msg - the message to log.
    - args - the arguments to insert into the message.


---

### error(String, Object...)
- error(msg: [String](TopLevel.String.md), args: [Object...](TopLevel.Object.md)): void
  - : The method reports an error level message. Arguments can be embedded into the message, e.g. like "Failure {0} in
      {1}". The method implements the Java MessageFormat.format() syntax.


    **Parameters:**
    - msg - the message to log.
    - args - the arguments to insert into the message.


---

### fatal(String, Object...)
- fatal(msg: [String](TopLevel.String.md), args: [Object...](TopLevel.Object.md)): void
  - : The method reports an warning level message. Arguments can be embedded into the message, e.g. like "Failure {0}
      in {1}". The method implements the Java MessageFormat.format() syntax. Note: Fatal log messages are always
      enabled and optionally send via E-Mail.


    **Parameters:**
    - msg - the message to log.
    - args - the arguments to insert into the message.


---

### getNDC()
- static getNDC(): [LogNDC](dw.system.LogNDC.md)
  - : Returns the Nested Diagnostic Context for this script call.

    **Returns:**
    - the nested diagnostic context


---

### info(String, Object...)
- info(msg: [String](TopLevel.String.md), args: [Object...](TopLevel.Object.md)): void
  - : The method reports an information level message. Arguments can be embedded into the message, e.g. like "Failure
      {0} in {1}". The method implements the Java MessageFormat.format() syntax.


    **Parameters:**
    - msg - the message to log.
    - args - the arguments to insert into the message.


---

### isDebugEnabled()
- isDebugEnabled(): [Boolean](TopLevel.Boolean.md)
  - : This method returns true if debug logging is enabled for this logging instance.

    **Returns:**
    - true if logging of debug messages is enabled, false otherwise.


---

### isErrorEnabled()
- isErrorEnabled(): [Boolean](TopLevel.Boolean.md)
  - : This method returns true if error logging is enabled for this logging instance.

    **Returns:**
    - true if logging of error messages is enabled, false otherwise.


---

### isInfoEnabled()
- isInfoEnabled(): [Boolean](TopLevel.Boolean.md)
  - : This method returns true if information logging is enabled for this logging instance.

    **Returns:**
    - true if logging of information messages is enabled, false otherwise.


---

### isWarnEnabled()
- isWarnEnabled(): [Boolean](TopLevel.Boolean.md)
  - : This method returns true if warning logging is enabled for this logging instance.

    **Returns:**
    - true if logging of warning messages is enabled, false otherwise.


---

### warn(String, Object...)
- warn(msg: [String](TopLevel.String.md), args: [Object...](TopLevel.Object.md)): void
  - : The method reports an warning level message. Arguments can be embedded into the message, e.g. like "Failure {0}
      in {1}". The method implements the Java MessageFormat.format() syntax.


    **Parameters:**
    - msg - the message to log.
    - args - the arguments to insert into the message.


---

<!-- prettier-ignore-end -->
