<!-- prettier-ignore-start -->
# Class FormList

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.web.FormElement](dw.web.FormElement.md)
    - [dw.web.FormGroup](dw.web.FormGroup.md)
      - [dw.web.FormList](dw.web.FormList.md)

Represents a list of forms.


## Property Summary

| Property | Description |
| --- | --- |
| [selectManyItems](#selectmanyitems): [List](dw.util.List.md) `(read-only)` | returns the selected list items if the list is  configured to support selection of items. |
| [selectManyObjects](#selectmanyobjects): [List](dw.util.List.md) `(read-only)` | Returns a list of all selected objects if the list is configured  to support the selection of items. |
| [selectOneItem](#selectoneitem): [FormListItem](dw.web.FormListItem.md) `(read-only)` | Returns the default list item if the list is configured to  support the selection of a default item. |
| [selectOneObject](#selectoneobject): [Object](TopLevel.Object.md) `(read-only)` | Returns the selected object if the list is configured to  support the selection of a default item. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getSelectManyItems](dw.web.FormList.md#getselectmanyitems)() | returns the selected list items if the list is  configured to support selection of items. |
| [getSelectManyObjects](dw.web.FormList.md#getselectmanyobjects)() | Returns a list of all selected objects if the list is configured  to support the selection of items. |
| [getSelectOneItem](dw.web.FormList.md#getselectoneitem)() | Returns the default list item if the list is configured to  support the selection of a default item. |
| [getSelectOneObject](dw.web.FormList.md#getselectoneobject)() | Returns the selected object if the list is configured to  support the selection of a default item. |

### Methods inherited from class FormGroup

[accept](dw.web.FormGroup.md#accept), [copyFrom](dw.web.FormGroup.md#copyfromobject), [copyTo](dw.web.FormGroup.md#copytoobject), [getChildCount](dw.web.FormGroup.md#getchildcount), [getError](dw.web.FormGroup.md#geterror), [getObject](dw.web.FormGroup.md#getobject), [getSubmittedAction](dw.web.FormGroup.md#getsubmittedaction), [getTriggeredAction](dw.web.FormGroup.md#gettriggeredaction)
### Methods inherited from class FormElement

[clearFormElement](dw.web.FormElement.md#clearformelement), [getDynamicHtmlName](dw.web.FormElement.md#getdynamichtmlname), [getFormId](dw.web.FormElement.md#getformid), [getHtmlName](dw.web.FormElement.md#gethtmlname), [getParent](dw.web.FormElement.md#getparent), [getValidationResult](dw.web.FormElement.md#getvalidationresult), [invalidateFormElement](dw.web.FormElement.md#invalidateformelement), [invalidateFormElement](dw.web.FormElement.md#invalidateformelementstring), [isValid](dw.web.FormElement.md#isvalid)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### selectManyItems
- selectManyItems: [List](dw.util.List.md) `(read-only)`
  - : returns the selected list items if the list is
      configured to support selection of items.



---

### selectManyObjects
- selectManyObjects: [List](dw.util.List.md) `(read-only)`
  - : Returns a list of all selected objects if the list is configured
      to support the selection of items. The objects are the objects that were
      bound to each row.



---

### selectOneItem
- selectOneItem: [FormListItem](dw.web.FormListItem.md) `(read-only)`
  - : Returns the default list item if the list is configured to
      support the selection of a default item.



---

### selectOneObject
- selectOneObject: [Object](TopLevel.Object.md) `(read-only)`
  - : Returns the selected object if the list is configured to
      support the selection of a default item. The object is the object
      bound to the item.



---

## Method Details

### getSelectManyItems()
- getSelectManyItems(): [List](dw.util.List.md)
  - : returns the selected list items if the list is
      configured to support selection of items.


    **Returns:**
    - a List of FormListItem elements or null if no selection was configured for the form.


---

### getSelectManyObjects()
- getSelectManyObjects(): [List](dw.util.List.md)
  - : Returns a list of all selected objects if the list is configured
      to support the selection of items. The objects are the objects that were
      bound to each row.


    **Returns:**
    - a List of objects or null if no selection was configured for the form.


---

### getSelectOneItem()
- getSelectOneItem(): [FormListItem](dw.web.FormListItem.md)
  - : Returns the default list item if the list is configured to
      support the selection of a default item.


    **Returns:**
    - the default FormListItem elements or null if no selection was configured


---

### getSelectOneObject()
- getSelectOneObject(): [Object](TopLevel.Object.md)
  - : Returns the selected object if the list is configured to
      support the selection of a default item. The object is the object
      bound to the item.


    **Returns:**
    - the selected object.


---

<!-- prettier-ignore-end -->
