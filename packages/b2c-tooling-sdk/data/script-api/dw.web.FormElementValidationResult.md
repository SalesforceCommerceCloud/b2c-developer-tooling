<!-- prettier-ignore-start -->
# Class FormElementValidationResult

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.web.FormElementValidationResult](dw.web.FormElementValidationResult.md)

Represents a form element validation result. The validation script specified for form groups and fields can create
such FormElementValidationResult with the desired validity, message and data and can then return it. The server side form
element validation will evaluate these settings, i.e. calculate the corresponding element validity and message. The optional
data provided with this instance will be kept and can be accessed again from the form element after server side validation.



## Property Summary

| Property | Description |
| --- | --- |
| [data](#data): [Map](dw.util.Map.md) `(read-only)` | Provides optional data acquired during validation. |
| [message](#message): [String](TopLevel.String.md) | Provides an optional message in case of validation failure. |
| [valid](#valid): [Boolean](TopLevel.Boolean.md) | States if the validation succeeded or failed. |

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [FormElementValidationResult](#formelementvalidationresultboolean)([Boolean](TopLevel.Boolean.md)) | Creates a FormElementValidationResult with given setting for the validity but without any message. |
| [FormElementValidationResult](#formelementvalidationresultboolean-string)([Boolean](TopLevel.Boolean.md), [String](TopLevel.String.md)) | Creates a FormElementValidationResult with given setting for the validity and corresponding message. |
| [FormElementValidationResult](#formelementvalidationresultboolean-string-map)([Boolean](TopLevel.Boolean.md), [String](TopLevel.String.md), [Map](dw.util.Map.md)) | Creates a FormElementValidationResult with given setting for the validity and corresponding message. |

## Method Summary

| Method | Description |
| --- | --- |
| [addData](dw.web.FormElementValidationResult.md#adddataobject-object)([Object](TopLevel.Object.md), [Object](TopLevel.Object.md)) | Adds optional data acquired during validation. |
| [getData](dw.web.FormElementValidationResult.md#getdata)() | Provides optional data acquired during validation. |
| [getMessage](dw.web.FormElementValidationResult.md#getmessage)() | Provides an optional message in case of validation failure. |
| [isValid](dw.web.FormElementValidationResult.md#isvalid)() | States if the validation succeeded or failed. |
| [setMessage](dw.web.FormElementValidationResult.md#setmessagestring)([String](TopLevel.String.md)) | Sets an optional message in case of validation failure. |
| [setValid](dw.web.FormElementValidationResult.md#setvalidboolean)([Boolean](TopLevel.Boolean.md)) | Sets if the validation succeeded or failed. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### data
- data: [Map](dw.util.Map.md) `(read-only)`
  - : Provides optional data acquired during validation.


---

### message
- message: [String](TopLevel.String.md)
  - : Provides an optional message in case of validation failure.


---

### valid
- valid: [Boolean](TopLevel.Boolean.md)
  - : States if the validation succeeded or failed.


---

## Constructor Details

### FormElementValidationResult(Boolean)
- FormElementValidationResult(valid: [Boolean](TopLevel.Boolean.md))
  - : Creates a FormElementValidationResult with given setting for the validity but without any message.

    **Parameters:**
    - valid - the desired validity


---

### FormElementValidationResult(Boolean, String)
- FormElementValidationResult(valid: [Boolean](TopLevel.Boolean.md), message: [String](TopLevel.String.md))
  - : Creates a FormElementValidationResult with given setting for the validity and corresponding message.
      This is especially useful to represent a failed validation including some error message.


    **Parameters:**
    - valid - the desired validity
    - message - the desired message


---

### FormElementValidationResult(Boolean, String, Map)
- FormElementValidationResult(valid: [Boolean](TopLevel.Boolean.md), message: [String](TopLevel.String.md), data: [Map](dw.util.Map.md))
  - : Creates a FormElementValidationResult with given setting for the validity and corresponding message.
      This is especially useful to represent a failed validation including some error message. Additional
      data can be stored, too.


    **Parameters:**
    - valid - the desired validity
    - message - the desired message
    - data - the desired data


---

## Method Details

### addData(Object, Object)
- addData(key: [Object](TopLevel.Object.md), value: [Object](TopLevel.Object.md)): void
  - : Adds optional data acquired during validation.

    **Parameters:**
    - key - the key for which the data value will be stored
    - value - the data value that is stored for the given key


---

### getData()
- getData(): [Map](dw.util.Map.md)
  - : Provides optional data acquired during validation.

    **Returns:**
    - the data acquired during validation


---

### getMessage()
- getMessage(): [String](TopLevel.String.md)
  - : Provides an optional message in case of validation failure.

    **Returns:**
    - the message for validation failure


---

### isValid()
- isValid(): [Boolean](TopLevel.Boolean.md)
  - : States if the validation succeeded or failed.

    **Returns:**
    - true if the validation succeeded


---

### setMessage(String)
- setMessage(message: [String](TopLevel.String.md)): void
  - : Sets an optional message in case of validation failure.

    **Parameters:**
    - message - the message for validation failure


---

### setValid(Boolean)
- setValid(valid: [Boolean](TopLevel.Boolean.md)): void
  - : Sets if the validation succeeded or failed.

    **Parameters:**
    - valid - if the validation succeeded


---

<!-- prettier-ignore-end -->
