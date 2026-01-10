<!-- prettier-ignore-start -->
# Class FormFieldOption

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.web.FormFieldOption](dw.web.FormFieldOption.md)

Represents an option for a form field.


## Property Summary

| Property | Description |
| --- | --- |
| [checked](#checked): [Boolean](TopLevel.Boolean.md) `(read-only)` | Identifies if this option is checked. |
| [htmlValue](#htmlvalue): [String](TopLevel.String.md) `(read-only)` | Returns the value for the HTML value attribute of a HTML option element. |
| [label](#label): [String](TopLevel.String.md) | Returns the value for the HTML label attribute of the HTML option element. |
| [object](#object): [Object](TopLevel.Object.md) `(read-only)` | Returns the object that was bound to this option value. |
| [optionId](#optionid): [String](TopLevel.String.md) `(read-only)` | Returns the ID of the option. |
| [parent](#parent): [FormField](dw.web.FormField.md) `(read-only)` | The parent, which is a field element. |
| [selected](#selected): [Boolean](TopLevel.Boolean.md) `(read-only)` | Identifies if this option is selected. |
| [value](#value): [Object](TopLevel.Object.md) `(read-only)` | The actual value associated with this option. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getHtmlValue](dw.web.FormFieldOption.md#gethtmlvalue)() | Returns the value for the HTML value attribute of a HTML option element. |
| [getLabel](dw.web.FormFieldOption.md#getlabel)() | Returns the value for the HTML label attribute of the HTML option element. |
| [getObject](dw.web.FormFieldOption.md#getobject)() | Returns the object that was bound to this option value. |
| [getOptionId](dw.web.FormFieldOption.md#getoptionid)() | Returns the ID of the option. |
| [getParent](dw.web.FormFieldOption.md#getparent)() | The parent, which is a field element. |
| [getValue](dw.web.FormFieldOption.md#getvalue)() | The actual value associated with this option. |
| [isChecked](dw.web.FormFieldOption.md#ischecked)() | Identifies if this option is checked. |
| [isSelected](dw.web.FormFieldOption.md#isselected)() | Identifies if this option is selected. |
| [setLabel](dw.web.FormFieldOption.md#setlabelstring)([String](TopLevel.String.md)) | Sets the label attribute for this option. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### checked
- checked: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Identifies if this option is checked.


---

### htmlValue
- htmlValue: [String](TopLevel.String.md) `(read-only)`
  - : Returns the value for the HTML value attribute of a HTML option element.


---

### label
- label: [String](TopLevel.String.md)
  - : Returns the value for the HTML label attribute of the HTML option element.
      If not specified in the form option definition the label is identical with
      the string representation of option value (see getValue()).



---

### object
- object: [Object](TopLevel.Object.md) `(read-only)`
  - : Returns the object that was bound to this option value.


---

### optionId
- optionId: [String](TopLevel.String.md) `(read-only)`
  - : Returns the ID of the option. This is an internal ID used to uniquely
      reference this option. If not specified in the form option definition
      the ID is identical with the string representation of the option value
      (see getValue()).



---

### parent
- parent: [FormField](dw.web.FormField.md) `(read-only)`
  - : The parent, which is a field element.


---

### selected
- selected: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Identifies if this option is selected.


---

### value
- value: [Object](TopLevel.Object.md) `(read-only)`
  - : The actual value associated with this option. This value is formatted
      and than returned as HTML value with the method getHtmlValue().



---

## Method Details

### getHtmlValue()
- getHtmlValue(): [String](TopLevel.String.md)
  - : Returns the value for the HTML value attribute of a HTML option element.

    **Returns:**
    - the value for the HTML value attribute of a HTML option element.


---

### getLabel()
- getLabel(): [String](TopLevel.String.md)
  - : Returns the value for the HTML label attribute of the HTML option element.
      If not specified in the form option definition the label is identical with
      the string representation of option value (see getValue()).


    **Returns:**
    - the value for the HTML label attribute of the HTML option element.


---

### getObject()
- getObject(): [Object](TopLevel.Object.md)
  - : Returns the object that was bound to this option value.

    **Returns:**
    - the object that was bound to this option value.


---

### getOptionId()
- getOptionId(): [String](TopLevel.String.md)
  - : Returns the ID of the option. This is an internal ID used to uniquely
      reference this option. If not specified in the form option definition
      the ID is identical with the string representation of the option value
      (see getValue()).


    **Returns:**
    - the ID of the option.


---

### getParent()
- getParent(): [FormField](dw.web.FormField.md)
  - : The parent, which is a field element.

    **Returns:**
    - the parent form field.


---

### getValue()
- getValue(): [Object](TopLevel.Object.md)
  - : The actual value associated with this option. This value is formatted
      and than returned as HTML value with the method getHtmlValue().


    **Returns:**
    - the value associated with this option


---

### isChecked()
- isChecked(): [Boolean](TopLevel.Boolean.md)
  - : Identifies if this option is checked.

    **Returns:**
    - true if this option is checked, false otherwise.


---

### isSelected()
- isSelected(): [Boolean](TopLevel.Boolean.md)
  - : Identifies if this option is selected.

    **Returns:**
    - true if this option is selected, false otherwise.


---

### setLabel(String)
- setLabel(label: [String](TopLevel.String.md)): void
  - : Sets the label attribute for this option.

    **Parameters:**
    - label - the label value.


---

<!-- prettier-ignore-end -->
