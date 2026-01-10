<!-- prettier-ignore-start -->
# Class FormGroup

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.web.FormElement](dw.web.FormElement.md)
    - [dw.web.FormGroup](dw.web.FormGroup.md)

The class is the central class within the whole form handling. It is
the container element for fields and other form elements. A form group
can contain other forms, also called sub-forms.

Access to the elements of a form is provided via an index based access or
via an associative array access. For example, the field "firstname" can be accessed
with the expression "myform.firstname".



## All Known Subclasses
[Form](dw.web.Form.md), [FormList](dw.web.FormList.md), [FormListItem](dw.web.FormListItem.md)
## Property Summary

| Property | Description |
| --- | --- |
| [childCount](#childcount): [Number](TopLevel.Number.md) `(read-only)` | Returns the number of elements in the form. |
| [error](#error): [String](TopLevel.String.md) `(read-only)` | Returns a form-wide error message. |
| [object](#object): [Object](TopLevel.Object.md) `(read-only)` | The object that was bound to this form group. |
| [submittedAction](#submittedaction): [FormAction](dw.web.FormAction.md) `(read-only)` | Returns the action that was submitted with the last request. |
| [triggeredAction](#triggeredaction): [FormAction](dw.web.FormAction.md) `(read-only)` | Returns the action that was triggered with the last request. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [accept](dw.web.FormGroup.md#accept)() | The method copies the value from a form into the object, which was previously  bound to the form. |
| [copyFrom](dw.web.FormGroup.md#copyfromobject)([Object](TopLevel.Object.md)) | The method updates the form with the values from the given object.    The method call is basically equivalent to the pipelet UpdateFormWithObject.    The method not only copies the value, it also binds the object to the form. |
| [copyTo](dw.web.FormGroup.md#copytoobject)([Object](TopLevel.Object.md)) | The method updates the object with the values from the form.    The method call is basically equivalent to the pipelet UpdateObjectWithForm.    The method needs a submitted form. |
| [getChildCount](dw.web.FormGroup.md#getchildcount)() | Returns the number of elements in the form. |
| [getError](dw.web.FormGroup.md#geterror)() | Returns a form-wide error message. |
| [getObject](dw.web.FormGroup.md#getobject)() | The object that was bound to this form group. |
| [getSubmittedAction](dw.web.FormGroup.md#getsubmittedaction)() | Returns the action that was submitted with the last request. |
| [getTriggeredAction](dw.web.FormGroup.md#gettriggeredaction)() | Returns the action that was triggered with the last request. |

### Methods inherited from class FormElement

[clearFormElement](dw.web.FormElement.md#clearformelement), [getDynamicHtmlName](dw.web.FormElement.md#getdynamichtmlname), [getFormId](dw.web.FormElement.md#getformid), [getHtmlName](dw.web.FormElement.md#gethtmlname), [getParent](dw.web.FormElement.md#getparent), [getValidationResult](dw.web.FormElement.md#getvalidationresult), [invalidateFormElement](dw.web.FormElement.md#invalidateformelement), [invalidateFormElement](dw.web.FormElement.md#invalidateformelementstring), [isValid](dw.web.FormElement.md#isvalid)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### childCount
- childCount: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the number of elements in the form.


---

### error
- error: [String](TopLevel.String.md) `(read-only)`
  - : Returns a form-wide error message. If no error message
      is present the method returns null.



---

### object
- object: [Object](TopLevel.Object.md) `(read-only)`
  - : The object that was bound to this form group.


---

### submittedAction
- submittedAction: [FormAction](dw.web.FormAction.md) `(read-only)`
  - : Returns the action that was submitted with the last request. The action is
      set independent whether the form must be valid for this action. The method
      returns null if no action at all was submitted with the last request for this
      form group.



---

### triggeredAction
- triggeredAction: [FormAction](dw.web.FormAction.md) `(read-only)`
  - : Returns the action that was triggered with the last request. An action is
      only marked as triggered if the constraints regarding form validation are
      meet. The method returns null if no action was marked as triggered.



---

## Method Details

### accept()
- accept(): void
  - : The method copies the value from a form into the object, which was previously
      bound to the form. The method is equivalent to the pipelet AcceptForm.
      
      This method is equivalent to the call formgroup.copyFrom( formgroup.object ).



---

### copyFrom(Object)
- copyFrom(obj: [Object](TopLevel.Object.md)): void
  - : The method updates the form with the values from the given object.
      
      
      
      The method call is basically equivalent to the pipelet UpdateFormWithObject.
      
      
      
      The method not only copies the value, it also binds the object to the form. Binding means that the form keeps the
      information from which objects the values were taken. This can be used for two purposes:
      
      1. for lists it makes it easier in the code to find the associated object, for example in case of a related   action, and
      2. it allows to copy back the values from the form into the object (see [accept()](dw.web.FormGroup.md#accept)).
      
      Because of this bind behavior, the operation is also sometimes called a bind-operation.


    **Parameters:**
    - obj - the object from, which the values are read


---

### copyTo(Object)
- copyTo(obj: [Object](TopLevel.Object.md)): void
  - : The method updates the object with the values from the form.
      
      
      
      The method call is basically equivalent to the pipelet UpdateObjectWithForm.
      
      
      
      The method needs a submitted form. The copyTo call is delegated to the form fields. Each form field than checks
      if its value was submitted as part of the form:
      
      - If this is _true_, the object gets updated with the form field value.
      - If this is _false_, the object will not be updated.
      
      This is the reason why you cannot copy values from one object into another object by using
      [copyFrom(Object)](dw.web.FormGroup.md#copyfromobject) and [copyTo(Object)](dw.web.FormGroup.md#copytoobject) within the same request (e.g. by one call to a script or
      controller).


    **Parameters:**
    - obj - the object, which is updated from the form


---

### getChildCount()
- getChildCount(): [Number](TopLevel.Number.md)
  - : Returns the number of elements in the form.

    **Returns:**
    - the number of elements in the form.


---

### getError()
- getError(): [String](TopLevel.String.md)
  - : Returns a form-wide error message. If no error message
      is present the method returns null.


    **Returns:**
    - a form-wide error message or null.


---

### getObject()
- getObject(): [Object](TopLevel.Object.md)
  - : The object that was bound to this form group.

    **Returns:**
    - the bound object.


---

### getSubmittedAction()
- getSubmittedAction(): [FormAction](dw.web.FormAction.md)
  - : Returns the action that was submitted with the last request. The action is
      set independent whether the form must be valid for this action. The method
      returns null if no action at all was submitted with the last request for this
      form group.


    **Returns:**
    - the action that was submitted with the last request or null.


---

### getTriggeredAction()
- getTriggeredAction(): [FormAction](dw.web.FormAction.md)
  - : Returns the action that was triggered with the last request. An action is
      only marked as triggered if the constraints regarding form validation are
      meet. The method returns null if no action was marked as triggered.


    **Returns:**
    - the action that was triggered with the last request.


---

<!-- prettier-ignore-end -->
