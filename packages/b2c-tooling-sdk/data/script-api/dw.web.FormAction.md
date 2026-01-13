<!-- prettier-ignore-start -->
# Class FormAction

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.web.FormElement](dw.web.FormElement.md)
    - [dw.web.FormAction](dw.web.FormAction.md)

The FormAction class represents the action in form instance hierarchy.


## Property Summary

| Property | Description |
| --- | --- |
| [description](#description): [String](TopLevel.String.md) `(read-only)` | Returns the optional description for the action. |
| [label](#label): [String](TopLevel.String.md) `(read-only)` | Returns the optional label for the action. |
| [object](#object): [Object](TopLevel.Object.md) `(read-only)` | Returns the object that was bound to the form in which the action  is contained. |
| [submitted](#submitted): [Boolean](TopLevel.Boolean.md) `(read-only)` | Identifies if the form action was submitted from  the client to the server. |
| [triggered](#triggered): [Boolean](TopLevel.Boolean.md) `(read-only)` | Identifies that this action is triggerd. |
| [x](#x): [Number](TopLevel.Number.md) `(read-only)` | In case of an image button, returns the x coordinate of the last click. |
| [y](#y): [Number](TopLevel.Number.md) `(read-only)` | In case of an image button, returns the y coordinate of the last click. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getDescription](dw.web.FormAction.md#getdescription)() | Returns the optional description for the action. |
| [getLabel](dw.web.FormAction.md#getlabel)() | Returns the optional label for the action. |
| [getObject](dw.web.FormAction.md#getobject)() | Returns the object that was bound to the form in which the action  is contained. |
| [getX](dw.web.FormAction.md#getx)() | In case of an image button, returns the x coordinate of the last click. |
| [getY](dw.web.FormAction.md#gety)() | In case of an image button, returns the y coordinate of the last click. |
| [isSubmitted](dw.web.FormAction.md#issubmitted)() | Identifies if the form action was submitted from  the client to the server. |
| [isTriggered](dw.web.FormAction.md#istriggered)() | Identifies that this action is triggerd. |

### Methods inherited from class FormElement

[clearFormElement](dw.web.FormElement.md#clearformelement), [getDynamicHtmlName](dw.web.FormElement.md#getdynamichtmlname), [getFormId](dw.web.FormElement.md#getformid), [getHtmlName](dw.web.FormElement.md#gethtmlname), [getParent](dw.web.FormElement.md#getparent), [getValidationResult](dw.web.FormElement.md#getvalidationresult), [invalidateFormElement](dw.web.FormElement.md#invalidateformelement), [invalidateFormElement](dw.web.FormElement.md#invalidateformelementstring), [isValid](dw.web.FormElement.md#isvalid)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### description
- description: [String](TopLevel.String.md) `(read-only)`
  - : Returns the optional description for the action. The description could be used
      as tooltip for the action.



---

### label
- label: [String](TopLevel.String.md) `(read-only)`
  - : Returns the optional label for the action. The label would be typically used
      as button text.



---

### object
- object: [Object](TopLevel.Object.md) `(read-only)`
  - : Returns the object that was bound to the form in which the action
      is contained. The method is a convenience method for getParent().getObject().
      In most cases this is actually the object for which
      the specific action is triggered.



---

### submitted
- submitted: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Identifies if the form action was submitted from
      the client to the server.



---

### triggered
- triggered: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Identifies that this action is triggerd. An
      action is only triggered if it was submitted and the constraints, regarding
      a valid form, are met.



---

### x
- x: [Number](TopLevel.Number.md) `(read-only)`
  - : In case of an image button, returns the x coordinate of the last click.


---

### y
- y: [Number](TopLevel.Number.md) `(read-only)`
  - : In case of an image button, returns the y coordinate of the last click.


---

## Method Details

### getDescription()
- getDescription(): [String](TopLevel.String.md)
  - : Returns the optional description for the action. The description could be used
      as tooltip for the action.


    **Returns:**
    - the optional description for the action.


---

### getLabel()
- getLabel(): [String](TopLevel.String.md)
  - : Returns the optional label for the action. The label would be typically used
      as button text.


    **Returns:**
    - the optional label for the action.


---

### getObject()
- getObject(): [Object](TopLevel.Object.md)
  - : Returns the object that was bound to the form in which the action
      is contained. The method is a convenience method for getParent().getObject().
      In most cases this is actually the object for which
      the specific action is triggered.


    **Returns:**
    - the object that was bound to the form in which the action
      is contained.



---

### getX()
- getX(): [Number](TopLevel.Number.md)
  - : In case of an image button, returns the x coordinate of the last click.

    **Returns:**
    - the x coordinate of the last click.


---

### getY()
- getY(): [Number](TopLevel.Number.md)
  - : In case of an image button, returns the y coordinate of the last click.

    **Returns:**
    - the y coordinate of the last click.


---

### isSubmitted()
- isSubmitted(): [Boolean](TopLevel.Boolean.md)
  - : Identifies if the form action was submitted from
      the client to the server.


    **Returns:**
    - true if the form action was submitted, false otherwise.


---

### isTriggered()
- isTriggered(): [Boolean](TopLevel.Boolean.md)
  - : Identifies that this action is triggerd. An
      action is only triggered if it was submitted and the constraints, regarding
      a valid form, are met.


    **Returns:**
    - true if the action is triggered, false otherwise.


---

<!-- prettier-ignore-end -->
