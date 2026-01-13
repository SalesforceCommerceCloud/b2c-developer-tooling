<!-- prettier-ignore-start -->
# Class Form

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.web.FormElement](dw.web.FormElement.md)
    - [dw.web.FormGroup](dw.web.FormGroup.md)
      - [dw.web.Form](dw.web.Form.md)

The class is the top level element in the form instance hierachy.


## Property Summary

| Property | Description |
| --- | --- |
| [secureKeyHtmlName](#securekeyhtmlname): [String](TopLevel.String.md) `(read-only)` | Returns the secure key html name to be used for the hidden input field  that will contain the secure key value. |
| [secureKeyValue](#securekeyvalue): [String](TopLevel.String.md) `(read-only)` | Returns the secure key value that is generated for the form to use  in a hidden input field for authentication. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getSecureKeyHtmlName](dw.web.Form.md#getsecurekeyhtmlname)() | Returns the secure key html name to be used for the hidden input field  that will contain the secure key value. |
| [getSecureKeyValue](dw.web.Form.md#getsecurekeyvalue)() | Returns the secure key value that is generated for the form to use  in a hidden input field for authentication. |

### Methods inherited from class FormGroup

[accept](dw.web.FormGroup.md#accept), [copyFrom](dw.web.FormGroup.md#copyfromobject), [copyTo](dw.web.FormGroup.md#copytoobject), [getChildCount](dw.web.FormGroup.md#getchildcount), [getError](dw.web.FormGroup.md#geterror), [getObject](dw.web.FormGroup.md#getobject), [getSubmittedAction](dw.web.FormGroup.md#getsubmittedaction), [getTriggeredAction](dw.web.FormGroup.md#gettriggeredaction)
### Methods inherited from class FormElement

[clearFormElement](dw.web.FormElement.md#clearformelement), [getDynamicHtmlName](dw.web.FormElement.md#getdynamichtmlname), [getFormId](dw.web.FormElement.md#getformid), [getHtmlName](dw.web.FormElement.md#gethtmlname), [getParent](dw.web.FormElement.md#getparent), [getValidationResult](dw.web.FormElement.md#getvalidationresult), [invalidateFormElement](dw.web.FormElement.md#invalidateformelement), [invalidateFormElement](dw.web.FormElement.md#invalidateformelementstring), [isValid](dw.web.FormElement.md#isvalid)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### secureKeyHtmlName
- secureKeyHtmlName: [String](TopLevel.String.md) `(read-only)`
  - : Returns the secure key html name to be used for the hidden input field
      that will contain the secure key value.



---

### secureKeyValue
- secureKeyValue: [String](TopLevel.String.md) `(read-only)`
  - : Returns the secure key value that is generated for the form to use
      in a hidden input field for authentication.



---

## Method Details

### getSecureKeyHtmlName()
- getSecureKeyHtmlName(): [String](TopLevel.String.md)
  - : Returns the secure key html name to be used for the hidden input field
      that will contain the secure key value.


    **Returns:**
    - the secure key html name


---

### getSecureKeyValue()
- getSecureKeyValue(): [String](TopLevel.String.md)
  - : Returns the secure key value that is generated for the form to use
      in a hidden input field for authentication.


    **Returns:**
    - the secure key value


---

<!-- prettier-ignore-end -->
