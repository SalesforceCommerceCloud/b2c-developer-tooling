<!-- prettier-ignore-start -->
# Class FormElement

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.web.FormElement](dw.web.FormElement.md)

Represents a form element.


## All Known Subclasses
[Form](dw.web.Form.md), [FormAction](dw.web.FormAction.md), [FormField](dw.web.FormField.md), [FormGroup](dw.web.FormGroup.md), [FormList](dw.web.FormList.md), [FormListItem](dw.web.FormListItem.md)
## Property Summary

| Property | Description |
| --- | --- |
| [dynamicHtmlName](#dynamichtmlname): [String](TopLevel.String.md) `(read-only)` | Returns a dynamic html name for the field. |
| [formId](#formid): [String](TopLevel.String.md) `(read-only)` | The ID of the form element. |
| [htmlName](#htmlname): [String](TopLevel.String.md) `(read-only)` | Returns the global unique name of the field, which can be used as name  in the html form. |
| [parent](#parent): [FormElement](dw.web.FormElement.md) `(read-only)` | The parent within the form. |
| [valid](#valid): [Boolean](TopLevel.Boolean.md) `(read-only)` | Identifies if this element and all its children elements are  valid. |
| [validationResult](#validationresult): [FormElementValidationResult](dw.web.FormElementValidationResult.md) `(read-only)` | Provides a combined view on the validation status as per isValid() and getError(). |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [clearFormElement](dw.web.FormElement.md#clearformelement)() | This method clears the whole form. |
| [getDynamicHtmlName](dw.web.FormElement.md#getdynamichtmlname)() | Returns a dynamic html name for the field. |
| [getFormId](dw.web.FormElement.md#getformid)() | The ID of the form element. |
| [getHtmlName](dw.web.FormElement.md#gethtmlname)() | Returns the global unique name of the field, which can be used as name  in the html form. |
| [getParent](dw.web.FormElement.md#getparent)() | The parent within the form. |
| [getValidationResult](dw.web.FormElement.md#getvalidationresult)() | Provides a combined view on the validation status as per isValid() and getError(). |
| [invalidateFormElement](dw.web.FormElement.md#invalidateformelement)() | The method can be called to explicitly invalidate a form element. |
| [invalidateFormElement](dw.web.FormElement.md#invalidateformelementstring)([String](TopLevel.String.md)) | The method can be called to explicitly invalidate a field. |
| [isValid](dw.web.FormElement.md#isvalid)() | Identifies if this element and all its children elements are  valid. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### dynamicHtmlName
- dynamicHtmlName: [String](TopLevel.String.md) `(read-only)`
  - : Returns a dynamic html name for the field. It can be used to suppress any autocompletion
      support from a browser, e.g. for credit card related fields. It can be also
      used for a unique form name, if one form is used multiple times in a page.



---

### formId
- formId: [String](TopLevel.String.md) `(read-only)`
  - : The ID of the form element. The is is unique within the parent
      element of the form.



---

### htmlName
- htmlName: [String](TopLevel.String.md) `(read-only)`
  - : Returns the global unique name of the field, which can be used as name
      in the html form. For radio buttons this name is not unique.



---

### parent
- parent: [FormElement](dw.web.FormElement.md) `(read-only)`
  - : The parent within the form.


---

### valid
- valid: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Identifies if this element and all its children elements are
      valid. A form element, which was not submitted in the last
      request is always valid.



---

### validationResult
- validationResult: [FormElementValidationResult](dw.web.FormElementValidationResult.md) `(read-only)`
  - : Provides a combined view on the validation status as per isValid() and getError(). In
      addition it also provides the data as returned by the validation in case a validation
      script was used.



---

## Method Details

### clearFormElement()
- clearFormElement(): void
  - : This method clears the whole form. After clearing a form it
      contains no value or the default value, is not bound to any business
      object and has the status of being valid.



---

### getDynamicHtmlName()
- getDynamicHtmlName(): [String](TopLevel.String.md)
  - : Returns a dynamic html name for the field. It can be used to suppress any autocompletion
      support from a browser, e.g. for credit card related fields. It can be also
      used for a unique form name, if one form is used multiple times in a page.


    **Returns:**
    - a dynamic html name.


---

### getFormId()
- getFormId(): [String](TopLevel.String.md)
  - : The ID of the form element. The is is unique within the parent
      element of the form.


    **Returns:**
    - the ID of the form.


---

### getHtmlName()
- getHtmlName(): [String](TopLevel.String.md)
  - : Returns the global unique name of the field, which can be used as name
      in the html form. For radio buttons this name is not unique.


    **Returns:**
    - the global unique name of the field.


---

### getParent()
- getParent(): [FormElement](dw.web.FormElement.md)
  - : The parent within the form.

    **Returns:**
    - the parent within the form.


---

### getValidationResult()
- getValidationResult(): [FormElementValidationResult](dw.web.FormElementValidationResult.md)
  - : Provides a combined view on the validation status as per isValid() and getError(). In
      addition it also provides the data as returned by the validation in case a validation
      script was used.


    **Returns:**
    - the validation status (valid, error, data)


---

### invalidateFormElement()
- invalidateFormElement(): void
  - : The method can be called to explicitly invalidate a form element. The
      error text will be set to the one of two possible preconfigured custom
      error messages associated with the form definition. The "value-error"
      message will be used for FormField instances and "form-error" will be
      used for FormGroup instances.



---

### invalidateFormElement(String)
- invalidateFormElement(error: [String](TopLevel.String.md)): void
  - : The method can be called to explicitly invalidate a field. The error
      text is set to the given error message.


    **Parameters:**
    - error - the error text to use.


---

### isValid()
- isValid(): [Boolean](TopLevel.Boolean.md)
  - : Identifies if this element and all its children elements are
      valid. A form element, which was not submitted in the last
      request is always valid.


    **Returns:**
    - true if this element and all its children elements are valid,
      false otherwise.



---

<!-- prettier-ignore-end -->
