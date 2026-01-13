<!-- prettier-ignore-start -->
# Class Logger

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.system.Logger](dw.system.Logger.md)

The Logger class provides logging utility methods.


## Property Summary

| Property | Description |
| --- | --- |
| [debugEnabled](#debugenabled): [Boolean](TopLevel.Boolean.md) `(read-only)` | This method returns true if debug logging is enabled. |
| [errorEnabled](#errorenabled): [Boolean](TopLevel.Boolean.md) `(read-only)` | This method returns true if error logging is enabled. |
| [infoEnabled](#infoenabled): [Boolean](TopLevel.Boolean.md) `(read-only)` | This method returns true if info logging is enabled. |
| [rootLogger](#rootlogger): [Log](dw.system.Log.md) `(read-only)` | Returns the root logger object. |
| [warnEnabled](#warnenabled): [Boolean](TopLevel.Boolean.md) `(read-only)` | This method returns true if warning logging is enabled. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| static [debug](dw.system.Logger.md#debugstring-object)([String](TopLevel.String.md), [Object...](TopLevel.Object.md)) | The method reports an debug level message. |
| static [error](dw.system.Logger.md#errorstring-object)([String](TopLevel.String.md), [Object...](TopLevel.Object.md)) | The method reports an error level message. |
| static [getLogger](dw.system.Logger.md#getloggerstring)([String](TopLevel.String.md)) | Returns the logger object for the given category. |
| static [getLogger](dw.system.Logger.md#getloggerstring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Returns the logger object for the given file name prefix and category. |
| static [getRootLogger](dw.system.Logger.md#getrootlogger)() | Returns the root logger object. |
| static [info](dw.system.Logger.md#infostring-object)([String](TopLevel.String.md), [Object...](TopLevel.Object.md)) | The method reports an information level message. |
| static [isDebugEnabled](dw.system.Logger.md#isdebugenabled)() | This method returns true if debug logging is enabled. |
| static [isErrorEnabled](dw.system.Logger.md#iserrorenabled)() | This method returns true if error logging is enabled. |
| static [isInfoEnabled](dw.system.Logger.md#isinfoenabled)() | This method returns true if info logging is enabled. |
| static [isWarnEnabled](dw.system.Logger.md#iswarnenabled)() | This method returns true if warning logging is enabled. |
| static [warn](dw.system.Logger.md#warnstring-object)([String](TopLevel.String.md), [Object...](TopLevel.Object.md)) | The method reports an warning level message. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### debugEnabled
- debugEnabled: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : This method returns true if debug logging is enabled.


---

### errorEnabled
- errorEnabled: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : This method returns true if error logging is enabled.


---

### infoEnabled
- infoEnabled: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : This method returns true if info logging is enabled.


---

### rootLogger
- rootLogger: [Log](dw.system.Log.md) `(read-only)`
  - : Returns the root logger object.


---

### warnEnabled
- warnEnabled: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : This method returns true if warning logging is enabled.


---

## Method Details

### debug(String, Object...)
- static debug(msg: [String](TopLevel.String.md), args: [Object...](TopLevel.Object.md)): void
  - : The method reports an debug level message. Arguments can be embedded
      into the message, e.g. like "Failure {0} in {1}". The method implements
      the Java MessageFormat.format() syntax.


    **Parameters:**
    - msg - the message to log.
    - args - the arguments to insert into the message.


---

### error(String, Object...)
- static error(msg: [String](TopLevel.String.md), args: [Object...](TopLevel.Object.md)): void
  - : The method reports an error level message. Arguments can be embedded
      into the message, e.g. like "Failure {0} in {1}". The method implements
      the Java MessageFormat.format() syntax.


    **Parameters:**
    - msg - the message to log.
    - args - the arguments to insert into the message.


---

### getLogger(String)
- static getLogger(category: [String](TopLevel.String.md)): [Log](dw.system.Log.md)
  - : Returns the logger object for the given category.

    **Parameters:**
    - category - - the category to get the logger for

    **Returns:**
    - the logger object for the given category.


---

### getLogger(String, String)
- static getLogger(fileNamePrefix: [String](TopLevel.String.md), category: [String](TopLevel.String.md)): [Log](dw.system.Log.md)
  - : Returns the logger object for the given file name prefix and category.
      Throws an exception if maximum number of custom log files per day has already been obtained.


    **Parameters:**
    - fileNamePrefix - - the file name prefix to identify the logger  must not be null or an empty string,  must be at least 3 characters long,  can contain characters a-z A-Z 0-9 '-' '\_' only,  can have up to 25 characters  must not start or end with '-' or '\_'  can only start or end with a-z A-Z 0-9
    - category - - the category to get the logger for, must not be null

    **Returns:**
    - the logger object for the given category.


---

### getRootLogger()
- static getRootLogger(): [Log](dw.system.Log.md)
  - : Returns the root logger object.

    **Returns:**
    - the root logger object.


---

### info(String, Object...)
- static info(msg: [String](TopLevel.String.md), args: [Object...](TopLevel.Object.md)): void
  - : The method reports an information level message. Arguments can be embedded
      into the message, e.g. like "Failure {0} in {1}". The method implements
      the Java MessageFormat.format() syntax.


    **Parameters:**
    - msg - the message to log.
    - args - the arguments to insert into the message.


---

### isDebugEnabled()
- static isDebugEnabled(): [Boolean](TopLevel.Boolean.md)
  - : This method returns true if debug logging is enabled.

    **Returns:**
    - true if logging of debug messages is enabled, false otherwise.


---

### isErrorEnabled()
- static isErrorEnabled(): [Boolean](TopLevel.Boolean.md)
  - : This method returns true if error logging is enabled.

    **Returns:**
    - true if logging of error messages is enabled, false otherwise.


---

### isInfoEnabled()
- static isInfoEnabled(): [Boolean](TopLevel.Boolean.md)
  - : This method returns true if info logging is enabled.

    **Returns:**
    - true if logging of info messages is enabled, false otherwise.


---

### isWarnEnabled()
- static isWarnEnabled(): [Boolean](TopLevel.Boolean.md)
  - : This method returns true if warning logging is enabled.

    **Returns:**
    - true if logging of warn messages is enabled, false otherwise.


---

### warn(String, Object...)
- static warn(msg: [String](TopLevel.String.md), args: [Object...](TopLevel.Object.md)): void
  - : The method reports an warning level message. Arguments can be embedded
      into the message, e.g. like "Failure {0} in {1}". The method implements
      the Java MessageFormat.format() syntax.


    **Parameters:**
    - msg - the message to log.
    - args - the arguments to insert into the message.


---

<!-- prettier-ignore-end -->
